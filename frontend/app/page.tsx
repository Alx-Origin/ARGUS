'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CatDocument, EvidenceArtwork, artworkFor } from './components/cat-evidence';
import { artworkForEvidence } from './lib/evidence-art';
import { createCourtSfx, soundForEffect } from './lib/court-sfx';
import { APP_COPY, LocaleContext, LOCALE_STORAGE_KEY, detectLocale, getBattleEffectCopy, getEvidenceNatureCopy, getLevelCopy, getTacticalCardCopy, getTypeCopy, interpolate, normalizeLocale, translatePartyLabel, useLocale, type Locale } from './lib/localization';
import { getAuthUser, getPlayerId, isSupabaseConfigured, isUsernameAvailable, loadLocalPlayerProfile, loadPlayerProfile, loginAccount, logoutAccount, normalizeUsername, onAuthChange, registerAccount, saveCampaignRun, savePlayerProfile, type AuthUser, type PlayerProfile } from './lib/supabase';
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

const AVATARS = [
  { id: 'lawyer', src: '/assets/lawyer-cat-transparent.png', label: '蓝袍律师猫' },
  { id: 'opponent', src: '/assets/court/opponent-cat.webp', label: '法庭辩护猫' },
  { id: 'tenant', src: '/assets/evidence/tenant-cat-transparent.webp', label: '租客证人猫' },
  { id: 'landlord', src: '/assets/evidence/landlord-cat-transparent.webp', label: '房东证人猫' },
] as const;

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

function evidenceCard(item: CampaignEvidence, key: boolean, levelId = 0, locale: Locale = 'zh'): EvidenceCard {
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
    nature: getEvidenceNatureCopy(nature.label, locale), key, value,
    credibility: item.credibility,
    cost, staminaRecovery: 0, shieldGain: 0,
    effectText: locale === 'en' ? `Deal ${value} damage · Cost ${cost} stamina` : `造成 ${value} 点伤害 · 消耗 ${cost} 点体力`,
    // Cites its own exhibit so the rebuttal engine can match it against the case's disputes.
    text: `依据「${item.title}」：${item.description}${item.proofPurpose}`,
  };
}

function buildHand(demo: DemoCase, evidenceIds: string[], locale: Locale = 'zh'): EvidenceCard[] {
  return evidenceIds
    .map((id) => demo.evidence.find((item) => item.id === id))
    .filter((item): item is CampaignEvidence => Boolean(item))
    .map((item) => evidenceCard(item, demo.keyEvidenceIds.includes(item.id), demo.levelId, locale));
}

