'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CatDocument, EvidenceArtwork, artworkFor } from './components/cat-evidence';
import { artworkForEvidence } from './lib/evidence-art';
import { createCourtSfx, soundForEffect } from './lib/court-sfx';
import { battleReducer, canAffordCard, emptyBattle, HAND_SIZE, PLAYER_MAX_HP, PLAYER_MAX_SHIELD, PLAYER_MAX_STAMINA, TURN_SECONDS, OPPONENT_REACTION_DELAY_MS, type BattleCard as EvidenceCard, type BattleEffect, type BattleStage } from './lib/court-battle';

type CaseDraft = {
  id: string;
  title: string;
  caseType: string;
  jurisdiction: string;
  side: string;
  parties: { plaintiff: string; defendant: string };
  focus: string[];
  evidencePlan: string[];
  source: string;
  trace?: { amount: string; needsVerification: boolean };
};

type LawSource = { sourceId?: string; title: string; article: string; url: string; status: string };
type AuditFinding = {
  id: string;
  clauseIndex: number;
  clauseRange: { start: number; end: number };
  clause: string;
  category: string;
  severity: 'high' | 'medium';
  skill_id: string;
  skill_name: string;
  skill_version: string;
  issue: string;
  direction: string;
  suggested_text: string;
  suggestion: string;
  necessity: number;
  confidence: number;
  law_sources: LawSource[];
  pending_questions: string[];
  status: string;
};
type AuditResult = {
  summary: { position: string; contractType: string; background: string; clauseCount: number; findingCount: number; highRiskCount: number; sourceCoverage: number };
  findings: AuditFinding[];
  skills: string[];
  engine: string;
  disclaimer: string;
};

type CampaignEvidence = { id: string; title: string; description: string; proofPurpose: string; credibility: number; type?: string; sourceDocumentId?: string; sourceRange?: string; authenticity?: string; relevance?: string };
type CampaignScene = { id: string; title: string; description: string; hotspots: Array<{ id: string; title: string; icon: string; evidenceId: string; hint: string }> };
type CampaignDocument = { id: string; name: string; type: string; content: string; hotspots: Array<{ id: string; evidenceId: string; label: string }> };
type CampaignLevel = { id: string; levelId: number; title: string; desc: string; difficulty: number; goal: string; keyEvidenceCount: number };
type DemoCase = { id: string; levelId: number; levelTitle: string; title: string; summary: string; type: string; difficulty: number; playerSide: string; opponentSide: string; goal: string; actionPoints?: number; focus: string[]; scenes: CampaignScene[]; documents: CampaignDocument[]; evidence: CampaignEvidence[]; keyEvidenceIds: string[] };
type DebateResult = { caseId: string; courtTurn?: number; response: string; judge: string; scoreChange: number; turn?: { id: string; speaker: string; argument: string; evidenceIds: string[]; response: string; judge: string; scoreChange: number; createdAt: string } };
type GameResult = 'player_win' | 'opponent_win';
type Verdict = { caseId: string; gameResult: GameResult; status: GameResult; winner: string; score: number; award: string; chain: string[]; reasoning: string; sources: LawSource[]; disclaimer: string };

type CommunityPost = { id: string; author: string; time: string; title: string; body: string; tags: string[]; likes: number; comments: number };

/* Collected exhibits form the attack deck; recovery cards replenish stamina. */
const EVIDENCE_NATURE: Record<string, { label: string; power: number }> = {
  document: { label: '书证', power: 3 },
  image: { label: '影像物证', power: 3 },
  img: { label: '影像物证', power: 3 },
  payment: { label: '支付凭证', power: 3 },
  receipt: { label: '单据', power: 2 },
  chat: { label: '对话记录', power: 2 },
};

const BEGINNER_LEVEL_ID = 1;
const BEGINNER_ENEMY_HP = 20;

function evidenceCard(item: CampaignEvidence, key: boolean, levelId = 0): EvidenceCard {
  const nature = EVIDENCE_NATURE[item.type || 'document'] || { label: '其他材料', power: 2 };
  const credibility = item.credibility >= 9 ? 2 : item.credibility >= 7 ? 1 : 0;
  const value = (key ? 3 : 1) + nature.power + credibility;
  // The rental dispute is the tutorial encounter. Its evidence remains just as
  // strong, but the first four cards should be affordable from the starting
  // stamina pool instead of forcing a recovery-card draw before the player has
  // learned the combat loop.
  const cost = levelId === BEGINNER_LEVEL_ID
    ? Math.max(2, Math.min(4, Math.ceil(value / 3)))
    : Math.max(2, Math.min(6, Math.ceil(value / 2)));
  return {
    id: `card-${item.id}`, evidenceId: item.id, name: item.title,
    nature: nature.label, key, value,
    credibility: item.credibility,
    cost, staminaRecovery: 0, shieldGain: 0,
    effectText: `造成 ${value} 点伤害 · 消耗 ${cost} 点体力`,
    // Cites its own exhibit so the rebuttal engine can match it against the case's disputes.
    text: `依据「${item.title}」：${item.description}${item.proofPurpose}`,
  };
}

function buildHand(demo: DemoCase, evidenceIds: string[]): EvidenceCard[] {
  return evidenceIds
    .map((id) => demo.evidence.find((item) => item.id === id))
    .filter((item): item is CampaignEvidence => Boolean(item))
    .map((item) => evidenceCard(item, demo.keyEvidenceIds.includes(item.id), demo.levelId));
}

/* Keep case difficulty tied to the strongest four exhibits, independent of random draws. */
function opponentHealth(demo: DemoCase) {
  const health = demo.evidence
    .map((item) => evidenceCard(item, demo.keyEvidenceIds.includes(item.id), demo.levelId))
    .sort((a, b) => Number(b.key) - Number(a.key) || b.value - a.value)
    .slice(0, HAND_SIZE)
    // Keep the first case readable as a tutorial: one full player health bar
    // is a clear target, while later cases retain their evidence-derived scale.
    .reduce((total, card) => total + card.value, 0);
  return demo.levelId === BEGINNER_LEVEL_ID ? Math.min(BEGINNER_ENEMY_HP, health) : health;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const raw = await response.text();
  let body: { data?: T; error?: { message?: string } } = {};
  try { body = raw ? JSON.parse(raw) : {}; } catch { body = {}; }
  if (!response.ok) throw new Error(body?.error?.message || `请求失败：${response.status}`);
  return (body.data !== undefined ? body.data : body) as T;
}

