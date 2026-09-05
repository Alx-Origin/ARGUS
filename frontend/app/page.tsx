'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type ServiceState = 'checking' | 'online' | 'offline';
type Section = 'overview' | 'forge' | 'audit' | 'campaign' | 'community';

type CaseDraft = {
  id: string;
  title: string;
  caseType: string;
  jurisdiction: string;
  parties: { plaintiff: string; defendant: string };
  focus: string[];
  evidencePlan: string[];
  source: string;
};

type AuditFinding = {
  id: string;
  clauseIndex: number;
  clause: string;
  category: string;
  severity: 'high' | 'medium';
  suggestion: string;
};

type AuditResult = {
  summary: {
    position: string;
    clauseCount: number;
    findingCount: number;
    highRiskCount: number;
  };
  findings: AuditFinding[];
  engine: string;
};

const sections: Array<{ id: Section; label: string; icon: string }> = [
  { id: 'overview', label: '架构总览', icon: '⌂' },
  { id: 'forge', label: '案件工坊', icon: '⚖' },
  { id: 'audit', label: '合同审查', icon: '📄' },
  { id: 'campaign', label: '法庭闯关', icon: '🎮' },
  { id: 'community', label: '社区广场', icon: '🏛' },
];

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.error?.message || `请求失败：${response.status}`);
  }
  return body.data ?? body;
}

