'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';

type ServiceState = 'checking' | 'online' | 'offline';
type Section = 'forge' | 'audit' | 'campaign' | 'community';

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

type Evidence = {
  id: string;
  title: string;
  type: string;
  sourceDocumentId: string;
  sourceRange: string;
  description: string;
  proofPurpose: string;
  authenticity: string;
  relevance: string;
  credibility: number;
};
type Scene = { id: string; title: string; description: string; hotspots: Array<{ id: string; title: string; icon: string; evidenceId: string; hint: string }> };
type Document = { id: string; name: string; type: string; content: string; hotspots: Array<{ id: string; evidenceId: string; label: string }> };
type DemoCase = { id: string; title: string; type: string; difficulty: number; playerSide: string; opponentSide: string; goal: string; focus: string[]; scenes: Scene[]; documents: Document[]; evidence: Evidence[]; keyEvidenceIds: string[] };
type DebateTurn = { id: string; speaker: string; argument: string; evidenceIds: string[]; response: string; judge: string; scoreChange: number; createdAt: string };
type Verdict = { status: string; winner: string; score: number; award: string; chain: string[]; reasoning: string; sources: LawSource[] };
type CommunityPost = { id: string; author: string; time: string; title: string; body: string; tags: string[]; likes: number; comments: number };