function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file, 'utf-8');
  });
}

export default function HomePage() {
  const pathname = usePathname();
  const router = useRouter();
  const apiBaseUrl = useMemo(() => (process.env.NEXT_PUBLIC_API_BASE_URL || '/argus-api').replace(/\/$/, ''), []);
  const [caseDraft, setCaseDraft] = useState<CaseDraft | null>(null);
  const [caseLoading, setCaseLoading] = useState(false);
  const [caseError, setCaseError] = useState('');
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);

  useEffect(() => {
    if (pathname !== '/campaign') router.replace('/campaign');
  }, [pathname, router]);

  async function createCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCaseLoading(true); setCaseError('');
    try {
      const form = new FormData(event.currentTarget);
      setCaseDraft(await requestJson<CaseDraft>(`${apiBaseUrl}/api/cases/draft`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(form.entries())) }));
    } catch (error) { setCaseError(error instanceof Error ? error.message : '案件生成失败'); }
    finally { setCaseLoading(false); }
  }

  async function auditContract(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuditLoading(true); setAuditError('');
    try {
      const form = new FormData(event.currentTarget);
      setAuditResult(await requestJson<AuditResult>(`${apiBaseUrl}/api/contracts/audit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(form.entries())) }));
    } catch (error) { setAuditError(error instanceof Error ? error.message : '合同审查失败'); }
    finally { setAuditLoading(false); }
  }

  return (
    <main>
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <h1 className="sr-only">你的证词有猫饼 · Meow Court</h1>
      <header className="masthead">
        <button className="brand" onClick={() => router.push('/campaign')} aria-label="返回首页">
          <img src="/assets/lawyer-cat-transparent.png" alt="Meow Court 律师猫" />
          <span className="brand-wordmark">
            <strong className="cat-title">你的证词有猫饼</strong>
            <small className="cat-subtitle">Meow Court<span className="wordmark-paw" aria-hidden="true">🐾</span></small>
          </span>
          <svg className="paw-gavel" viewBox="0 0 88 76" fill="none" aria-hidden="true" focusable="false">
            <path d="M42 66h34l4 6H38z" fill="#b97843" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
            <g className="paw-gavel-swing" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="m24 54 35-30" stroke="#171717" strokeWidth="9" />
              <path d="m24 54 35-30" stroke="#b97843" strokeWidth="4" />
              <path d="m48 15 8-7 23 26-8 7z" fill="#b97843" />
              <path d="m47 16 10-9M70 42l10-9" strokeWidth="6" />
              <path d="M5 63 19 45c-3-5-1-10 3-10 2-6 7-6 10-2 5-2 9 2 8 6 6 4 3 10-2 12L23 70" fill="#fff1dc" />
              <path d="M22 52c-2-4 1-9 5-8 4-3 9 0 8 4-1 5-9 8-13 4Z" fill="#df9c9c" strokeWidth="1.5" />
              <path d="m22 40 1 1m7-3 1 2m6 2-1 2" stroke="#df9c9c" strokeWidth="4" />
            </g>
            <g className="paw-gavel-tap" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="m59 56-1-5m12 7 4-4m-25 4-4-3" />
            </g>
          </svg>
        </button>
      </header>

      <div className="page-shell" id="main-content">


        <CampaignSection />
      </div>
    </main>
  );
}

function ForgeSection({ onSubmit, loading, error, draft }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; loading: boolean; error: string; draft: CaseDraft | null }) {
  return <section className="workspace-grid">
    <form className="panel" onSubmit={onSubmit}>
      <PanelHeading eyebrow="CASE FORGE" title="案件工坊" badge="P0 · 案件配置" />
      <p className="section-intro">输入一个真实争议概念，系统会先生成可编辑的训练草案。原始材料、金额和待核验事项不会被示例文本覆盖。</p>
      <label>案件概念<textarea name="concept" required defaultValue="租客退房时，房东以墙面划痕为由扣留押金3000元，但划痕在入住前已存在。" /></label>
      <div className="field-grid"><label>原告<input name="plaintiff" defaultValue="租客张某" /></label><label>被告<input name="defendant" defaultValue="房东李某" /></label><label>代理立场<select name="side" defaultValue="plaintiff"><option value="plaintiff">原告</option><option value="defendant">被告</option></select></label><label>管辖地区<select name="jurisdiction" defaultValue="中国大陆"><option>中国大陆</option><option>中国香港</option><option>跨境示范</option></select></label></div>
      <div className="upload-note"><span className="note-mark" aria-hidden="true">材料</span><div><strong>材料接入（MVP）</strong><small>可先粘贴原文；合同审查页支持 TXT / MD 文本文件。PDF、Word、图片解析接口保留在下一迭代。</small></div></div>
      <button className="button primary" disabled={loading}>{loading ? '正在配置案件…' : '生成案件草案 →'}</button>{error && <p className="error-message">{error}</p>}
    </form>
    <div className="panel result-panel"><PanelHeading eyebrow="CASE SPACE" title="案件空间" badge={draft ? '已配置' : '等待输入'} />
      {draft ? <div className="result-stack"><div className="case-title-row"><span className="tag">{draft.caseType}</span><span className="tag">{draft.jurisdiction}</span></div><h3>{draft.title}</h3><div className="party-grid"><div><small>原告</small><strong>{draft.parties.plaintiff}</strong></div><div><small>被告</small><strong>{draft.parties.defendant}</strong></div></div><InfoList title="争议焦点" items={draft.focus} /><InfoList title="建议先找的原件" items={draft.evidencePlan} /><div className="trace-box"><strong>可追溯状态</strong><span>来源：{draft.source}</span><span>金额：{draft.trace?.amount || '待核验'} · 需要人工确认</span></div></div> : <EmptyState text="案件草案会在这里生成，并可作为法庭闯关的事实底稿。" />}
    </div>
  </section>;
}

function AuditSection({ onSubmit, loading, error, result }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; loading: boolean; error: string; result: AuditResult | null }) {
  const [fileName, setFileName] = useState('选择 TXT / MD 原文');
  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    setFileName(`已载入：${file.name}`);
    const textArea = document.getElementById('audit-text') as HTMLTextAreaElement | null;
    if (!textArea) return;
    if (!/\.(txt|md|text)$/i.test(file.name)) { setFileName(`${file.name} · 请粘贴可读文本`); return; }
    readTextFile(file).then((text) => { textArea.value = text; }).catch(() => setFileName(`${file.name} · 读取失败`));
  }
  function loadSample() {
    const textArea = document.getElementById('audit-text') as HTMLTextAreaElement | null;
    const bg = document.getElementById('audit-background') as HTMLTextAreaElement | null;
    if (textArea) textArea.value = '第一条 乙方承租甲方商铺用于餐饮经营，具体面积和交付条件另行协商。\n第二条 租赁期限自商铺交付之日起三年，乙方应尽快完成装修并开业。\n第三条 乙方应按甲方通知的金额和日期支付租金及其他费用。\n第四条 如乙方违约，甲方有权没收全部保证金，并要求乙方赔偿全部损失。\n第五条 双方发生争议，可向仲裁机构仲裁或向法院起诉。';
    if (bg) bg.value = '我方作为商场出租方，拟与餐饮品牌签署三年商铺租赁合同。';
    setFileName('已加载租赁示例');
  }
  return <section className="audit-shell">
    <form className="panel audit-intake" onSubmit={onSubmit}><PanelHeading eyebrow="CONTRACT HUNT" title="合同猎魔" badge="P1 · 多 Skill" /><p className="section-intro">通用合同 Skill 先看完整性，专项 Skill 再看行业风险。每条意见都会返回命中的原文、Skill 版本、法律来源和待确认问题。</p><label>合同背景<textarea id="audit-background" name="background" placeholder="交易目的、履行阶段、我方主要风险偏好…" /></label><div className="field-grid"><label>我方合同地位<select name="position" defaultValue="乙方"><option>甲方</option><option>乙方</option><option>其他</option></select></label><label>合同类型<select name="contractType" defaultValue="房屋租赁合同"><option>房屋租赁合同</option><option>采购合同</option><option>服务合同</option><option>通用合同</option></select></label></div><label className="file-picker"><span>原文文件</span><input type="file" accept=".txt,.md,.text" onChange={handleFile} /><small>{fileName} · 文件默认只在当前浏览器读取</small></label><label>合同原文<textarea id="audit-text" name="text" required className="contract-input" defaultValue={'第一条 乙方承租甲方商铺用于餐饮经营，具体面积和交付条件另行协商。\n第二条 租赁期限自商铺交付之日起三年，乙方应尽快完成装修并开业。\n第三条 乙方应按甲方通知的金额和日期支付租金及其他费用。\n第四条 如乙方违约，甲方有权没收全部保证金，并要求乙方赔偿全部损失。\n第五条 双方发生争议，可向仲裁机构仲裁或向法院起诉。'} /></label><div className="button-row"><button type="button" className="button secondary" onClick={loadSample}>加载租赁示例</button><button className="button primary" disabled={loading}>{loading ? '正在逐条审查…' : '开始合同审查 →'}</button></div>{error && <p className="error-message">{error}</p>}</form>
    <div className="panel audit-results"><PanelHeading eyebrow="REVIEW DESK" title="风险图鉴 & 对照稿" badge={result ? `${result.summary.findingCount} 条发现` : '等待审查'} />{result ? <><div className="stat-grid"><Stat label="识别条款" value={result.summary.clauseCount} /><Stat label="风险发现" value={result.summary.findingCount} /><Stat label="高风险" value={result.summary.highRiskCount} /></div><div className="audit-meta"><span>我方：{result.summary.position}</span><span>类型：{result.summary.contractType}</span><span>来源覆盖：{Math.round(result.summary.sourceCoverage * 100)}%</span></div><div className="skill-row">{result.skills.map((skill) => <span className="tag" key={skill}>{skill}</span>)}</div><div className="findings-list">{result.findings.map((finding) => <FindingCard finding={finding} key={finding.id} />)}</div><p className="disclaimer">{result.disclaimer}</p></> : <EmptyState text="审查结果会逐条对齐原文与修改方向，并显示可点击的法律来源。" />}</div>
  </section>;
}

function CampaignSection() {
  const apiBaseUrl = useMemo(() => (process.env.NEXT_PUBLIC_API_BASE_URL || '/argus-api').replace(/\/$/, ''), []);
  const [levels, setLevels] = useState<CampaignLevel[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [demo, setDemo] = useState<DemoCase | null>(null);
  const [completed, setCompleted] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setDemo(null);
    const load = selectedId
      ? requestJson<DemoCase>(`${apiBaseUrl}/api/campaign/cases/${encodeURIComponent(selectedId)}`, { signal: controller.signal }).then((data) => {
        if (data.id !== selectedId) throw new Error('案件与所选关卡不一致，请重试');
        if (!controller.signal.aborted) setDemo(data);
      })
      : requestJson<CampaignLevel[]>(`${apiBaseUrl}/api/campaign/levels`, { signal: controller.signal }).then((data) => {
        if (!controller.signal.aborted) setLevels(data);
      });
    load.catch((e: Error) => { if (!controller.signal.aborted) setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [apiBaseUrl, selectedId, retry]);

  const selectLevel = (id: string | null) => { setDemo(null); setError(''); setLoading(true); setSelectedId(id); };
  const nextLevel = levels[levels.findIndex((level) => level.id === selectedId) + 1];
  if (selectedId && demo?.id === selectedId) return <CampaignRun
    key={demo.id} demo={demo} apiBaseUrl={apiBaseUrl} onBack={() => selectLevel(null)}
    onComplete={(score) => setCompleted((items) => ({ ...items, [demo.id]: Math.max(items[demo.id] || 0, score) }))}
    onNext={nextLevel ? () => selectLevel(nextLevel.id) : undefined}
  />;
  if (loading || error || selectedId) return <section className="panel loading-panel" aria-label="法庭闯关">
    {selectedId && <button type="button" className="button secondary" onClick={() => selectLevel(null)}>← 返回关卡地图</button>}
    {error ? <><p className="error-message" role="alert">{error}</p><button type="button" className="button primary" onClick={() => setRetry((value) => value + 1)}>重新加载</button></> : <p role="status">正在载入{selectedId ? '本关案件' : '关卡地图'}…</p>}
  </section>;
  const recommended = levels.find((level) => !completed[level.id])?.id;
  return <section className="campaign-shell campaign-map-shell" aria-label="法庭闯关关卡选择">
    <div className="campaign-header"><div><h2>法庭闯关 <small>证据 → 卡牌 → 裁决</small></h2><p className="campaign-lead">先在案发现场搜证，再把证据编成卡牌连击。10 个独立案件，由押金纠纷逐步进阶到综合审判。</p></div><div className="campaign-header-stats"><span className="tag">搜证 + 庭审</span><span className="tag ready">全部 {levels.length} 关开放</span><span className="tag">本次完成 {Object.keys(completed).length}/{levels.length}</span></div></div>
    <div className="campaign-map">{levels.map((level) => <button type="button" key={level.id} className={`level-node ${completed[level.id] ? 'completed' : level.id === recommended ? 'current' : ''}`} onClick={() => selectLevel(level.id)}>
      <span className="level-num">{level.levelId}</span><strong className="level-title">{level.title}</strong><small>{level.desc}</small><small>难度 {level.difficulty}/5 · {level.keyEvidenceCount} 份关键证据</small><span className="level-stars">{completed[level.id] ? '★★★' : '☆☆☆'}</span>
    </button>)}</div>
    <div className="panel campaign-rules"><strong>闯关目标</strong><span>阅读本关案情与争议焦点 · 自由查看并收集关键原件 · 结合证据出牌、回应质疑并请求裁决</span></div>
    <p className="disclaimer">全部案件与原件均为虚构训练材料；进度仅记录本次页面会话，不构成法律意见。</p>
  </section>;
}

function CampaignRun({ demo, apiBaseUrl, onBack, onComplete, onNext }: { demo: DemoCase; apiBaseUrl: string; onBack: () => void; onComplete: (score: number) => void; onNext?: () => void }) {
  const [phase, setPhase] = useState<'investigate' | 'court'>('investigate');
  const [sceneId, setSceneId] = useState(demo.scenes[0].id);
  const [documentId, setDocumentId] = useState(demo.documents[0].id);
  const [discovered, setDiscovered] = useState<string[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
  const [investigationScore, setInvestigationScore] = useState(0);
  const [investigationLog, setInvestigationLog] = useState<string[]>([]);
  const maxEnemyHp = useMemo(() => opponentHealth(demo), [demo]);
  const [battle, dispatchBattle] = useReducer(battleReducer, maxEnemyHp, emptyBattle);
  const { enemyHp, playerHp, playerShield, stamina: playerStamina, hand: courtHand, turn, cardsPlayed, result: battleResult, effect: courtEffect } = battle;
  const [turnTimer, setTurnTimer] = useState(TURN_SECONDS);
  const [score, setScore] = useState(0);
  const [debate, setDebate] = useState<DebateResult[]>([]);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [briefOpen, setBriefOpen] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const battleMusicRef = useRef<HTMLAudioElement | null>(null);
  const lossSoundRef = useRef<HTMLAudioElement | null>(null);
  const courtSfxRef = useRef<ReturnType<typeof createCourtSfx> | null>(null);
  const lastSoundEffectRef = useRef<BattleEffect | null>(null);

  const responseRequestRef = useRef<AbortController | null>(null);

  useEffect(() => () => {
    responseRequestRef.current?.abort();
    lossSoundRef.current?.pause();
    courtSfxRef.current?.dispose();
    courtSfxRef.current = null;
  }, []);

  // Sound follows committed combat effects, so invalid clicks and the reaction
  // pause are silent. A counterattack's thump occurs only when its hit lands.
  useEffect(() => {
    if (phase !== 'court' || !courtEffect || courtEffect === lastSoundEffectRef.current) return;
    lastSoundEffectRef.current = courtEffect;
    courtSfxRef.current?.play(soundForEffect(courtEffect));
  }, [phase, courtEffect]);

  useEffect(() => {
    if (phase !== 'court') {
      battleMusicRef.current?.pause();
      battleMusicRef.current = null;
      return;
    }
    const music = new Audio('/assets/audio/day6-bgm.wav');
    music.loop = true;
    music.volume = 0.34;
    battleMusicRef.current = music;
    music.play().catch(() => undefined);
    return () => {
      music.pause();
      music.currentTime = 0;
      if (battleMusicRef.current === music) battleMusicRef.current = null;
    };
  }, [phase]);

  useEffect(() => {
    if (!battleResult) return;
    battleMusicRef.current?.pause();
    if (battleResult === 'opponent_win') {
      const sound = new Audio('/assets/audio/error-lose.mp3');
      sound.volume = 0.8;
      lossSoundRef.current = sound;
      sound.play().catch(() => undefined);
      return () => sound.pause();
    }
  }, [battleResult]);

  // A full action locks the hand until both the play and the counterattack finish.
  useEffect(() => {
    if (phase !== 'court' || battleResult || verdict) return;
    if (battle.stage === 'player-action') {
      const timer = window.setTimeout(() => dispatchBattle({ type: 'opponent', levelId: demo.levelId }), OPPONENT_REACTION_DELAY_MS);
      return () => window.clearTimeout(timer);
    }
    if (battle.stage === 'opponent-action') {
      const timer = window.setTimeout(() => {
        setTurnTimer(TURN_SECONDS);
        dispatchBattle({ type: 'next' });
      }, 850);
      return () => window.clearTimeout(timer);
    }
  }, [phase, battle.stage, battleResult, verdict, demo.levelId]);

  useEffect(() => {
    if (phase !== 'court' || battle.stage !== 'player' || submitting || verdict) return;
    const deadline = Date.now() + TURN_SECONDS * 1000;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTurnTimer(remaining);
      if (remaining === 0) {
        window.clearInterval(timer);
        dispatchBattle({ type: 'opponent', levelId: demo.levelId, timeout: true });
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [phase, battle.stage, turn, submitting, verdict, demo.levelId]);

  async function submitArgumentText(text: string) {
    const controller = new AbortController();
    responseRequestRef.current?.abort();
    responseRequestRef.current = controller;
    setSubmitting(true);
    try {
      const result = await requestJson<DebateResult>(`${apiBaseUrl}/api/campaign/respond`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: demo.id, argument: text, evidenceIds: discovered, history: debate }),
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (result.caseId !== demo.id) throw new Error('对方回应与当前案件不一致，请重试');
      setDebate((items) => [...items, { ...result, courtTurn: turn }]);
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : '提交论点失败');
    } finally {
      if (!controller.signal.aborted) setSubmitting(false);
    }
  }

  function playCard(card: EvidenceCard) {
    if (phase !== 'court' || battle.stage !== 'player' || submitting || verdict || battleResult) return;
    const current = courtHand.find((item) => item.id === card.id);
    if (!current || !canAffordCard(current, playerStamina, playerShield)) return;
    courtSfxRef.current?.unlock();
    setError('');
    dispatchBattle({ type: 'play', cardId: current.id, seed: Math.floor(Math.random() * 4294967296) });
    setScore((value) => value + current.value);
    // Recovery is a tactical action, not fabricated evidence for the legal API.
    if (current.evidenceId) void submitArgumentText(current.text);
  }

  function returnToInvestigation() {
    responseRequestRef.current?.abort();
    lossSoundRef.current?.pause();
    courtSfxRef.current?.dispose();
    courtSfxRef.current = null;
    lastSoundEffectRef.current = null;
    setPhase('investigate'); setVerdict(null); setSubmitting(false); setError('');
    dispatchBattle({ type: 'reset', enemyHp: maxEnemyHp });
  }

  async function requestVerdict() {
    if (!battleResult || submitting || verdict) return;
    setSubmitting(true); setError('');
    try {
      const result = await requestJson<Verdict>(`${apiBaseUrl}/api/campaign/verdict`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ caseId: demo.id, evidenceIds: discovered, debate, gameResult: battleResult }) });
      if (result.caseId !== demo.id) throw new Error('裁决与当前案件不一致，请重试');
      setVerdict(result);
      if (result.gameResult === 'player_win') onComplete(result.score);
    }
    catch (e) { setError(e instanceof Error ? e.message : '裁决请求失败'); }
    finally { setSubmitting(false); }
  }

  const activeScene = demo.scenes.find((scene) => scene.id === sceneId) || demo.scenes[0];
  const activeDocument = demo.documents.find((doc) => doc.id === documentId) || demo.documents[0];
  const discoverEvidence = (id: string, label = '新证据') => {
    if (phase !== 'investigate') return;
    if (discovered.includes(id)) {
      // Clicking a collected clue again withdraws it everywhere: the source clue is
      // unmarked, the right-hand inventory card disappears, and any hand selection is
      // cleared with it.
      setDiscovered((ids) => ids.filter((item) => item !== id));
      setSelectedEvidence((ids) => ids.filter((item) => item !== id));
      setInvestigationScore((value) => Math.max(0, value - 5));
      setInvestigationLog((items) => [`取消证据：${label}`, ...items].slice(0, 5));
      setError('');
      return;
    }
    setDiscovered((ids) => [...ids, id]);
    // Auto-selected only while there is room in the four-card hand.
    setSelectedEvidence((ids) => (ids.includes(id) || ids.length >= HAND_SIZE ? ids : [...ids, id]));
    setInvestigationScore((value) => value + 5);
    setInvestigationLog((items) => [`发现证据：${label}`, ...items].slice(0, 5));
  };
  const toggleEvidence = (id: string) => {
    // A selected card represents a collected exhibit that is going to court.
    // Clicking it again withdraws the exhibit entirely, so it disappears from
    // the inventory instead of lingering as an unselected white card.
    if (selectedEvidence.includes(id)) {
      const item = demo.evidence.find((evidence) => evidence.id === id);
      setDiscovered((ids) => ids.filter((itemId) => itemId !== id));
      setSelectedEvidence((ids) => ids.filter((itemId) => itemId !== id));
      setInvestigationScore((value) => Math.max(0, value - 5));
      setInvestigationLog((items) => [`取消证据：${item?.title || '证据'}`, ...items].slice(0, 5));
      setError('');
      return;
    }
    setSelectedEvidence((ids) => {
      if (ids.length >= HAND_SIZE) { setError(`上庭最多带 ${HAND_SIZE} 张证据卡，请先取消一张。`); return ids; }
      setError('');
      return [...ids, id];
    });
  };
  const enterCourt = () => {
    if (!selectedEvidence.length) { setError('请先选择至少一张证据卡。'); return; }
    // Unlock Web Audio in the entry click, before delayed combat effects run.
    courtSfxRef.current ??= createCourtSfx();
    courtSfxRef.current.unlock();
    lastSoundEffectRef.current = null;
    dispatchBattle({
      type: 'start', deck: buildHand(demo, discovered), selectedIds: selectedEvidence,
      enemyHp: maxEnemyHp, seed: Math.floor(Math.random() * 4294967296),
    });
    setPhase('court'); setTurnTimer(TURN_SECONDS); setVerdict(null);
    setDebate([]); setScore(0); setSubmitting(false); setError('');
  };
  return <section className="campaign-shell campaign-run-shell" aria-label="法庭闯关">
    <div className="compact-run-nav"><button type="button" className="icon-back" onClick={onBack} aria-label="返回关卡地图">←</button><div className="phase-rail"><span className={phase === 'investigate' ? 'active' : 'done'}>搜证</span><i>→</i><span className={phase === 'court' ? 'active' : ''}>卡牌庭审</span><i>→</i><span className={verdict ? 'active' : ''}>裁决</span></div></div>{briefOpen && <div className="level-brief-overlay"><div className="level-brief-card"><span className="brief-stamp">CASE {demo.levelId}</span><h2>{demo.title}</h2><p>{demo.summary}</p><h3>本关目标</h3><p>{demo.goal}</p><button type="button" className="button primary" onClick={() => setBriefOpen(false)}>开始搜证 →</button></div></div>}<div className="campaign-intro-wrap"><button type="button" className="button secondary back-to-map">← 返回关卡地图</button><div className="panel campaign-intro"><div><span className="tag ready">第 {demo.levelId} 关 · {demo.type} · 难度 {demo.difficulty}/5</span><h2>{`${phase === 'investigate' ? '搜证' : '庭审'}：${demo.title}`}</h2><p>{demo.goal}</p></div><div className="campaign-kpis"><span><small>{phase === 'investigate' ? '已取证' : '我方血量'}</small><strong>{phase === 'investigate' ? `${discovered.length}` : `${playerHp}/${PLAYER_MAX_HP}`}</strong></span><span><small>{phase === 'investigate' ? '关键证据' : '对方血量'}</small><strong>{phase === 'investigate' ? `${demo.keyEvidenceIds.filter((id) => discovered.includes(id)).length}/${demo.keyEvidenceIds.length}` : `${enemyHp}/${maxEnemyHp}`}</strong></span><span><small>总分</small><strong>{investigationScore + score}</strong></span></div></div></div>
    <div className="phase-rail"><span className={phase === 'investigate' ? 'active' : 'done'}>1 搜证</span><i>→</i><span className={phase === 'court' ? 'active' : ''}>2 卡牌庭审</span><i>→</i><span className={verdict ? 'active' : ''}>3 裁决</span></div>
    <small className="campaign-focus-line">争议焦点：{demo.focus.join(' · ')}</small>
    {phase === 'investigate' && error && <p className="error-message" role="alert">{error}</p>}
{phase === 'court' ? <CourtArena demo={demo} onNext={onNext} onInvestigate={returnToInvestigation} hand={courtHand} cardsPlayed={cardsPlayed} battleStage={battle.stage} battleResult={battleResult} playerStamina={playerStamina} playerShield={playerShield} enemyHp={enemyHp} maxEnemyHp={maxEnemyHp} playerHp={playerHp} turn={turn} turnTimer={turnTimer} debate={debate} submitting={submitting} verdict={verdict} error={error} onPlayCard={playCard} onRequestVerdict={requestVerdict} courtEffect={courtEffect} /> : <div className="campaign-layout investigation-layout"><aside className="panel evidence-panel"><PanelHeading eyebrow="EVIDENCE HUB" title="现场搜证" badge="自由搜证" /><div className="scene-tabs">{demo.scenes.map((scene) => <button type="button" className={scene.id === activeScene.id ? 'active' : ''} key={scene.id} onClick={() => setSceneId(scene.id)}>{scene.title}</button>)}</div><div className="scene-board"><span className="scene-label">{activeScene.title}</span><p>{activeScene.description}</p><div className="hotspot-grid">{activeScene.hotspots.map((spot) => <button type="button" className={`hotspot ${discovered.includes(spot.evidenceId) ? 'found' : ''}`} key={spot.id} onClick={() => discoverEvidence(spot.evidenceId, spot.title)}><EvidenceArtwork art={artworkFor(spot.id)} /><strong>{spot.title}</strong><small>{discovered.includes(spot.evidenceId) ? '已收集 ✓' : `自由调查 · ${spot.hint}`}</small></button>)}</div></div><h3 className="subheading">搜证日志</h3><div className="investigation-log">{investigationLog.length ? investigationLog.map((item, index) => <span key={`${item}-${index}`}>{item}</span>) : <span>点击现场热点，寻找能互相印证的原件。</span>}</div></aside><div className="panel source-panel"><PanelHeading eyebrow="SOURCE READER" title={activeDocument.name} badge="具体租房材料" /><div className="source-documents"><h3 className="subheading">原始文件 · 与当前材料同组</h3><div className="document-list">{demo.documents.map((doc) => <button type="button" className={`document-button ${doc.id === documentId ? 'active' : ''}`} key={doc.id} onClick={() => setDocumentId(documentId === doc.id ? '' : doc.id)}><EvidenceArtwork art={artworkFor(doc.id, doc.type)} /><strong>{doc.name}<small>打开完整原件 →</small></strong></button>)}</div></div><div className="source-reader"><CatDocument doc={activeDocument} playerSide={demo.playerSide} discovered={discovered} onDiscover={discoverEvidence} /></div></div><aside className="panel evidence-cards-panel"><PanelHeading eyebrow="CASEBOARD" title="证据卡组" badge={`已选 ${selectedEvidence.length}/${HAND_SIZE}`} /><div className="evidence-inventory">{discovered.length ? demo.evidence.filter((item) => discovered.includes(item.id)).map((item) => { const card = evidenceCard(item, demo.keyEvidenceIds.includes(item.id), demo.levelId); const picked = selectedEvidence.includes(item.id); return <button type="button" className={`evidence-card ${picked ? 'selected' : ''}`} key={item.id} onClick={() => toggleEvidence(item.id)} aria-pressed={picked}><div><strong>{item.title}</strong><span className="tag">体力 {card.cost} · 伤害 {card.value}</span></div><p>{item.description}</p><small>{card.nature} · 可信度 {card.credibility}/10 · {card.key ? '关键证据' : '补充证据'} · {picked ? '✓ 已带上庭 · 点击取消' : '点击带上庭'}</small></button>; }) : <EmptyState text="点击左侧现场热点，或在材料中点击线索，收集到的证据会出现在这里。" />}</div><div className="court-entry"><p className="chain-tip">选择最多 {HAND_SIZE} 张起手证据。庭审始终保留 4 张手牌，打出后随机补牌；已搜集证据和恢复牌组成循环牌库。体力足够才能出牌，恢复靠卡牌，不随回合或超时自动增加。</p><button type="button" className="button primary enter-court" onClick={enterCourt} disabled={!selectedEvidence.length}>带着 {selectedEvidence.length} 张证据卡进入法庭 →</button></div></aside></div>}
  </section>;
}

function CourtArena({ demo, onNext, onInvestigate, hand, cardsPlayed, playerShield, battleStage, battleResult, playerStamina, enemyHp, maxEnemyHp, playerHp, turn, turnTimer, debate, submitting, verdict, error, onPlayCard, onRequestVerdict, courtEffect }: {
  demo: DemoCase; onNext?: () => void; onInvestigate: () => void;
  hand: EvidenceCard[]; cardsPlayed: number; playerShield: number; battleStage: BattleStage;
  battleResult: 'player_win' | 'opponent_win' | null; playerStamina: number;
  enemyHp: number; maxEnemyHp: number; playerHp: number; turn: number; turnTimer: number;
  debate: DebateResult[]; submitting: boolean; verdict: Verdict | null; error: string;
  onPlayCard: (card: EvidenceCard) => void; onRequestVerdict: () => void;
  courtEffect: BattleEffect | null;
}) {
  const turnLabel = battleResult ? '本轮已结束' : battleStage === 'opponent-action' ? '对方反击' : battleStage === 'player-action' ? '对方准备反击…' : submitting ? '等待对方回应' : '轮到我方出牌';
  return <div className="court-arena">
    <div className="court-topbar">
      <div className="court-meter opponent-meter"><span>对方血量</span><strong>{enemyHp}/{maxEnemyHp}</strong><i><b style={{ width: `${maxEnemyHp ? enemyHp / maxEnemyHp * 100 : 0}%` }} /></i></div>
      <div className="court-round" aria-live="polite"><small>庭审回合 {turn}</small><strong>{battleStage === 'player' && !submitting ? turnTimer : '—'}<em>秒</em></strong><span>{turnLabel}</span></div>
      <div className="court-meter player-meter"><span>我方血量</span><strong>{playerHp}/{PLAYER_MAX_HP}</strong><i><b style={{ width: `${playerHp / PLAYER_MAX_HP * 100}%` }} /></i><small>体力 {playerStamina}/{PLAYER_MAX_STAMINA} · 护盾 {playerShield}/{PLAYER_MAX_SHIELD}</small><div className="court-shield-track" aria-label={`护盾 ${playerShield}/${PLAYER_MAX_SHIELD}`}><b style={{ width: `${playerShield / PLAYER_MAX_SHIELD * 100}%` }} /></div></div>
    </div>
    <div className="court-stage">
      <div className="court-side court-side-opponent"><div className="court-nameplate"><span>对方</span><strong>{demo.opponentSide}</strong></div><div className={`court-cat court-cat-opponent ${courtEffect?.side === 'opponent' ? 'is-raising' : ''}`}><img src="/assets/court/opponent-cat.webp" alt="对方猫咪" /></div>{courtEffect?.side === 'opponent' && <div className="objection-bubble">{courtEffect.label}</div>}</div>
      <div className="court-center"><div className="court-bench">⚖ <span>第 {demo.levelId} 关 · {demo.levelTitle}</span> ⚖</div><div className="court-dialogue-list">{debate.slice(-2).map((item, index) => <article key={item.turn?.id || index}>{item.turn?.argument && <div className="court-dialogue is-player"><small>我方陈词</small>{item.turn.argument}</div>}{item.courtTurn === turn && battleStage === 'player-action' ? <div className="court-dialogue court-dialogue-empty">对方正在组织回应…</div> : <div className="court-dialogue"><small>对方回应</small>{item.response}<small>法官提示：{item.judge}</small></div>}</article>)}{!debate.length && <div className="court-dialogue court-dialogue-empty">先看体力，再选择证据出牌。<br />出牌后随机补一张，体力不足时使用恢复牌。</div>}</div>{courtEffect && <div key={`${turn}-${courtEffect.side}`} className={`court-effect-flash ${courtEffect.kind === 'shield' ? 'is-shield' : ''}`}>{courtEffect.label}</div>}</div>
      <div className="court-side court-side-player"><div className="court-nameplate"><span>我方</span><strong>{demo.playerSide}</strong></div><div className={`court-cat court-cat-player ${courtEffect?.side === 'player' ? 'is-raising' : ''}`}><img src="/assets/lawyer-cat-transparent.png" alt="我方律师猫" /></div>{courtEffect?.side === 'player' && <div className="objection-bubble">{courtEffect.label}</div>}</div>
    </div>
    <div className="court-hand-wrap">
      <div className="hand-heading"><span>手牌 {hand.length}/{HAND_SIZE} · 出牌后随机补一张</span><strong>已出 {cardsPlayed} 张 · 体力 {playerStamina}/{PLAYER_MAX_STAMINA}</strong></div>
      <div className="court-hand">{hand.map((card) => {
        const recovery = card.staminaRecovery > 0;
        const defensive = !!card.shieldGain;
        const exhausted = playerStamina < card.cost;
        const full = (recovery && playerStamina >= PLAYER_MAX_STAMINA) || (defensive && playerShield >= PLAYER_MAX_SHIELD);
        const unavailable = battleStage !== 'player' || submitting || !!verdict || !!battleResult;
        const hint = full ? (defensive ? '护盾已满 · 暂不可用' : '体力已满 · 暂不可用') : exhausted ? `体力不足 · 还需 ${card.cost - playerStamina} 点` : unavailable ? turnLabel : defensive ? '使用后获得护盾 · 对方仍会反击' : recovery ? '使用后恢复体力 · 对方仍会反击' : '点击出牌 · 扣除体力并攻击';
        return <button type="button" className={`court-card ${recovery ? 'court-card-recovery' : defensive ? 'court-card-defense' : card.key ? 'court-card-key' : 'court-card-support'} ${exhausted || full ? 'is-exhausted' : ''}`}
          disabled={unavailable || !canAffordCard(card, playerStamina, playerShield)} key={card.id} onClick={() => onPlayCard(card)}
          data-card-kind={recovery ? 'recovery' : defensive ? 'defense' : 'evidence'} data-cost={card.cost} data-recovery={card.staminaRecovery} data-shield={card.shieldGain || 0} data-damage={card.value}
          title={hint}>
          <div className="court-card-heading"><span>{recovery ? '恢复牌' : defensive ? '防御牌' : '证据牌'}</span><span className="court-card-cost">消耗 {card.cost} 体力</span></div>
          {card.evidenceId ? <EvidenceArtwork art={artworkForEvidence(demo, card.evidenceId)} className="court-evidence-art" /> : <img src="/assets/court/card-art-05.webp" alt="" />}
          <strong>{card.name}</strong>
          <small>{recovery || defensive ? '战术行动 · 不作为裁决证据' : `${card.nature} · 可信度 ${card.credibility}/10 · ${card.key ? '关键证据' : '补充证据'}`}</small>
          <small className="court-card-effect">效果：{card.effectText}</small>
          <small className="court-card-hint">{hint}</small>
        </button>;
      })}</div>
      <p className="court-hand-rule">恢复和护盾都靠战术牌；护盾会优先吸收反击伤害。无牌可出时，补牌优先提供可用牌。</p>
    </div>
    <div className="court-footer">
      {battleResult && !verdict && <div className={`battle-result ${battleResult === 'player_win' ? 'is-win' : 'is-loss'}`} role="status">
        <strong>{battleResult === 'player_win' ? '我方胜利！' : '对方胜利'}</strong>
        <p>{battleResult === 'player_win' ? '对方血量先归零，证据链压制成功。现在可以请求法官裁决。' : '我方血量先归零。本局最终裁决将按游戏结果作出，证据链仅用于展示本局过程。'}</p>
        <button type="button" className="button primary" onClick={onRequestVerdict} disabled={submitting}>{submitting ? '正在等待庭审反馈…' : '请求法官裁决'}</button>
      </div>}
      {error && <p className="error-message court-error" role="alert">{error}</p>}
      {!battleResult && <div className="court-actions"><small>对方血量归零后可请求裁决</small><button type="button" className="button verdict-button" disabled>请求法官裁决</button></div>}
      {verdict && <div className="verdict-card"><div className="verdict-header"><span>{verdict.winner}</span><strong>{verdict.score} 分</strong></div><p>{verdict.award}</p><p>{verdict.reasoning}</p><h4>证据链</h4><ol>{verdict.chain.map((item) => <li key={item}>{item}</li>)}</ol><h4>法律检索线索</h4><ul>{verdict.sources.map((source) => <li key={source.title}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul><p className="disclaimer">{verdict.disclaimer}</p>{verdict.gameResult === 'opponent_win' ? <button type="button" className="button secondary" onClick={onInvestigate}>返回搜证重试</button> : onNext && <button type="button" className="button primary" onClick={onNext}>下一关 →</button>}</div>}
    </div>
  </div>;
}

function CommunitySection({ apiBaseUrl, posts, setPosts, loading }: { apiBaseUrl: string; posts: CommunityPost[]; setPosts: (posts: CommunityPost[]) => void; loading: boolean }) {
  const [submitting, setSubmitting] = useState(false); const [error, setError] = useState(''); const [liked, setLiked] = useState<string[]>([]);
  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError('');
    const form = new FormData(event.currentTarget);
    if (!form.get('privacy')) { setError('请确认内容已脱敏且不包含需要保密的原始文件。'); setSubmitting(false); return; }
    try { const post = await requestJson<CommunityPost>(`${apiBaseUrl}/api/community/posts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: form.get('title'), body: form.get('body'), tags: String(form.get('tags') || '').split(/\s+/).filter(Boolean), author: '你' }) }); setPosts([post, ...posts]); event.currentTarget.reset(); }
    catch (submitError) { setError(submitError instanceof Error ? submitError.message : '发布失败'); }
    finally { setSubmitting(false); }
  }
  return <section className="community-shell"><div className="community-layout"><aside className="panel community-sidebar"><PanelHeading eyebrow="COMMUNITY SQUARE" title="社区广场" badge="脱敏分享" /><div className="leaderboard"><h3>本周训练榜</h3>{[['1','证据收藏家','2,520'],['2','仲裁员小王','2,180'],['3','法外狂徒张三','1,960']].map(([rank, name, score]) => <div className="leader-row" key={rank}><strong>{rank}</strong><span className="avatar avatar-cat" aria-hidden="true">猫</span><div><b>{name}</b><small>案件训练者</small></div><em>{score}</em></div>)}</div><div className="privacy-card"><strong>隐私 · 默认私有</strong><p>案件、合同和聊天记录不会自动公开。发布前请先脱敏，并确认内容不含个人信息。</p></div></aside><div className="community-main"><form className="panel share-form" onSubmit={submitPost}><PanelHeading eyebrow="SHARE A RUN" title="分享一次复盘" badge="POST" /><div className="field-grid"><label>标题<input name="title" required placeholder="例如：租赁押金关卡的证据链" /></label><label>标签<input name="tags" placeholder="#证据链 #租赁" /></label></div><label>内容<textarea name="body" required placeholder="分享你的思路、遇到的质证或合同审查方法…" /></label><label className="checkbox-line"><input type="checkbox" name="privacy" /> 我已脱敏，并确认不发布合同、聊天记录等原始文件</label><div className="button-row"><button className="button primary" disabled={submitting}>{submitting ? '正在发布…' : '发布到社区 →'}</button></div>{error && <p className="error-message">{error}</p>}</form><div className="feed-list">{loading ? <div className="panel loading-panel">正在加载社区动态…</div> : posts.map((post) => <article className="panel feed-card" key={post.id}><div className="feed-header"><div><span className="avatar avatar-cat" aria-hidden="true">猫</span><strong>{post.author}</strong></div><small>{post.time}</small></div><h3>{post.title}</h3><p>{post.body}</p><div>{post.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div><div className="feed-actions"><button onClick={() => setLiked(liked.includes(post.id) ? liked.filter((id) => id !== post.id) : [...liked, post.id])}>{liked.includes(post.id) ? '♥' : '♡'} {post.likes + (liked.includes(post.id) ? 1 : 0)}</button><span>评论 {post.comments}</span></div></article>)}</div></div></div></section>;
}