/* Keep case difficulty tied to the strongest four exhibits, independent of random draws. */
function opponentHealth(demo: DemoCase, locale: Locale = 'zh') {
  const health = demo.evidence
    .map((item) => evidenceCard(item, demo.keyEvidenceIds.includes(item.id), demo.levelId, locale))
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
  const [locale, setLocale] = useState<Locale>('zh');
  const [caseDraft, setCaseDraft] = useState<CaseDraft | null>(null);
  const [caseLoading, setCaseLoading] = useState(false);
  const [caseError, setCaseError] = useState('');
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [playerId, setPlayerId] = useState('');
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [entryAuthDismissed, setEntryAuthDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    const nextLocale = normalizeLocale(stored || detectLocale());
    setLocale(nextLocale);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale === 'en' ? 'en' : 'zh-CN';
    document.title = locale === 'en' ? 'Courtroom Quest · ARGUS+' : '法庭闯关 · ARGUS+';
  }, [locale]);

  useEffect(() => {
    let disposed = false;
    let authReady = false;
    async function hydrate(user: AuthUser | null) {
      const localId = getPlayerId();
      const id = user?.id || localId;
      setPlayerId(id);
      try {
        let profile = await loadPlayerProfile(id);
        if (!profile && user?.username) {
          const local = loadLocalPlayerProfile(localId);
          const seeded: PlayerProfile = { id, name: user.username, avatar: local?.avatar || AVATARS[0].src, totalScore: local?.totalScore || 0, completedLevels: local?.completedLevels || 0 };
          try { profile = await savePlayerProfile(seeded); } catch { profile = seeded; }
        }
        if (!disposed) setPlayerProfile(profile);
      } catch {
        if (!disposed) setProfileError(APP_COPY[locale].profileCloudUnavailable);
      } finally {
        if (!disposed) setProfileLoading(false);
      }
    }
    const unsubscribe = onAuthChange((user) => {
      // Supabase emits its initial session event asynchronously. Wait for the
      // explicit getAuthUser() result first so a logged-in user never sees a
      // transient registration modal while that session is still resolving.
      if (!authReady) return;
      setAuthUser(user);
      setProfileLoading(true);
      void hydrate(user);
    });
    getAuthUser().then((user) => {
      if (disposed) return;
      authReady = true;
      setAuthUser(user);
      void hydrate(user);
    }).catch(() => {
      if (disposed) return;
      authReady = true;
      setAuthUser(null);
      void hydrate(null);
    });
    return () => { disposed = true; unsubscribe(); };
  }, []);

  useEffect(() => {
    if (pathname !== '/campaign') router.replace('/campaign');
  }, [pathname, router]);

  async function createCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCaseLoading(true); setCaseError('');
    try {
      const form = new FormData(event.currentTarget);
      setCaseDraft(await requestJson<CaseDraft>(`${apiBaseUrl}/api/cases/draft`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(form.entries())) }));
    } catch (error) { setCaseError(error instanceof Error ? error.message : (locale === 'en' ? 'Could not generate case' : '案件生成失败')); }
    finally { setCaseLoading(false); }
  }

  async function auditContract(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuditLoading(true); setAuditError('');
    try {
      const form = new FormData(event.currentTarget);
      setAuditResult(await requestJson<AuditResult>(`${apiBaseUrl}/api/contracts/audit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(form.entries())) }));
    } catch (error) { setAuditError(error instanceof Error ? error.message : (locale === 'en' ? 'Contract review failed' : '合同审查失败')); }
    finally { setAuditLoading(false); }
  }

  async function handleSaveProfile(input: Pick<PlayerProfile, 'name' | 'avatar'>) {
    const nextProfile: PlayerProfile = {
      id: playerId || getPlayerId(),
      ...input,
      totalScore: playerProfile?.totalScore || 0,
      completedLevels: playerProfile?.completedLevels || 0,
    };
    setProfileError('');
    try {
      const saved = await savePlayerProfile(nextProfile);
      setPlayerProfile(saved);
      setProfileOpen(false);
    } catch {
      setPlayerProfile(nextProfile);
      setProfileOpen(false);
      setProfileError(APP_COPY[locale].profileSavedLocal);
    }
  }

  async function handleAuthSuccess(user: AuthUser, username: string) {
    const local = loadLocalPlayerProfile(getPlayerId());
    let profile = await loadPlayerProfile(user.id);
    if (!profile) {
      profile = {
        id: user.id,
        name: username,
        avatar: local?.avatar || AVATARS[0].src,
        totalScore: local?.totalScore || 0,
        completedLevels: local?.completedLevels || 0,
      };
      try { profile = await savePlayerProfile(profile); } catch { /* local fallback below */ }
    }
    setAuthUser({ ...user, username: user.username || username });
    setPlayerId(user.id);
    setPlayerProfile(profile);
    setAuthOpen(false);
    setProfileOpen(false);
    setProfileError('');
  }

  async function handleLogout() {
    try {
      await logoutAccount();
      const localId = getPlayerId();
      setAuthUser(null);
      setPlayerId(localId);
      setPlayerProfile(loadLocalPlayerProfile(localId));
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : APP_COPY[locale].logoutError);
    }
  }

  function openAuthModal() {
    setEntryAuthDismissed(true);
    setProfileOpen(false);
    setAuthOpen(true);
  }

  async function handleRunComplete(levelId: number, score: number) {
    if (!playerProfile || !playerId) return;
    const nextProfile: PlayerProfile = {
      ...playerProfile,
      totalScore: playerProfile.totalScore + score,
      completedLevels: playerProfile.completedLevels + 1,
    };
    setPlayerProfile(nextProfile);
    try {
      await saveCampaignRun({ playerId, levelId, score, outcome: 'player_win' });
      await savePlayerProfile(nextProfile);
    } catch {
      setProfileError(APP_COPY[locale].profileRunSavedLocal);
    }
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <main>
        <a className="skip-link" href="#main-content">{APP_COPY[locale].skipLink}</a>
        <h1 className="sr-only">{APP_COPY[locale].brandTitle} · {APP_COPY[locale].brandSubtitle}</h1>
        <header className="masthead">
          <button className="brand" onClick={() => router.push('/campaign')} aria-label={APP_COPY[locale].campaignBack}>
            <img src="/assets/lawyer-cat-transparent.png" alt={APP_COPY[locale].brandAlt} />
            <span className="brand-wordmark">
              <strong className="cat-title">{APP_COPY[locale].brandTitle}</strong>
              <small className="cat-subtitle">{APP_COPY[locale].brandSubtitle}<span className="wordmark-paw" aria-hidden="true">🐾</span></small>
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
          <div className="player-header-actions">
            <div className="locale-switch" role="tablist" aria-label="Language switch">
              <button type="button" role="tab" aria-selected={locale === 'zh'} className={locale === 'zh' ? 'active' : ''} onClick={() => setLocale('zh')}>{APP_COPY.zh.localeZh}</button>
              <button type="button" role="tab" aria-selected={locale === 'en'} className={locale === 'en' ? 'active' : ''} onClick={() => setLocale('en')}>{APP_COPY.zh.localeEn}</button>
            </div>
            <button type="button" className="player-chip" onClick={() => authUser ? setProfileOpen(true) : isSupabaseConfigured ? openAuthModal() : setProfileOpen(true)} disabled={profileLoading}>
              <img className="player-chip-avatar" src={playerProfile?.avatar || AVATARS[0].src} alt="" />
              <span><strong>{playerProfile?.name || (authUser ? APP_COPY[locale].profileMissingName : APP_COPY[locale].login)}</strong><small>{authUser ? APP_COPY[locale].editProfile : APP_COPY[locale].loginHint}</small></span>
            </button>
            <span className="player-score">⭐ {playerProfile?.totalScore || 0}</span>
            {authUser && <button type="button" className="account-action" onClick={handleLogout}>{APP_COPY[locale].logout}</button>}
          </div>
        </header>

        <div className="page-shell" id="main-content">
          <CampaignSection onRunComplete={handleRunComplete} />
        </div>
        {profileError && <p className="profile-sync-note" role="status">{profileError}</p>}
        {!profileLoading && !authOpen && ((!isSupabaseConfigured && (!playerProfile || profileOpen)) || (Boolean(authUser) && (!playerProfile || profileOpen))) && <ProfileModal profile={playerProfile} authenticated={Boolean(authUser)} onSave={handleSaveProfile} onClose={() => playerProfile && setProfileOpen(false)} onAuthRequest={openAuthModal} />}
        {(!entryAuthDismissed && !profileLoading && isSupabaseConfigured && !authUser && !playerProfile) || authOpen ? <AuthModal onClose={() => { setAuthOpen(false); setEntryAuthDismissed(true); }} onSuccess={handleAuthSuccess} /> : null}
      </main>
    </LocaleContext.Provider>
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

function CampaignSection({ onRunComplete }: { onRunComplete: (levelId: number, score: number) => Promise<void> }) {
  const { locale } = useLocale();
  const copy = APP_COPY[locale];
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
    onComplete={(score) => {
      setCompleted((items) => ({ ...items, [demo.id]: Math.max(items[demo.id] || 0, score) }));
      void onRunComplete(demo.levelId, score);
    }}
    onNext={nextLevel ? () => selectLevel(nextLevel.id) : undefined}
  />;
  if (loading || error || selectedId) return <section className="panel loading-panel" aria-label="法庭闯关">
    {selectedId && <button type="button" className="button secondary" onClick={() => selectLevel(null)}>{copy.campaignBack}</button>}
    {error ? <><p className="error-message" role="alert">{error}</p><button type="button" className="button primary" onClick={() => setRetry((value) => value + 1)}> {locale === 'en' ? 'Reload' : '重新加载'} </button></> : <p role="status">{selectedId ? copy.campaignLoadingCase : copy.campaignLoadingMap}</p>}
  </section>;
  const recommended = levels.find((level) => !completed[level.id])?.id;
  const visibleLevels = levels.map((level) => ({
    ...level,
    ...getLevelCopy(level.levelId, locale, { title: level.title, desc: level.desc }),
  }));
  return <section className="campaign-shell campaign-map-shell" aria-label={copy.campaignTitle}>
    <div className="campaign-header"><div><h2>{copy.campaignTitle} <small>{copy.campaignSubtitle}</small></h2><p className="campaign-lead">{copy.campaignLead}</p></div><div className="campaign-header-stats"><span className="tag">{copy.campaignTag}</span><span className="tag ready">{interpolate(copy.campaignOpen, { count: levels.length })}</span><span className="tag">{interpolate(copy.campaignProgress, { done: Object.keys(completed).length, total: levels.length })}</span></div></div>
    <div className="campaign-map">{visibleLevels.map((level) => <button type="button" key={level.id} className={`level-node ${completed[level.id] ? 'completed' : level.id === recommended ? 'current' : ''}`} onClick={() => selectLevel(level.id)}>
      <span className="level-num">{level.levelId}</span><strong className="level-title">{level.title}</strong><small>{level.desc}</small><small>{copy.campaignDifficulty} {level.difficulty} · {level.keyEvidenceCount} {copy.campaignKeyEvidenceCount}</small><span className="level-stars">{completed[level.id] ? '★★★' : '☆☆☆'}</span>
    </button>)}</div>
    <div className="panel campaign-rules"><strong>{copy.campaignRulesTitle}</strong><span>{copy.campaignRulesBody}</span></div>
  </section>;
}

function CampaignRun({ demo, apiBaseUrl, onBack, onComplete, onNext }: { demo: DemoCase; apiBaseUrl: string; onBack: () => void; onComplete: (score: number) => void; onNext?: () => void }) {
  const { locale } = useLocale();
  const copy = APP_COPY[locale];
  const levelCopy = getLevelCopy(demo.levelId, locale, { title: demo.levelTitle, desc: demo.type });
  const visibleDemo = useMemo(() => ({
    ...demo,
    title: levelCopy.title,
    levelTitle: levelCopy.title,
    type: getTypeCopy(demo.type, locale),
    playerSide: translatePartyLabel(demo.playerSide, locale),
    opponentSide: translatePartyLabel(demo.opponentSide, locale),
  }), [demo, levelCopy.desc, levelCopy.title, locale]);
  const [phase, setPhase] = useState<'investigate' | 'court'>('investigate');
  const [sceneId, setSceneId] = useState(demo.scenes[0].id);
  const [documentId, setDocumentId] = useState(demo.documents[0].id);
  const [discovered, setDiscovered] = useState<string[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
  const [investigationScore, setInvestigationScore] = useState(0);
  const [investigationLog, setInvestigationLog] = useState<string[]>([]);
  const maxEnemyHp = useMemo(() => opponentHealth(demo, locale), [demo, locale]);
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
        body: JSON.stringify({ caseId: demo.id, argument: text, evidenceIds: selectedEvidence, history: debate }),
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (result.caseId !== demo.id) throw new Error(locale === 'en' ? 'The reply does not match the current case. Please retry.' : '对方回应与当前案件不一致，请重试');
      setDebate((items) => [...items, { ...result, courtTurn: turn }]);
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : (locale === 'en' ? 'Failed to submit argument' : '提交论点失败'));
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
      const result = await requestJson<Verdict>(`${apiBaseUrl}/api/campaign/verdict`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ caseId: demo.id, evidenceIds: selectedEvidence, debate, gameResult: battleResult }) });
      if (result.caseId !== demo.id) throw new Error(locale === 'en' ? 'The verdict does not match the current case. Please retry.' : '裁决与当前案件不一致，请重试');
      setVerdict(result);
      if (result.gameResult === 'player_win') onComplete(result.score);
    }
    catch (e) { setError(e instanceof Error ? e.message : (locale === 'en' ? 'Failed to request verdict' : '裁决请求失败')); }
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
      setInvestigationLog((items) => [`${locale === 'en' ? 'Removed evidence' : '取消证据'}：${label}`, ...items].slice(0, 5));
      setError('');
      return;
    }
    setDiscovered((ids) => [...ids, id]);
    setInvestigationScore((value) => value + 5);
    setInvestigationLog((items) => [`${locale === 'en' ? 'Found evidence' : '发现证据'}：${label}`, ...items].slice(0, 5));
  };
  const toggleEvidence = (id: string) => {
    // Collecting an exhibit and bringing it to court are separate choices.
    // Clicking a card only toggles its court selection; an unselected card stays
    // in the evidence deck so the player can compare it with the other exhibits.
    if (selectedEvidence.includes(id)) {
      setSelectedEvidence((ids) => ids.filter((itemId) => itemId !== id));
      setInvestigationLog((items) => [`${locale === 'en' ? 'Removed from trial' : '取消带庭选择'}：${demo.evidence.find((item) => item.id === id)?.title || (locale === 'en' ? 'evidence' : '证据')}`, ...items].slice(0, 5));
      setError('');
      return;
    }
    setSelectedEvidence((ids) => {
      if (ids.length >= HAND_SIZE) { setError(locale === 'en' ? `You can bring at most ${HAND_SIZE} evidence cards.` : `上庭最多带 ${HAND_SIZE} 张证据卡，请先取消一张。`); return ids; }
      setError('');
      return [...ids, id];
    });
  };
  const enterCourt = () => {
    if (!selectedEvidence.length) { setError(locale === 'en' ? 'Select at least one evidence card before entering trial.' : '请先选择至少一张证据卡带入法庭。'); return; }
    // Unlock Web Audio in the entry click, before delayed combat effects run.
    courtSfxRef.current ??= createCourtSfx();
    courtSfxRef.current.unlock();
    lastSoundEffectRef.current = null;
    dispatchBattle({
      type: 'start', deck: buildHand(demo, selectedEvidence, locale), selectedIds: selectedEvidence,
      enemyHp: maxEnemyHp, seed: Math.floor(Math.random() * 4294967296),
    });
    setPhase('court'); setTurnTimer(TURN_SECONDS); setVerdict(null);
    setDebate([]); setScore(0); setSubmitting(false); setError('');
  };
  return <section className="campaign-shell campaign-run-shell" aria-label={locale === 'en' ? 'Courtroom quest' : '法庭闯关'}>
    <div className="compact-run-nav"><button type="button" className="icon-back" onClick={onBack} aria-label={copy.campaignBack}>{locale === 'en' ? '←' : '←'}</button><div className="phase-rail"><span className={phase === 'investigate' ? 'active' : 'done'}>{copy.courtInvestigate}</span><i>→</i><span className={phase === 'court' ? 'active' : ''}>{copy.courtTrial}</span><i>→</i><span className={verdict ? 'active' : ''}>{copy.courtVerdict}</span></div></div>{briefOpen && <div className="level-brief-overlay"><div className="level-brief-card"><span className="brief-stamp">CASE {demo.levelId}</span><h2>{visibleDemo.title}</h2><p>{visibleDemo.summary}</p><h3>{copy.briefTitle}</h3><p>{visibleDemo.goal}</p><button type="button" className="button primary" onClick={() => setBriefOpen(false)}>{copy.campaignStart}</button></div></div>}<div className="campaign-intro-wrap"><button type="button" className="button secondary back-to-map" onClick={onBack}>{copy.campaignBack}</button><div className="panel campaign-intro"><div><span className="tag ready">{locale === 'en' ? 'Level' : '第'} {demo.levelId} {locale === 'en' ? '·' : '关 ·'} {visibleDemo.type} {locale === 'en' ? '· Difficulty' : '· 难度'} {demo.difficulty}</span><h2>{`${phase === 'investigate' ? copy.courtInvestigate : copy.courtTrial}：${visibleDemo.title}`}</h2><p>{visibleDemo.goal}</p></div><div className="campaign-kpis"><span><small>{phase === 'investigate' ? (locale === 'en' ? 'Collected' : '已取证') : copy.courtPlayerHp}</small><strong>{phase === 'investigate' ? `${discovered.length}` : `${playerHp}/${PLAYER_MAX_HP}`}</strong></span><span><small>{phase === 'investigate' ? (locale === 'en' ? 'Key evidence' : '关键证据') : copy.courtOpponentHp}</small><strong>{phase === 'investigate' ? `${demo.keyEvidenceIds.filter((id) => discovered.includes(id)).length}/${demo.keyEvidenceIds.length}` : `${enemyHp}/${maxEnemyHp}`}</strong></span><span><small>{locale === 'en' ? 'Score' : '总分'}</small><strong>{investigationScore + score}</strong></span></div></div></div>
    <div className="phase-rail"><span className={phase === 'investigate' ? 'active' : 'done'}>1 {copy.courtInvestigate}</span><i>→</i><span className={phase === 'court' ? 'active' : ''}>2 {copy.courtTrial}</span><i>→</i><span className={verdict ? 'active' : ''}>3 {copy.courtVerdict}</span></div>
    <small className="campaign-focus-line">{copy.campaignFocusLabel}{locale === 'en' ? ': ' : '：'}{visibleDemo.focus.join(' · ')}</small>
    {phase === 'investigate' && error && <p className="error-message" role="alert">{error}</p>}
    {phase === 'court' ? <CourtArena demo={visibleDemo} onNext={onNext} onInvestigate={returnToInvestigation} hand={courtHand} cardsPlayed={cardsPlayed} battleStage={battle.stage} battleResult={battleResult} playerStamina={playerStamina} playerShield={playerShield} enemyHp={enemyHp} maxEnemyHp={maxEnemyHp} playerHp={playerHp} turn={turn} turnTimer={turnTimer} debate={debate} submitting={submitting} verdict={verdict} error={error} onPlayCard={playCard} onRequestVerdict={requestVerdict} courtEffect={courtEffect} /> : <div className="campaign-layout investigation-layout"><aside className="panel evidence-panel"><PanelHeading eyebrow="EVIDENCE HUB" title={copy.campaignSearchTitle} badge={copy.campaignSearchBadge} /><div className="scene-tabs">{demo.scenes.map((scene) => <button type="button" className={scene.id === activeScene.id ? 'active' : ''} key={scene.id} onClick={() => setSceneId(scene.id)}>{scene.title}</button>)}</div><div className="scene-board"><span className="scene-label">{activeScene.title}</span><p>{activeScene.description}</p><div className="hotspot-grid">{activeScene.hotspots.map((spot) => <button type="button" className={`hotspot ${discovered.includes(spot.evidenceId) ? 'found' : ''}`} key={spot.id} onClick={() => discoverEvidence(spot.evidenceId, spot.title)}><EvidenceArtwork art={artworkFor(spot.id)} locale={locale} /><strong>{spot.title}</strong><small>{discovered.includes(spot.evidenceId) ? (locale === 'en' ? 'Collected ✓' : '已收集 ✓') : `${locale === 'en' ? 'Explore' : '自由调查'} · ${spot.hint}`}</small></button>)}</div></div><h3 className="subheading">{copy.campaignSearchLog}</h3><div className="investigation-log">{investigationLog.length ? investigationLog.map((item, index) => <span key={`${item}-${index}`}>{item}</span>) : <span>{copy.campaignInvestigateHint}</span>}</div></aside><div className="panel source-panel"><PanelHeading eyebrow="SOURCE READER" title={copy.campaignSourceReader} badge={copy.campaignSourceBadge} /><div className="source-documents"><h3 className="subheading">{copy.campaignSourceTitle}</h3><div className="document-list">{demo.documents.map((doc) => <button type="button" className={`document-button ${doc.id === documentId ? 'active' : ''}`} key={doc.id} onClick={() => setDocumentId(documentId === doc.id ? '' : doc.id)}><EvidenceArtwork art={artworkFor(doc.id, doc.type)} locale={locale} /><strong>{doc.name}<small>{locale === 'en' ? 'Open full original →' : '打开完整原件 →'}</small></strong></button>)}</div></div><div className="source-reader"><CatDocument doc={activeDocument} playerSide={visibleDemo.playerSide} discovered={discovered} onDiscover={discoverEvidence} locale={locale} /></div></div><aside className="panel evidence-cards-panel"><PanelHeading eyebrow="CASEBOARD" title={copy.campaignEvidenceTitle} badge={interpolate(copy.campaignEvidenceBadge, { selected: selectedEvidence.length, total: HAND_SIZE })} /><div className="evidence-inventory">{discovered.length ? demo.evidence.filter((item) => discovered.includes(item.id)).map((item) => { const card = evidenceCard(item, demo.keyEvidenceIds.includes(item.id), demo.levelId, locale); const picked = selectedEvidence.includes(item.id); return <button type="button" className={`evidence-card ${picked ? 'selected' : ''}`} key={item.id} onClick={() => toggleEvidence(item.id)} aria-pressed={picked}><div><strong>{item.title}</strong><span className="evidence-proof" title={item.proofPurpose}>→ {item.proofPurpose}</span></div><p>{item.description}</p><small>{card.nature} · 可信度 {card.credibility}/10 · {card.key ? (locale === 'en' ? 'Key evidence' : '关键证据') : (locale === 'en' ? 'Supporting evidence' : '补充证据')} · {picked ? (locale === 'en' ? '✓ Selected · click to remove' : '✓ 已选入庭 · 点击取消选择') : (locale === 'en' ? 'Click to select for trial' : '点击选择带上庭')}</small></button>; }) : <EmptyState text={copy.campaignInvestigateHint} />}</div><div className="court-entry"><p className="chain-tip">{interpolate(copy.campaignCourtEntryHint, { total: HAND_SIZE })}</p><button type="button" className="button primary enter-court" onClick={enterCourt} disabled={!selectedEvidence.length}>{selectedEvidence.length ? interpolate(copy.campaignEnterCourt, { count: selectedEvidence.length }) : copy.campaignChooseEvidence}</button></div></aside></div>}
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
  const { locale } = useLocale();
  const copy = APP_COPY[locale];
  // The case title is an opening cue, not a permanent overlay. CourtArena mounts
  // when entering the courtroom, so this timer naturally restarts for a new run.
  const [showCourtBench, setShowCourtBench] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setShowCourtBench(false), 1800);
    return () => window.clearTimeout(timer);
  }, []);
  const turnLabel = battleResult ? copy.courtTurnEnd : battleStage === 'opponent-action' ? copy.courtTurnOpponent : battleStage === 'player-action' ? copy.courtTurnPreparing : submitting ? copy.courtWaiting : copy.courtTurnPlayer;
  const visibleEffect = courtEffect ? getBattleEffectCopy(courtEffect.label, locale) : '';
  return <div className="court-arena">
    <div className="court-topbar">
      <div className="court-meter opponent-meter"><span>{copy.courtOpponentHp}</span><strong>{enemyHp}/{maxEnemyHp}</strong><i><b style={{ width: `${maxEnemyHp ? enemyHp / maxEnemyHp * 100 : 0}%` }} /></i></div>
      <div className="court-round" aria-live="polite"><small>{copy.courtRound} {turn}</small><strong>{battleStage === 'player' && !submitting ? turnTimer : '—'}<em>{copy.courtSeconds}</em></strong><span>{turnLabel}</span></div>
      <div className="court-meter player-meter"><span>{copy.courtPlayerHp}</span><strong>{playerHp}/{PLAYER_MAX_HP}</strong><i><b style={{ width: `${playerHp / PLAYER_MAX_HP * 100}%` }} /></i><small>{copy.courtStamina} {playerStamina}/{PLAYER_MAX_STAMINA} · {copy.courtShield} {playerShield}/{PLAYER_MAX_SHIELD}</small><div className="court-shield-track" aria-label={interpolate(copy.courtShieldAria, { current: playerShield, max: PLAYER_MAX_SHIELD })}><b style={{ width: `${playerShield / PLAYER_MAX_SHIELD * 100}%` }} /></div></div>
    </div>
    <div className="court-stage">
      <div className="court-side court-side-opponent"><div className="court-nameplate"><span>{copy.courtTheirSide}</span><strong>{demo.opponentSide}</strong></div><div className={`court-cat court-cat-opponent ${courtEffect?.side === 'opponent' ? 'is-raising' : ''}`}><img src="/assets/court/opponent-cat.webp" alt={copy.courtTheirSide} /></div>{courtEffect?.side === 'opponent' && <div className="objection-bubble">{visibleEffect}</div>}</div>
      <div className="court-center">{showCourtBench && <div className="court-bench">⚖ <span>{locale === 'en' ? 'Level' : '第'} {demo.levelId} {locale === 'en' ? '·' : '关 ·'} {demo.levelTitle}</span> ⚖</div>}<div className="court-dialogue-list">{debate.slice(-2).map((item, index) => <article key={item.turn?.id || index}>{item.turn?.argument && <div className="court-dialogue is-player"><small>{copy.courtPlayerStatement}</small>{item.turn.argument}</div>}{item.courtTurn === turn && battleStage === 'player-action' ? <div className="court-dialogue court-dialogue-empty">{copy.courtOpponentReplyPending}</div> : <div className="court-dialogue"><small>{copy.courtOpponentReply}</small>{item.response}<small>{copy.courtJudgePrompt} {item.judge}</small></div>}</article>)}{!debate.length && <div className="court-dialogue court-dialogue-empty">{copy.courtNoDebate}</div>}</div>{courtEffect && <div key={`${turn}-${courtEffect.side}`} className={`court-effect-flash ${courtEffect.kind === 'shield' ? 'is-shield' : ''}`}>{visibleEffect}</div>}</div>
      <div className="court-side court-side-player"><div className="court-nameplate"><span>{copy.courtOurSide}</span><strong>{demo.playerSide}</strong></div><div className={`court-cat court-cat-player ${courtEffect?.side === 'player' ? 'is-raising' : ''}`}><img src="/assets/lawyer-cat-transparent.png" alt={copy.courtOurSide} /></div>{courtEffect?.side === 'player' && <div className="objection-bubble">{visibleEffect}</div>}</div>
    </div>
      <div className="court-hand-wrap">
      <div className="hand-heading"><span>{interpolate(copy.courtHand, { count: hand.length, total: HAND_SIZE })}</span><strong>{interpolate(copy.courtPlayed, { count: cardsPlayed, stamina: playerStamina, max: PLAYER_MAX_STAMINA })}</strong></div>
      <div className="court-hand">{hand.map((card) => {
        const recovery = card.staminaRecovery > 0;
        const defensive = !!card.shieldGain;
        const tactical = getTacticalCardCopy(card.id.replace(/-instance-\d+$/, ''), locale);
        const exhausted = playerStamina < card.cost;
        const full = (recovery && playerStamina >= PLAYER_MAX_STAMINA) || (defensive && playerShield >= PLAYER_MAX_SHIELD);
        const unavailable = battleStage !== 'player' || submitting || !!verdict || !!battleResult;
        const hint = full ? (defensive ? copy.courtShieldFull : copy.courtRecoveryFull) : exhausted ? interpolate(copy.courtLowStamina, { cost: card.cost - playerStamina }) : unavailable ? turnLabel : defensive ? copy.courtDefenseHint : recovery ? copy.courtRecoveryHint : copy.courtPlayHint;
        const cardName = tactical?.name || card.name;
        const cardNature = tactical?.nature || card.nature;
        const cardEffect = tactical?.effect || card.effectText;
        return <button type="button" className={`court-card ${recovery ? 'court-card-recovery' : defensive ? 'court-card-defense' : card.key ? 'court-card-key' : 'court-card-support'} ${exhausted || full ? 'is-exhausted' : ''}`}
          disabled={unavailable || !canAffordCard(card, playerStamina, playerShield)} key={card.id} onClick={() => onPlayCard(card)}
          data-card-kind={recovery ? 'recovery' : defensive ? 'defense' : 'evidence'} data-cost={card.cost} data-recovery={card.staminaRecovery} data-shield={card.shieldGain || 0} data-damage={card.value}
          title={hint}>
          <div className="court-card-heading"><span>{recovery ? copy.courtRecoveryPlay : defensive ? copy.courtDefensePlay : copy.courtEvidencePlay}</span><span className="court-card-cost">{interpolate(copy.courtCost, { cost: card.cost })}</span></div>
          {card.evidenceId ? <EvidenceArtwork art={artworkForEvidence(demo, card.evidenceId)} className="court-evidence-art" locale={locale} /> : <img src="/assets/court/card-art-05.webp" alt="" />}
          <strong>{cardName}</strong>
          <small>{recovery || defensive ? copy.courtAction : `${cardNature} · ${interpolate(copy.courtEvidenceAccuracy, { score: card.credibility })} · ${card.key ? copy.courtEvidenceKey : copy.courtEvidenceSupport}`}</small>
          <small className="court-card-effect">{copy.courtEffect}{cardEffect}</small>
        </button>;
      })}</div>
      <p className="court-hand-rule">{copy.campaignCourtRule}</p>
    </div>
    <div className="court-footer">
      {battleResult && !verdict && <div className={`battle-result ${battleResult === 'player_win' ? 'is-win' : 'is-loss'}`} role="status">
        <strong>{battleResult === 'player_win' ? copy.campaignVictory : copy.campaignDefeat}</strong>
        <p>{battleResult === 'player_win' ? copy.courtBattleResultWin : copy.courtBattleResultLoss}</p>
        <button type="button" className="button primary" onClick={onRequestVerdict} disabled={submitting}>{submitting ? copy.courtBattleFeedback : copy.campaignRequestVerdict}</button>
      </div>}
      {error && <p className="error-message court-error" role="alert">{error}</p>}
      {!battleResult && <div className="court-actions"><small>{copy.courtVerdictLocked}</small><button type="button" className="button verdict-button" disabled>{copy.campaignRequestVerdict}</button></div>}
      {verdict && <div className="verdict-card"><div className="verdict-header"><span>{verdict.winner}</span><strong>{locale === 'en' ? `${verdict.score} pts` : `${verdict.score} 分`}</strong></div><p>{verdict.award}</p><p>{verdict.reasoning}</p><h4>{copy.courtEvidenceChain}</h4><ol>{verdict.chain.map((item) => <li key={item}>{item}</li>)}</ol><h4>{copy.courtLegalLeads}</h4><ul>{verdict.sources.map((source) => <li key={source.title}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul><p className="disclaimer">{verdict.disclaimer}</p>{verdict.gameResult === 'opponent_win' ? <button type="button" className="button secondary" onClick={onInvestigate}>{copy.campaignReturnRetry}</button> : onNext && <button type="button" className="button primary" onClick={onNext}>{copy.campaignNext}</button>}</div>}
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

function ProfileModal({ profile, authenticated, onSave, onClose, onAuthRequest }: { profile: PlayerProfile | null; authenticated: boolean; onSave: (input: Pick<PlayerProfile, 'name' | 'avatar'>) => Promise<void>; onClose: () => void; onAuthRequest: () => void }) {
  const { locale } = useLocale();
  const copy = APP_COPY[locale];
  const [name, setName] = useState(profile?.name || '');
  const [avatar, setAvatar] = useState(profile?.avatar || AVATARS[0].src);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = normalizeUsername(name);
    if (!/^[\p{L}\p{N}_-]{2,20}$/u.test(trimmed)) { setError(copy.profileInvalidName); return; }
    setSaving(true); setError('');
    try { await onSave({ name: trimmed, avatar }); }
    catch { setError(copy.profileSaveError); }
    finally { setSaving(false); }
  }

  return <div className="profile-overlay" role="presentation">
    <section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title">
      {profile && <button type="button" className="profile-close" onClick={onClose} aria-label={copy.profileClose}>×</button>}
      <div className="profile-hero"><img src="/assets/lawyer-cat-transparent.png" alt={copy.brandAlt} /><div><span className="eyebrow">ARGUS+ PLAYER FILE</span><h2 id="profile-title">{profile ? copy.profileTitleEdit : copy.profileTitleNew}</h2><p>{copy.profileDesc}</p></div></div>
      <form onSubmit={submit}>
        <label className="profile-name-field">{copy.profileNameLabel} <span>{authenticated ? copy.profileNameHelpAuthed : copy.profileNameHelpRequired}</span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={20} readOnly={authenticated} autoFocus={!profile} placeholder={locale === 'en' ? 'e.g. EvidenceCat' : '例如：林墨'} /></label>
        <div className="avatar-picker"><div className="avatar-picker-heading"><strong>{copy.profileAvatarTitle}</strong><small>{copy.profileAvatarHint}</small></div><div className="avatar-options">{AVATARS.map((item) => <button type="button" key={item.id} className={`avatar-option ${avatar === item.src ? 'selected' : ''}`} onClick={() => setAvatar(item.src)} aria-label={locale === 'en' ? 'Cat avatar' : item.label} aria-pressed={avatar === item.src}><img src={item.src} alt="" /><span>{locale === 'en' ? 'Cat avatar' : item.label}</span></button>)}</div></div>
        <p className="profile-privacy">{copy.profilePrivacy}</p>
        {error && <p className="error-message" role="alert">{error}</p>}
        <div className="profile-actions"><button type="submit" className="button primary" disabled={saving}>{saving ? (locale === 'en' ? 'Saving…' : '正在保存…') : copy.profileSave}</button>{profile && <button type="button" className="button secondary" onClick={onClose}>{copy.profileLater}</button>}</div>
        {!authenticated && isSupabaseConfigured && <button type="button" className="profile-auth-link" onClick={onAuthRequest}>{copy.profileAuthLink}</button>}
      </form>
    </section>
  </div>;
}

function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (user: AuthUser, username: string) => Promise<void> }) {
  const { locale } = useLocale();
  const copy = APP_COPY[locale];
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const usernameValid = /^[\p{L}\p{N}_-]{2,20}$/u.test(normalizeUsername(username));

  async function checkAvailability() {
    if (!usernameValid || !isSupabaseConfigured) return;
    setChecking(true); setError('');
    try { setAvailable(await isUsernameAvailable(normalizeUsername(username))); }
    catch (checkError) { setError(checkError instanceof Error ? checkError.message : copy.authCheckError); }
    finally { setChecking(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage('');
    const cleanUsername = normalizeUsername(username);
    if (!isSupabaseConfigured) { setError(copy.authNotConfigured); return; }
    if (!usernameValid) { setError(copy.authUsernameInvalid); return; }
    if (password.length < 6) { setError(copy.authPasswordShort); return; }
    if (mode === 'register') {
      if (password !== confirmPassword) { setError(copy.authPasswordMismatch); return; }
      if (available === false) { setError(copy.authUsernameTaken); return; }
    }
    setSubmitting(true);
    try {
      if (mode === 'register') {
        if (available !== true) {
          setChecking(true);
          const canUse = await isUsernameAvailable(cleanUsername);
          setAvailable(canUse);
          setChecking(false);
          if (!canUse) { setError(copy.authUsernameTaken); return; }
        }
        const result = await registerAccount(cleanUsername, password);
        if (result.needsEmailConfirmation || !result.user) {
          setMessage(copy.authRegisterMessage);
          return;
        }
        await onSuccess(result.user, cleanUsername);
      } else {
        const user = await loginAccount(cleanUsername, password);
        await onSuccess(user, cleanUsername);
      }
    } catch (submitError) {
      const raw = submitError instanceof Error ? submitError.message : copy.authOperationError;
      const normalized = raw.toLowerCase();
      const message = normalized.includes('already registered') || normalized.includes('duplicate')
        ? copy.authUsernameTaken
        : normalized.includes('invalid login credentials')
          ? copy.authLoginBadCredentials
          : normalized.includes('email not confirmed')
            ? copy.authEmailUnconfirmed
            : raw;
      setError(message);
    } finally { setChecking(false); setSubmitting(false); }
  }

  return <div className="profile-overlay" role="presentation">
    <section className="profile-modal auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button type="button" className="profile-close" onClick={onClose} aria-label={copy.authClose}>×</button>
      <div className="profile-hero"><img src="/assets/lawyer-cat-transparent.png" alt={copy.brandAlt} /><div><span className="eyebrow">ARGUS+ ACCOUNT</span><h2 id="auth-title">{mode === 'register' ? copy.authTitleRegister : copy.authTitleLogin}</h2><p>{copy.authDesc}</p></div></div>
      <div className="auth-tabs"><button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); setMessage(''); }}>{copy.authRegister}</button><button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); setMessage(''); }}>{copy.authLogin}</button></div>
      <form onSubmit={submit}>
        <label className="profile-name-field">{copy.authNameLabel} <span>{copy.authNameHelp}</span><div className="username-row"><input value={username} onChange={(event) => { setUsername(event.target.value); setAvailable(null); }} maxLength={20} autoFocus placeholder={locale === 'en' ? 'e.g. EvidenceCat' : '例如：证据收藏家'} /><button type="button" className="button secondary username-check" onClick={checkAvailability} disabled={!usernameValid || checking || mode === 'login'}>{checking ? copy.authUsernameChecking : mode === 'login' ? copy.authLogin : available === true ? copy.authUsernameAvailable : copy.authCheck}</button></div></label>
        <label className="profile-name-field">{copy.authPasswordLabel} <span>{copy.authPasswordHelp}</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} maxLength={72} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder={locale === 'en' ? 'Enter password' : '输入密码'} /></label>
        {mode === 'register' && <label className="profile-name-field">{copy.authConfirmLabel} <span>{copy.authConfirmHelp}</span><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={6} maxLength={72} autoComplete="new-password" placeholder={locale === 'en' ? 'Enter password again' : '再次输入密码'} /></label>}
        {available === true && mode === 'register' && <p className="availability-ok">{locale === 'en' ? 'Username is available.' : '用户名可用，可以注册。'}</p>}
        {available === false && mode === 'register' && <p className="availability-taken">{copy.authUsernameTaken}</p>}
        {message && <p className="profile-status" role="status">{message}</p>}
        {error && <p className="error-message" role="alert">{error}</p>}
        <button type="submit" className="button primary auth-submit" disabled={submitting}>{submitting ? (locale === 'en' ? 'Working…' : '处理中…') : mode === 'register' ? copy.authSubmitRegister : copy.authSubmitLogin}</button>
      </form>
    </section>
  </div>;
}

function PanelHeading({ title, badge }: { eyebrow: string; title: string; badge: string }) { return <div className="panel-heading"><div><h2>{title}</h2></div><span className="tag ready">{badge}</span></div>; }
function InfoList({ title, items }: { title: string; items: string[] }) { return <div className="info-list"><h4>{title}</h4><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></div>; }
function EmptyState({ text }: { text: string }) { return <div className="empty-state"><p>{text}</p></div>; }
function Stat({ label, value }: { label: string; value: number }) { return <div className="stat"><strong>{value}</strong><span>{label}</span></div>; }
function FindingCard({ finding }: { finding: AuditFinding }) { return <article className={`finding finding-${finding.severity}`}><div className="finding-top"><span className={`tag ${finding.severity === 'high' ? 'danger' : ''}`}>{finding.category}</span><span className="necessity">必要度 {finding.necessity}/10</span><small>第 {finding.clauseIndex + 1} 段 · {finding.skill_name} v{finding.skill_version}</small></div><blockquote>{finding.clause}</blockquote><p><strong>风险：</strong>{finding.issue}</p><p><strong>方向：</strong>{finding.direction}</p><div className="revision-box"><small>修改参考文本</small>{finding.suggested_text}</div><div className="source-links"><span>置信度 {Math.round(finding.confidence * 100)}%</span>{finding.law_sources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.sourceId || source.title}>{source.title} ↗</a>)}</div><small className="pending">待确认：{finding.pending_questions.join('；')}</small></article>; }