export default function HomePage() {
  const assetBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const apiBaseUrl = useMemo(
    () => (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, ''),
    [],
  );
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [serviceState, setServiceState] = useState<ServiceState>('checking');
  const [serviceMessage, setServiceMessage] = useState('正在连接独立 Node.js 服务…');
  const [caseDraft, setCaseDraft] = useState<CaseDraft | null>(null);
  const [caseLoading, setCaseLoading] = useState(false);
  const [caseError, setCaseError] = useState('');
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');

  useEffect(() => {
    let cancelled = false;
    requestJson<{ status: string; service: string }>(`${apiBaseUrl}/health`)
      .then((health) => {
        if (cancelled) return;
        setServiceState('online');
        setServiceMessage(`${health.service} 已连接`);
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setServiceState('offline');
        setServiceMessage(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl]);

  async function createCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setCaseLoading(true);
    setCaseError('');
    try {
      const draft = await requestJson<CaseDraft>(`${apiBaseUrl}/api/cases/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      setCaseDraft(draft);
    } catch (error) {
      setCaseError(error instanceof Error ? error.message : '案件生成失败');
    } finally {
      setCaseLoading(false);
    }
  }

  async function auditContract(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setAuditLoading(true);
    setAuditError('');
    try {
      const result = await requestJson<AuditResult>(`${apiBaseUrl}/api/contracts/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      setAuditResult(result);
    } catch (error) {
      setAuditError(error instanceof Error ? error.message : '合同审查失败');
    } finally {
      setAuditLoading(false);
    }
  }

  return (
    <main>
      <header className="masthead">
        <button className="brand" onClick={() => setActiveSection('overview')}>
          <img src={`${assetBasePath}/assets/lawyer-cat-transparent.png`} alt="ARGUS+ 律师猫" />
          <span>
            <strong>ARGUS+</strong>
            <small>LEGAL TRAINING PLATFORM</small>
          </span>
        </button>
        <nav aria-label="主导航">
          {sections.map((section) => (
            <button
              key={section.id}
              className={activeSection === section.id ? 'active' : ''}
              onClick={() => setActiveSection(section.id)}
            >
              <span aria-hidden="true">{section.icon}</span> {section.label}
            </button>
          ))}
        </nav>
        <div className={`service-state ${serviceState}`}>
          <span className="service-dot" />
          <span>{serviceMessage}</span>
        </div>
      </header>

      <div className="page-shell">
        {activeSection === 'overview' && (
          <section className="hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">NEXT.JS FRONTEND × NODE.JS BACKEND</span>
              <h1>ARGUS+ 的新框架已经分层。</h1>
              <p>
                浏览器界面由 Next.js App Router 承载，案件、合同审查和后续数据服务由独立
                Node.js 进程提供。两个应用可以分别开发、测试和部署。
              </p>
              <div className="hero-actions">
                <button className="button primary" onClick={() => setActiveSection('forge')}>
                  测试案件 API
                </button>
                <button className="button secondary" onClick={() => setActiveSection('audit')}>
                  测试审查 API
                </button>
              </div>
            </div>
            <div className="architecture-card">
              <div className="layer frontend-layer">
                <small>PORT 3000</small>
                <strong>Next.js Frontend</strong>
                <span>App Router · React · TypeScript</span>
              </div>
              <div className="connection">HTTP / JSON</div>
              <div className="layer backend-layer">
                <small>PORT 4000</small>
                <strong>Node.js Backend</strong>
                <span>REST API · 独立进程 · 独立部署</span>
              </div>
            </div>
            <div className="module-grid">
              {[
                ['案件工坊', 'POST /api/cases/draft', '已接通'],
                ['合同审查', 'POST /api/contracts/audit', '已接通'],
                ['法庭闯关', '案件、证据、辩论领域服务', '待迁移'],
                ['社区广场', '账户、帖子、评论与好友服务', '待迁移'],
              ].map(([title, endpoint, status]) => (
                <article key={title}>
                  <span className={status === '已接通' ? 'tag ready' : 'tag'}>{status}</span>
                  <h2>{title}</h2>
                  <code>{endpoint}</code>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeSection === 'forge' && (
          <section className="workspace-grid">
            <form className="panel" onSubmit={createCase}>
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">CASE FORGE</span>
                  <h1>案件工坊</h1>
                </div>
                <span className="tag ready">Node API</span>
              </div>
              <label>
                案件概念
                <textarea
                  name="concept"
                  required
                  defaultValue="租客退房时，房东以墙面划痕为由扣留押金3000元。"
                />
              </label>
              <div className="field-grid">
                <label>
                  原告
                  <input name="plaintiff" defaultValue="租客张某" />
                </label>
                <label>
                  被告
                  <input name="defendant" defaultValue="房东李某" />
                </label>
                <label>
                  代理立场
                  <select name="side" defaultValue="plaintiff">
                    <option value="plaintiff">原告</option>
                    <option value="defendant">被告</option>
                  </select>
                </label>
                <label>
                  管辖地区
                  <select name="jurisdiction" defaultValue="中国大陆">
                    <option>中国大陆</option>
                    <option>中国香港</option>
                    <option>跨境示范</option>
                  </select>
                </label>
              </div>
              <button className="button primary" disabled={caseLoading}>
                {caseLoading ? '正在请求 Node.js…' : '生成案件草案'}
              </button>
              {caseError && <p className="error-message">{caseError}</p>}
            </form>

            <div className="panel result-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">API RESULT</span>
                  <h2>案件草案</h2>
                </div>
              </div>
              {caseDraft ? (
                <div className="result-stack">
                  <span className="tag ready">{caseDraft.caseType}</span>
                  <h3>{caseDraft.title}</h3>
                  <p>
                    <strong>原告：</strong>{caseDraft.parties.plaintiff}
                  </p>
                  <p>
                    <strong>被告：</strong>{caseDraft.parties.defendant}
                  </p>
                  <h4>争议焦点</h4>
                  <ul>{caseDraft.focus.map((item) => <li key={item}>{item}</li>)}</ul>
                  <h4>建议证据</h4>
                  <ul>{caseDraft.evidencePlan.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              ) : (
                <EmptyState text="提交左侧表单后，这里会展示独立后端返回的 JSON 结果。" />
              )}
            </div>
          </section>
        )}

        {activeSection === 'audit' && (
          <section className="workspace-grid">
            <form className="panel" onSubmit={auditContract}>
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">CONTRACT AUDIT</span>
                  <h1>合同审查</h1>
                </div>
                <span className="tag ready">Node API</span>
              </div>
              <label>
                我方合同地位
                <select name="position" defaultValue="乙方">
                  <option>甲方</option>
                  <option>乙方</option>
                  <option>其他</option>
                </select>
              </label>
              <label>
                合同原文
                <textarea
                  name="text"
                  required
                  className="contract-input"
                  defaultValue={'第一条 乙方应尽快完成商铺交付。\n第二条 如乙方违约，甲方有权没收全部保证金。\n第三条 争议可提交仲裁或向法院起诉。'}
                />
              </label>
              <button className="button primary" disabled={auditLoading}>
                {auditLoading ? '正在执行规则审查…' : '开始合同审查'}
              </button>
              {auditError && <p className="error-message">{auditError}</p>}
            </form>

            <div className="panel result-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">REVIEW RESULT</span>
                  <h2>风险结果</h2>
                </div>
              </div>
              {auditResult ? (
                <div className="result-stack">
                  <div className="stat-grid">
                    <Stat label="条款" value={auditResult.summary.clauseCount} />
                    <Stat label="发现" value={auditResult.summary.findingCount} />
                    <Stat label="高风险" value={auditResult.summary.highRiskCount} />
                  </div>
                  {auditResult.findings.map((finding) => (
                    <article className="finding" key={finding.id}>
                      <div>
                        <span className={`tag ${finding.severity === 'high' ? 'danger' : ''}`}>
                          {finding.category}
                        </span>
                        <small>第 {finding.clauseIndex + 1} 段</small>
                      </div>
                      <blockquote>{finding.clause}</blockquote>
                      <p>{finding.suggestion}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState text="提交合同后，Node.js 会返回条款映射、风险等级与修改方向。" />
              )}
            </div>
          </section>
        )}

        {(activeSection === 'campaign' || activeSection === 'community') && (
          <section className="placeholder-panel">
            <span className="eyebrow">MIGRATION SLOT</span>
            <h1>{activeSection === 'campaign' ? '法庭闯关' : '社区广场'}</h1>
            <p>
              该模块已在 Next.js 导航中预留入口。下一阶段可将旧页面的状态逻辑迁移为 React
              组件，并为领域数据增加独立 Node.js API。
            </p>
            <button className="button secondary" onClick={() => setActiveSection('overview')}>
              返回架构总览
            </button>
          </section>
        )}
      </div>
    </main>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <span>🐾</span>
      <p>{text}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