function PanelHeading({ title, badge }: { eyebrow: string; title: string; badge: string }) { return <div className="panel-heading"><div><h2>{title}</h2></div><span className="tag ready">{badge}</span></div>; }
function InfoList({ title, items }: { title: string; items: string[] }) { return <div className="info-list"><h4>{title}</h4><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></div>; }
function EmptyState({ text }: { text: string }) { return <div className="empty-state"><p>{text}</p></div>; }
function Stat({ label, value }: { label: string; value: number }) { return <div className="stat"><strong>{value}</strong><span>{label}</span></div>; }
function FindingCard({ finding }: { finding: AuditFinding }) { return <article className={`finding finding-${finding.severity}`}><div className="finding-top"><span className={`tag ${finding.severity === 'high' ? 'danger' : ''}`}>{finding.category}</span><span className="necessity">必要度 {finding.necessity}/10</span><small>第 {finding.clauseIndex + 1} 段 · {finding.skill_name} v{finding.skill_version}</small></div><blockquote>{finding.clause}</blockquote><p><strong>风险：</strong>{finding.issue}</p><p><strong>方向：</strong>{finding.direction}</p><div className="revision-box"><small>修改参考文本</small>{finding.suggested_text}</div><div className="source-links"><span>置信度 {Math.round(finding.confidence * 100)}%</span>{finding.law_sources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.sourceId || source.title}>{source.title} ↗</a>)}</div><small className="pending">待确认：{finding.pending_questions.join('；')}</small></article>; }
