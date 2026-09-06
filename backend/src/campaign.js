const { randomUUID } = require('node:crypto');
const { campaignCases } = require('./campaign-cases');

const demoCase = campaignCases[0];

function resolveCase(identifier) {
  // Omitted IDs keep the original demo API compatible. Explicit unknown IDs never fall back.
  if (identifier === undefined || identifier === null) return demoCase;
  const selected = campaignCases.find((item) => item.id === identifier || String(item.levelId) === String(identifier));
  if (!selected) {
    const error = new Error('关卡不存在，请从关卡地图重新选择');
    error.statusCode = 404;
    throw error;
  }
  return selected;
}

function getCampaignLevels() {
  return campaignCases.map(({ id, levelId, levelTitle, desc, difficulty, goal, keyEvidenceIds }) => ({
    id, levelId, title: levelTitle, desc, difficulty, goal, keyEvidenceCount: keyEvidenceIds.length,
  }));
}

function getCampaignCase(identifier) {
  const { judgment, adversary, keywords, ...caseData } = resolveCase(identifier);
  return structuredClone(caseData);
}

function selectEvidence(caseData, input) {
  const ids = new Set(Array.isArray(input.evidenceIds) ? input.evidenceIds : []);
  // Unknown IDs, duplicates and evidence from other levels cannot earn points or complete a chain.
  return caseData.evidence.filter((item) => ids.has(item.id));
}

function respondToDebate(input) {
  const caseData = resolveCase(input.caseId ?? input.levelId);
  const argument = String(input.argument || '').trim();
  if (!argument) {
    const error = new Error('argument 不能为空');
    error.statusCode = 400;
    throw error;
  }
  const evidence = selectEvidence(caseData, input);
  const evidenceIds = evidence.map((item) => item.id);
  const missing = caseData.keyEvidenceIds.filter((id) => !evidenceIds.includes(id));
  const history = Array.isArray(input.history) ? input.history.filter((turn) => turn && (!turn.caseId || turn.caseId === caseData.id)) : [];
  const matches = caseData.keywords.map((words) => words.filter((word) => argument.includes(word)).length);
  const coverage = matches.filter(Boolean).length;
  const topic = Math.max(...matches) > 0 ? matches.indexOf(Math.max(...matches)) : history.length % caseData.focus.length;
  const linkedTitles = evidence.slice(0, 2).map((item) => `“${item.title}”`).join('、');
  const missingTitles = caseData.evidence.filter((item) => missing.includes(item.id)).map((item) => item.title);
  const response = evidence.length
    ? `对方代理人：已收到${linkedTitles}。${caseData.adversary[topic]}`
    : `对方代理人：关于“${caseData.focus[topic]}”，目前只是单方陈述，请提交能定位到原件的本案证据。`;
  const judge = !evidence.length
    ? '当前未出示有效的本关证据，不能以其他案件的材料替代举证。'
    : `本轮围绕“${caseData.focus[topic]}”。${coverage ? `已关联${coverage}项争点。` : '论点尚未具体回应本案争点。'}${missing.length ? `尚缺关键材料：${missingTitles.join('、')}。` : '关键材料已齐备，仍须解释其与请求的关联及证明力。'}`;
  const scoreChange = evidence.length ? Math.min(30, 2 + evidence.length * 3 + coverage * 4) : -7;
  const won = missing.length === 0 && coverage >= 2;
  const turn = {
    id: randomUUID(), caseId: caseData.id, speaker: 'opponent', argument, evidenceIds,
    response, judge, scoreChange, createdAt: new Date().toISOString(),
  };
  return {
    caseId: caseData.id, levelId: caseData.levelId, turn, response, judge, scoreChange,
    opponentScoreChange: won ? -18 : scoreChange > 10 ? -6 : 2,
    nextPrompt: won ? '关键证据链已闭合，可以请求训练裁决。' : `请继续围绕“${caseData.focus[topic]}”补充原件和论证。`,
    status: won ? 'ready_for_verdict' : 'in_progress', historyCount: history.length + 1,
  };
}

function buildVerdict(input) {
  const caseData = resolveCase(input.caseId ?? input.levelId);
  const evidence = selectEvidence(caseData, input);
  const evidenceIds = evidence.map((item) => item.id);
  const missing = caseData.evidence.filter((item) => caseData.keyEvidenceIds.includes(item.id) && !evidenceIds.includes(item.id));
  const complete = missing.length === 0;
  const chain = evidence.filter((item) => caseData.keyEvidenceIds.includes(item.id)).map((item) => `${item.title}：${item.proofPurpose}`);
  return {
    caseId: caseData.id, levelId: caseData.levelId,
    status: complete ? 'partially_supported' : 'insufficient_evidence',
    winner: complete ? `${caseData.playerSide}（请求获支持或部分支持）` : '待裁决 · 关键证据不足',
    score: complete ? 88 : Math.min(62, chain.length * 14),
    award: complete ? caseData.judgment.award : `请补充本关关键材料：${missing.map((item) => item.title).join('、')}。`,
    chain: chain.length ? chain : ['尚无可核验的本关关键证据'],
    reasoning: complete ? caseData.judgment.reasoning : `现有材料尚不能完整回应：${caseData.focus.join('；')}。`,
    sources: caseData.judgment.sources,
    disclaimer: '虚构案件的规则化训练反馈，不是真实法院或仲裁机构裁决，不构成法律意见。',
  };
}

module.exports = { getCampaignLevels, getCampaignCase, demoCase, respondToDebate, buildVerdict };
