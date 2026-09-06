/*
 * Offline campaign adapter for live demos.
 *
 * The canonical case content still lives in backend/src/campaign-cases.js so the
 * API can serve it later. Importing that pure data module here keeps the demo
 * playable when the optional API service is unavailable.
 */
// @ts-ignore The shared CommonJS data module intentionally has no separate declaration file.
import campaignModule from '../../../backend/src/campaign-cases.js';

type LocalCase = {
  id: string;
  levelId: number;
  levelTitle: string;
  desc: string;
  difficulty: number;
  goal: string;
  keyEvidenceIds: string[];
  title: string;
  summary: string;
  type: string;
  playerSide: string;
  opponentSide: string;
  focus: string[];
  scenes: unknown[];
  documents: unknown[];
  evidence: Array<{ id: string; title: string; proofPurpose: string }>;
};

const cases = (campaignModule as { campaignCases: LocalCase[] }).campaignCases;

export function localLevels() {
  return cases.map(({ id, levelId, levelTitle, desc, difficulty, goal, keyEvidenceIds }) => ({
    id, levelId, title: levelTitle, desc, difficulty, goal, keyEvidenceCount: keyEvidenceIds.length,
  }));
}

export function localCase(identifier: string) {
  return cases.find((item) => item.id === identifier || String(item.levelId) === identifier) || null;
}

export function localRespond(caseData: LocalCase, argument: string, evidenceIds: string[], historyCount: number) {
  const evidence = caseData.evidence.filter((item) => evidenceIds.includes(item.id));
  const topic = historyCount % Math.max(1, caseData.focus.length);
  const linkedTitles = evidence.slice(0, 2).map((item) => `“${item.title}”`).join('、');
  const response = evidence.length
    ? `对方代理人：已收到${linkedTitles}。请继续说明这些材料与“${caseData.focus[topic]}”的关联。`
    : `对方代理人：关于“${caseData.focus[topic]}”，目前只是单方陈述，请提交本案原件。`;
  const judge = evidence.length ? `本轮围绕“${caseData.focus[topic]}”，已提交 ${evidence.length} 份材料。` : '当前未出示有效的本关证据。';
  const scoreChange = evidence.length ? Math.min(30, 2 + evidence.length * 3) : -7;
  return {
    caseId: caseData.id, response, judge, scoreChange,
    turn: { id: `local-turn-${Date.now()}`, speaker: 'opponent', argument, evidenceIds, response, judge, scoreChange, createdAt: new Date().toISOString() },
  };
}

export function localVerdict(caseData: LocalCase, evidenceIds: string[]) {
  const keyEvidence = caseData.evidence.filter((item) => caseData.keyEvidenceIds.includes(item.id));
  const chain = keyEvidence.filter((item) => evidenceIds.includes(item.id)).map((item) => `${item.title}：${item.proofPurpose}`);
  const complete = chain.length === keyEvidence.length;
  return {
    caseId: caseData.id,
    status: complete ? 'partially_supported' : 'insufficient_evidence',
    winner: complete ? `${caseData.playerSide}（请求获支持或部分支持）` : '待裁决 · 关键证据不足',
    score: complete ? 88 : Math.min(62, chain.length * 14),
    award: complete ? '训练裁决：关键证据链已闭合。' : `请补充本关关键材料：${keyEvidence.filter((item) => !evidenceIds.includes(item.id)).map((item) => item.title).join('、')}。`,
    chain: chain.length ? chain : ['尚无可核验的本关关键证据'],
    reasoning: complete ? '现有材料能够互相印证本关主要争点。' : `现有材料尚不能完整回应：${caseData.focus.join('；')}。`,
    sources: [],
    disclaimer: '虚构案件的规则化训练反馈，不是真实法院或仲裁机构裁决，不构成法律意见。',
  };
}
