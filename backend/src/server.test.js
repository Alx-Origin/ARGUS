const assert = require('node:assert/strict');
const test = require('node:test');
const { createServer } = require('./server');

async function withServer(run) {
  const server = createServer({ corsOrigin: '*' });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test('GET /health returns the standalone Node.js service status', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'argus-backend');
    assert.equal(body.runtime, 'node');
  });
});

test('POST /api/cases/draft creates a case draft', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/cases/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        concept: '租客退租后房东扣留押金3000元',
        plaintiff: '租客张某',
        defendant: '房东李某',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.data.caseType, '房屋租赁合同纠纷');
    assert.match(body.data.focus[1], /3000元/);
  });
});

test('POST /api/contracts/audit returns rule-based findings', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/contracts/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        position: '乙方',
        text: '乙方应尽快完成交付。如乙方违约，甲方有权没收全部保证金。',
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.data.summary.position, '乙方');
    assert.ok(body.data.summary.findingCount >= 3);
    assert.ok(body.data.summary.highRiskCount >= 2);
  });
});

test('invalid JSON returns a 400 response', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/contracts/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{bad json',
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.message, '请求体必须是有效 JSON');
  });
});

test('comma-separated CORS origins support Vercel production and preview hosts', async () => {
  const server = createServer({ corsOrigin: 'https://argus.vercel.app,https://preview.argus.vercel.app' });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const response = await fetch(`${baseUrl}/health`, {
      headers: { Origin: 'https://preview.argus.vercel.app' },
    });
    assert.equal(response.headers.get('access-control-allow-origin'), 'https://preview.argus.vercel.app');
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('GET /api/campaign/demo exposes complete rental evidence sources', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/campaign/demo`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.data.id, 'rental-deposit-001');
    assert.ok(body.data.scenes.length >= 3);
    assert.ok(body.data.documents.every((document) => document.content));
    assert.ok(body.data.evidence.some((evidence) => evidence.sourceRange === '第五条'));
  });
});

test('POST /api/campaign/respond changes response based on evidence actually submitted', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/campaign/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        argument: '入住照片和微信确认都证明墙面划痕在入住前已经存在，维修报价也没有付款凭证。',
        evidenceIds: ['ev-movein-photo', 'ev-chat', 'ev-repair'],
        history: [],
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.match(body.data.response, /入住照片/);
    assert.ok(body.data.scoreChange > 10);
    assert.equal(body.data.status, 'in_progress');
  });
});

test('POST /api/campaign/verdict returns the explainable evidence-chain result', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/campaign/verdict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evidenceIds: ['ev-movein-photo', 'ev-chat', 'ev-contract', 'ev-repair'], gameResult: 'player_win' }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.data.status, 'player_win');
    assert.equal(body.data.gameResult, 'player_win');
    assert.equal(body.data.score, 88);
    assert.equal(body.data.chain.length, 4);
    assert.ok(body.data.sources.length >= 1);
  });
});

const historicalLevelTitles = ['押金猎人', '七天无理由', '加班费幽灵', '信息饕餮', '版权窃贼', '竞业锁链', '格式条款恶魔', '仲裁迷宫', '证据湮灭', '终极审判'];

async function postCampaign(baseUrl, route, data) {
  const response = await fetch(`${baseUrl}/api/campaign/${route}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  return { response, body: await response.json() };
}

test('all ten historical levels have distinct, complete and reachable cases', async () => {
  await withServer(async (baseUrl) => {
    const { data: levels } = await (await fetch(`${baseUrl}/api/campaign/levels`)).json();
    assert.deepEqual(levels.map((level) => level.title), historicalLevelTitles);
    assert.deepEqual(levels.map((level) => level.difficulty), [1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
    assert.equal(new Set(levels.map((level) => level.id)).size, 10);
    const allEvidenceIds = new Set();
    for (const level of levels) {
      const response = await fetch(`${baseUrl}/api/campaign/cases/${level.id}`);
      const { data: caseData } = await response.json();
      assert.equal(response.status, 200);
      assert.equal(caseData.id, level.id);
      assert.equal(caseData.levelId, level.levelId);
      assert.equal(caseData.levelTitle, level.title);
      assert.ok(caseData.title.startsWith(level.title));
      assert.ok(caseData.summary && caseData.goal && caseData.playerSide && caseData.opponentSide);
      assert.equal(caseData.focus.length, 3);
      assert.equal(caseData.scenes.length, 3);
      assert.equal(caseData.cards.length, 4);
      assert.ok(caseData.cards.every((card) => card.text && card.cost <= 4));
      assert.equal(caseData.keyEvidenceIds.length, level.keyEvidenceCount);
      assert.ok(caseData.keyEvidenceIds.length <= caseData.actionPoints, 'key chain must be attainable within the AP budget');
      assert.equal(caseData.judgment, undefined, 'case endpoint does not leak the verdict');
      const sceneEvidence = new Set(caseData.scenes.flatMap((scene) => scene.hotspots.map((spot) => spot.evidenceId)));
      const documentEvidence = new Set(caseData.documents.flatMap((document) => document.hotspots.map((spot) => spot.evidenceId)));
      const documents = new Map(caseData.documents.map((document) => [document.id, document]));
      for (const evidence of caseData.evidence) {
        assert.ok(!allEvidenceIds.has(evidence.id), 'evidence identifiers must not be shared across cases');
        allEvidenceIds.add(evidence.id);
        assert.ok(sceneEvidence.has(evidence.id));
        assert.ok(documentEvidence.has(evidence.id));
        const source = documents.get(evidence.sourceDocumentId);
        assert.ok(source?.content.includes('虚构训练材料'));
        assert.ok(source.hotspots.some((spot) => spot.evidenceId === evidence.id));
        assert.ok(evidence.sourceRange && evidence.proofPurpose);
      }
      assert.ok([...sceneEvidence, ...documentEvidence, ...caseData.keyEvidenceIds].every((id) => caseData.evidence.some((evidence) => evidence.id === id)));
      const { data: numberedCase } = await (await fetch(`${baseUrl}/api/campaign/cases/${level.levelId}`)).json();
      assert.equal(numberedCase.id, caseData.id);
      if (level.levelId > 1) assert.doesNotMatch(JSON.stringify(caseData), /墙面|房东|租客|退租/);
    }
  });
});

test('each level completes its own debate and verdict, and verdict follows the game result', async () => {
  await withServer(async (baseUrl) => {
    for (let levelId = 1; levelId <= 10; levelId += 1) {
      const { data: caseData } = await (await fetch(`${baseUrl}/api/campaign/cases/${levelId}`)).json();
      const payload = { caseId: caseData.id, evidenceIds: caseData.keyEvidenceIds, gameResult: 'player_win' };
      for (const card of caseData.cards) {
        const { response, body } = await postCampaign(baseUrl, 'respond', { ...payload, argument: card.text });
        assert.equal(response.status, 200);
        assert.equal(body.data.caseId, caseData.id);
        assert.equal(body.data.turn.argument, card.text);
        assert.deepEqual(new Set(body.data.turn.evidenceIds), new Set(caseData.keyEvidenceIds));
        assert.ok(body.data.scoreChange > 10);
        if (levelId > 1) assert.doesNotMatch(body.data.response + body.data.judge, /押金|墙面|房东|租客/);
      }
      const { response, body } = await postCampaign(baseUrl, 'verdict', payload);
      assert.equal(response.status, 200);
      assert.equal(body.data.caseId, caseData.id);
      assert.equal(body.data.status, 'player_win');
      assert.equal(body.data.gameResult, 'player_win');
      assert.ok(body.data.winner.includes(caseData.playerSide));
      assert.equal(body.data.chain.length, caseData.keyEvidenceIds.length);
      assert.ok(body.data.award && body.data.reasoning && body.data.sources.length);
      if (levelId > 1) assert.doesNotMatch(JSON.stringify(body.data), /押金|墙面|房东|租客/);
      const { body: partial } = await postCampaign(baseUrl, 'verdict', { ...payload, evidenceIds: caseData.keyEvidenceIds.slice(1) });
      assert.equal(partial.data.status, 'player_win');
      assert.equal(partial.data.gameResult, 'player_win');
      assert.equal(partial.data.score, body.data.score);
      assert.equal(partial.data.winner, body.data.winner);
      assert.equal(partial.data.award, body.data.award);
      assert.ok(partial.data.chain.length < body.data.chain.length);
    }
  });
});

test('unknown levels fail explicitly instead of silently loading the rental demo', async () => {
  await withServer(async (baseUrl) => {
    for (const identifier of ['0', '11', 'unknown-case', 'toString']) {
      assert.equal((await fetch(`${baseUrl}/api/campaign/cases/${identifier}`)).status, 404);
      for (const route of ['respond', 'verdict']) {
        const { response } = await postCampaign(baseUrl, route, { caseId: identifier, argument: '本案证据', evidenceIds: ['ev-contract'] });
        assert.equal(response.status, 404);
      }
    }
    assert.equal((await postCampaign(baseUrl, 'respond', { caseId: 'overtime-pay-003', argument: '   ' })).response.status, 400);
  });
});

test('foreign, fabricated and duplicate evidence cannot complete or inflate another case', async () => {
  await withServer(async (baseUrl) => {
    const { data: caseData } = await (await fetch(`${baseUrl}/api/campaign/cases/2`)).json();
    const foreignIds = ['ev-movein-photo', 'ev-chat', 'ev-contract', 'ev-repair', 'made-up'];
    const input = { caseId: caseData.id, argument: caseData.cards[0].text, evidenceIds: foreignIds, gameResult: 'opponent_win' };
    const { body: debate } = await postCampaign(baseUrl, 'respond', input);
    assert.deepEqual(debate.data.turn.evidenceIds, []);
    assert.ok(debate.data.scoreChange < 0);
    const { body: verdict } = await postCampaign(baseUrl, 'verdict', input);
    assert.equal(verdict.data.status, 'opponent_win');
    assert.equal(verdict.data.score, 0);
    assert.equal(verdict.data.gameResult, 'opponent_win');
    const oneKey = caseData.keyEvidenceIds.slice(0, 1);
    const { body: single } = await postCampaign(baseUrl, 'respond', { ...input, evidenceIds: oneKey });
    const { body: duplicates } = await postCampaign(baseUrl, 'respond', { ...input, evidenceIds: [...oneKey, ...oneKey, ...foreignIds] });
    assert.equal(single.data.scoreChange, duplicates.data.scoreChange);
    assert.deepEqual(duplicates.data.turn.evidenceIds, oneKey);
  });
});

test('verdict requires an explicit game result and never infers the outcome from evidence', async () => {
  await withServer(async (baseUrl) => {
    const { data: caseData } = await (await fetch(`${baseUrl}/api/campaign/cases/1`)).json();
    const completeEvidence = caseData.keyEvidenceIds;
    const missingEvidence = completeEvidence.slice(0, 1);

    const missingResult = await postCampaign(baseUrl, 'verdict', { caseId: caseData.id, evidenceIds: completeEvidence });
    assert.equal(missingResult.response.status, 400);

    const playerWon = await postCampaign(baseUrl, 'verdict', { caseId: caseData.id, evidenceIds: missingEvidence, gameResult: 'player_win' });
    const opponentWon = await postCampaign(baseUrl, 'verdict', { caseId: caseData.id, evidenceIds: completeEvidence, gameResult: 'opponent_win' });
    assert.equal(playerWon.body.data.gameResult, 'player_win');
    assert.equal(playerWon.body.data.status, 'player_win');
    assert.equal(playerWon.body.data.winner.includes(caseData.playerSide), true);
    assert.equal(opponentWon.body.data.gameResult, 'opponent_win');
    assert.equal(opponentWon.body.data.status, 'opponent_win');
    assert.equal(opponentWon.body.data.winner.includes(caseData.opponentSide), true);
    assert.equal(opponentWon.body.data.chain.length, completeEvidence.length);
  });
});

test('POST /api/community/posts requires explicit share content', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/community/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '缺少正文' }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.match(body.error.message, /title 和 body/);
  });
});