const sections: Array<{ id: Section; label: string; icon: string }> = [
  { id: 'forge', label: '案件工坊', icon: '⚖' },
  { id: 'audit', label: '合同猎魔', icon: '📄' },
  { id: 'campaign', label: '法庭闯关', icon: '🎮' },
  { id: 'community', label: '社区广场', icon: '🏛' },
];

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error?.message || `请求失败：${response.status}`);
  return body.data ?? body;
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
  const apiBaseUrl = useMemo(() => (process.env.NEXT_PUBLIC_API_BASE_URL || '/argus-api').replace(/\/$/, ''), []);
  const [activeSection, setActiveSection] = useState<Section>('forge');
  const [serviceState, setServiceState] = useState<ServiceState>('checking');
  const [serviceMessage, setServiceMessage] = useState('正在连接 ARGUS+ API…');
  const [caseDraft, setCaseDraft] = useState<CaseDraft | null>(null);
  const [caseLoading, setCaseLoading] = useState(false);
  const [caseError, setCaseError] = useState('');
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [demoCase, setDemoCase] = useState<DemoCase | null>(null);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignError, setCampaignError] = useState('');
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    requestJson<{ status: string; service: string; version?: string }>(`${apiBaseUrl}/health`)
      .then((health) => {
        if (cancelled) return;
        setServiceState('online');
        setServiceMessage(`${health.service} v${health.version || '0.2.0'} 已连接`);
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setServiceState('offline');
        setServiceMessage(error.message);
      });
    return () => { cancelled = true; };
  }, [apiBaseUrl]);

  useEffect(() => {
    if (activeSection !== 'campaign' || demoCase) return;
    setCampaignLoading(true);
    requestJson<DemoCase>(`${apiBaseUrl}/api/campaign/demo`)
      .then(setDemoCase)
      .catch((error: Error) => setCampaignError(error.message))
      .finally(() => setCampaignLoading(false));
  }, [activeSection, apiBaseUrl, demoCase]);

  useEffect(() => {
    if (activeSection !== 'community') return;
    setCommunityLoading(true);
    requestJson<{ posts: CommunityPost[] }>(`${apiBaseUrl}/api/community/feed`)
      .then((payload) => setCommunityPosts(payload.posts))
      .catch(() => setCommunityPosts([]))
      .finally(() => setCommunityLoading(false));
  }, [activeSection, apiBaseUrl]);

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

  function chooseSection(section: Section) {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <main>
      <header className="masthead">
        <button className="brand" onClick={() => chooseSection('forge')} aria-label="返回案件工坊">
          <img src="/assets/lawyer-cat-transparent.png" alt="ARGUS+ 律师猫" />
          <span><strong>ARGUS+</strong><small>LEGAL TRAINING PLATFORM · MVP</small></span>
        </button>
        <nav aria-label="主导航">
          {sections.map((section) => <button key={section.id} className={activeSection === section.id ? 'active' : ''} onClick={() => chooseSection(section.id)}><span aria-hidden="true">{section.icon}</span> {section.label}</button>)}
        </nav>
        <div className={`service-state ${serviceState}`}><span className="service-dot" /><span>{serviceMessage}</span></div>
      </header>

      <div className="page-shell">


        {activeSection === 'forge' && <ForgeSection onSubmit={createCase} loading={caseLoading} error={caseError} draft={caseDraft} />}
        {activeSection === 'audit' && <AuditSection onSubmit={auditContract} loading={auditLoading} error={auditError} result={auditResult} />}
        {activeSection === 'campaign' && <CampaignSection />}
        {activeSection === 'community' && <CommunitySection apiBaseUrl={apiBaseUrl} posts={communityPosts} setPosts={setCommunityPosts} loading={communityLoading} />}
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
      <div className="upload-note"><span>📎</span><div><strong>材料接入（MVP）</strong><small>可先粘贴原文；合同审查页支持 TXT / MD 文本文件。PDF、Word、图片解析接口保留在下一迭代。</small></div></div>
      <button className="button primary" disabled={loading}>{loading ? '正在配置案件…' : '生成案件草案 →'}</button>{error && <p className="error-message">{error}</p>}
    </form>
    <div className="panel result-panel"><PanelHeading eyebrow="CASE SPACE" title="案件空间" badge={draft ? '已配置' : '等待输入'} />
      {draft ? <div className="result-stack"><div className="case-title-row"><span className="tag ready">{draft.caseType}</span><span className="tag">{draft.jurisdiction}</span></div><h3>{draft.title}</h3><div className="party-grid"><div><small>原告</small><strong>{draft.parties.plaintiff}</strong></div><div><small>被告</small><strong>{draft.parties.defendant}</strong></div></div><InfoList title="争议焦点" items={draft.focus} /><InfoList title="建议先找的原件" items={draft.evidencePlan} /><div className="trace-box"><strong>可追溯状态</strong><span>来源：{draft.source}</span><span>金额：{draft.trace?.amount || '待核验'} · 需要人工确认</span></div></div> : <EmptyState text="案件草案会在这里生成，并可作为法庭闯关的事实底稿。" />}
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
  return (
    <section className="campaign-embed" aria-label="法庭闯关">
      <iframe
        title="ARGUS+ 法庭闯关"
        src="/argus-original.html#campaign"
        style={{ width: '100%', minHeight: '1000px', border: 0, display: 'block', background: 'transparent' }}
      />
    </section>
  );
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
  return <section className="community-shell"><div className="community-layout"><aside className="panel community-sidebar"><PanelHeading eyebrow="COMMUNITY SQUARE" title="社区广场" badge="脱敏分享" /><div className="leaderboard"><h3>本周训练榜</h3>{[['1','证据收藏家','2,520'],['2','仲裁员小王','2,180'],['3','法外狂徒张三','1,960']].map(([rank, name, score]) => <div className="leader-row" key={rank}><strong>{rank}</strong><span>🐱</span><div><b>{name}</b><small>案件训练者</small></div><em>{score}</em></div>)}</div><div className="privacy-card"><strong>🔒 默认私有</strong><p>案件、合同和聊天记录不会自动公开。发布前请先脱敏，并确认内容不含个人信息。</p></div></aside><div className="community-main"><form className="panel share-form" onSubmit={submitPost}><PanelHeading eyebrow="SHARE A RUN" title="分享一次复盘" badge="POST" /><div className="field-grid"><label>标题<input name="title" required placeholder="例如：租赁押金关卡的证据链" /></label><label>标签<input name="tags" placeholder="#证据链 #租赁" /></label></div><label>内容<textarea name="body" required placeholder="分享你的思路、遇到的质证或合同审查方法…" /></label><label className="checkbox-line"><input type="checkbox" name="privacy" /> 我已脱敏，并确认不发布合同、聊天记录等原始文件</label><div className="button-row"><button className="button primary" disabled={submitting}>{submitting ? '正在发布…' : '发布到社区 →'}</button></div>{error && <p className="error-message">{error}</p>}</form><div className="feed-list">{loading ? <div className="panel loading-panel">正在加载社区动态…</div> : posts.map((post) => <article className="panel feed-card" key={post.id}><div className="feed-header"><div><span className="avatar">🐱</span><strong>{post.author}</strong></div><small>{post.time}</small></div><h3>{post.title}</h3><p>{post.body}</p><div>{post.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div><div className="feed-actions"><button onClick={() => setLiked(liked.includes(post.id) ? liked.filter((id) => id !== post.id) : [...liked, post.id])}>{liked.includes(post.id) ? '♥' : '♡'} {post.likes + (liked.includes(post.id) ? 1 : 0)}</button><span>💬 {post.comments}</span></div></article>)}</div></div></div></section>;
}

function PanelHeading({ eyebrow, title, badge }: { eyebrow: string; title: string; badge: string }) { return <div className="panel-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1></div><span className="tag ready">{badge}</span></div>; }
function InfoList({ title, items }: { title: string; items: string[] }) { return <div className="info-list"><h4>{title}</h4><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></div>; }
function EmptyState({ text }: { text: string }) { return <div className="empty-state"><span>🐾</span><p>{text}</p></div>; }
function Stat({ label, value }: { label: string; value: number }) { return <div className="stat"><strong>{value}</strong><span>{label}</span></div>; }
function FindingCard({ finding }: { finding: AuditFinding }) { return <article className={`finding finding-${finding.severity}`}><div className="finding-top"><span className={`tag ${finding.severity === 'high' ? 'danger' : ''}`}>{finding.category}</span><span className="necessity">必要度 {finding.necessity}/10</span><small>第 {finding.clauseIndex + 1} 段 · {finding.skill_name} v{finding.skill_version}</small></div><blockquote>{finding.clause}</blockquote><p><strong>风险：</strong>{finding.issue}</p><p><strong>方向：</strong>{finding.direction}</p><div className="revision-box"><small>修改参考文本</small>{finding.suggested_text}</div><div className="source-links"><span>置信度 {Math.round(finding.confidence * 100)}%</span>{finding.law_sources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.sourceId || source.title}>{source.title} ↗</a>)}</div><small className="pending">待确认：{finding.pending_questions.join('；')}</small></article>; }
function ScoreBar({ label, value, color }: { label: string; value: number; color: 'blue' | 'red' }) { return <div className="score-bar"><div><span>{label}</span><strong>{value}</strong></div><div className="score-track"><i className={color} style={{ width: `${value}%` }} /></div></div>; }
function VerdictCard({ verdict }: { verdict: Verdict }) { return <div className="verdict-card"><div className="verdict-header"><span>⚖ 法官猫裁判</span><strong>{verdict.score} 分</strong></div><h3>{verdict.winner}</h3><p>{verdict.award}</p><p>{verdict.reasoning}</p><h4>证据链</h4><ol>{verdict.chain.map((item) => <li key={item}>{item}</li>)}</ol><div className="source-links">{verdict.sources.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.title}>{source.title} ↗</a>)}</div></div>; }
