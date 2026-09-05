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
      body: JSON.stringify({ evidenceIds: ['ev-movein-photo', 'ev-chat', 'ev-contract', 'ev-repair'] }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.data.status, 'partially_supported');
    assert.equal(body.data.score, 88);
    assert.equal(body.data.chain.length, 4);
    assert.ok(body.data.sources.length >= 1);
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
