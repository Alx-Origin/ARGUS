const http = require('node:http');
const { randomUUID } = require('node:crypto');
const { URL } = require('node:url');
const { getCampaignLevels, getCampaignCase, demoCase, respondToDebate, buildVerdict } = require('./campaign');

const DEFAULT_PORT = 4000;
const MAX_BODY_BYTES = 3 * 1024 * 1024;
const API_VERSION = '0.2.1';

const LAW_SOURCES = {
  civil509: {
    title: '《中华人民共和国民法典》第509条',
    article: '当事人应当按照约定全面履行自己的义务，并遵循诚信原则。',
    url: 'https://www.gov.cn/xinwen/2020-06/01/content_5516649.htm',
    status: '现行（以官方发布为准）',
  },
  civil562: {
    title: '《中华人民共和国民法典》第562条',
    article: '当事人协商一致，可以解除合同。当事人可以约定一方解除合同的事由。',
    url: 'https://www.gov.cn/xinwen/2020-06/01/content_5516649.htm',
    status: '现行（以官方发布为准）',
  },
  civil585: {
    title: '《中华人民共和国民法典》第585条',
    article: '约定的违约金过分高于造成的损失的，当事人可以请求人民法院或者仲裁机构予以适当减少。',
    url: 'https://www.gov.cn/xinwen/2020-06/01/content_5516649.htm',
    status: '现行（以官方发布为准）',
  },
  civil710: {
    title: '《中华人民共和国民法典》第710条',
    article: '承租人按照约定的方法或者根据租赁物的性质使用租赁物，致使租赁物受到损耗的，不承担赔偿责任。',
    url: 'https://www.gov.cn/xinwen/2020-06/01/content_5516649.htm',
    status: '现行（以官方发布为准）',
  },
  civil713: {
    title: '《中华人民共和国民法典》第713条',
    article: '承租人在租赁物需要维修时可以请求出租人在合理期限内维修。出租人未履行维修义务的，承租人可以自行维修，维修费用由出租人负担。',
    url: 'https://www.gov.cn/xinwen/2020-06/01/content_5516649.htm',
    status: '现行（以官方发布为准）',
  },
};

const auditRules = [
  { id: 'scope', skillId: 'general-contract-v1', skillName: '通用合同审查', name: '标的与范围', severity: 'medium', necessity: 8, pattern: /标的|服务内容|货物|产品|商铺|房屋|面积|位置|用途/, issue: '合同标的、范围、数量、质量或用途描述不够可核验，可能导致履行边界争议。', direction: '以附件、清单或图纸明确标的、规格、面积、用途及交付状态，并确定文件冲突时的适用顺序。', suggestedText: '合同标的及履行范围以双方确认的附件清单为准；附件应载明名称、规格、数量、位置、现状及允许用途。', lawSourceIds: ['civil509'] },
  { id: 'deadline', skillId: 'general-contract-v1', skillName: '通用合同审查', name: '期限与节点', severity: 'high', necessity: 9, pattern: /及时|尽快|另行协商|届时|期限|工作日|完成/, issue: '履行期限主观且不可直接核验，容易引发迟延履行争议。关键事项留待后续确定，合同履行条件尚未闭合。', direction: '改为明确日期、工作日数量及期限起算点；增加确认方式、反馈期限以及协商不成时的处理机制。', suggestedText: '相关事项应于明确日期或触发事件发生之日起___个工作日内完成；一方应以书面方式确认，另一方应在收到后___个工作日内反馈。', lawSourceIds: ['civil509'] },
  { id: 'payment', skillId: 'general-contract-v1', skillName: '通用合同审查', name: '价款、支付与发票', severity: 'high', necessity: 9, pattern: /价款|租金|费用|支付|付款|收款|发票|账户/, issue: '价款构成、支付条件、结算周期或发票安排不完整，可能造成额外收费、付款条件失衡或税务风险。', direction: '明确含税总价、费用边界、付款节点、验收与开票先后关系、账户变更验证以及逾期责任。', suggestedText: '合同含税总价为人民币___元，已包含履约所需全部费用。付款以约定条件完成并收到合法有效发票为前提；收款账户变更须经书面通知及复核。', lawSourceIds: ['civil509'] },
  { id: 'acceptance', skillId: 'general-contract-v1', skillName: '通用合同审查', name: '交付与验收', severity: 'high', necessity: 9, pattern: /交付|验收|合格|签收|异议|整改/, issue: '交付标准、验收程序或异议期限不清，容易出现“交付即视为合格”或久拖不验的争议。', direction: '列明交付资料、客观验收标准、验收期限、整改复验和逾期处理；不得仅以沉默推定实质合格。', suggestedText: '接收方应在___个工作日内按附件标准验收并书面反馈；不合格的，交付方应在___日内整改并申请复验。', lawSourceIds: ['civil509'] },
  { id: 'deposit', skillId: 'lease-contract-v1', skillName: '房屋租赁 Skill', name: '保证金与押金', severity: 'medium', necessity: 8, pattern: /保证金|押金|保函|扣除|退还/, issue: '保证金用途、扣划条件、补足及退还期限不明，可能造成任意扣款或担保失效。', direction: '明确金额、用途、扣划证据与通知程序、补足期限、退还条件及逾期责任。', suggestedText: '保证金仅可用于抵扣本合同项下已到期且有书面依据的款项；扣划前应通知并说明依据。合同终止且结清后___个工作日内退还余额。', lawSourceIds: ['civil509', 'civil710'] },
  { id: 'liability', skillId: 'general-contract-v1', skillName: '通用合同审查', name: '违约责任', severity: 'high', necessity: 10, pattern: /违约|赔偿|损失|违约金|罚款|责任/, issue: '责任触发条件、损失范围或违约金标准可能失衡，且缺少催告、整改和责任上限安排。', direction: '让责任与具体义务一一对应，设置催告及合理整改期；区分直接损失与可得利益，并检查双方权责是否基本平衡。', suggestedText: '一方违约的，守约方应书面催告并给予___日整改期；逾期未改的，违约方按___承担责任。赔偿以有证据证明且与违约具有直接因果关系的损失为限。', lawSourceIds: ['civil585'] },
  { id: 'dispute', skillId: 'dispute-resolution-v1', skillName: '争议解决与送达 Skill', name: '争议解决与送达', severity: 'medium', necessity: 8, pattern: /争议|仲裁|法院|管辖|通知|送达|地址/, issue: '争议条款可能同时约定仲裁与诉讼，或缺少有效送达规则。', direction: '在仲裁或诉讼中择一；核查专属管辖，并约定地址、电子送达及变更通知。', suggestedText: '因本合同产生的争议，协商不成的，向有管辖权的人民法院提起诉讼。合同载明地址及电子邮箱为有效送达地址，变更应提前书面通知。', lawSourceIds: ['civil509'] },
  { id: 'data', skillId: 'data-compliance-v1', skillName: '数据合规与个人信息 Skill', name: '知识产权、保密与数据', severity: 'high', necessity: 9, pattern: /知识产权|著作权|商标|保密|秘密|个人信息|数据|隐私|监控/, issue: '成果归属、授权边界、保密例外或个人信息处理规则不清，可能引发侵权、泄密和数据合规风险。', direction: '区分既有成果与新成果；明确许可主体、地域、期限和场景；个人信息按最小必要处理并约定安全事件通知。', suggestedText: '各方既有知识产权仍归原权利人所有。处理个人信息应限于履约必要范围，发生安全事件应立即通知并采取补救措施。', lawSourceIds: ['civil509'] },
];

function splitClausesDetailed(text) {
  const clauses = [];
  const matcher = /[^\n。；！？]+(?:[。；！？]|$)/g;
  let match;
  while ((match = matcher.exec(text)) && clauses.length < 180) {
    const clause = match[0].trim();
    if (!clause) continue;
    const leadingWhitespace = match[0].indexOf(clause);
    clauses.push({ clause, start: match.index + Math.max(0, leadingWhitespace), end: match.index + match[0].length });
  }
  return clauses;
}

function splitClauses(text) {
  return splitClausesDetailed(text).map(({ clause }) => clause);
}

function inferCaseType(text) {
  if (/退货|网购|消费者/.test(text)) return '网络消费合同纠纷';
  if (/加班|工资|劳动/.test(text)) return '劳动争议';
  if (/租赁|押金|房东|退租/.test(text)) return '房屋租赁合同纠纷';
  if (/个人信息|隐私|数据/.test(text)) return '个人信息保护纠纷';
  return '合同纠纷';
}

function extractAmount(text) {
  return (text.match(/(?:人民币)?\s*\d[\d,]*(?:\.\d+)?\s*(?:元|万元)/) || [])[0] || '金额待核验';
}

function buildCaseDraft(input) {
  const concept = String(input.concept || '').trim();
  if (!concept) {
    const error = new Error('concept 不能为空');
    error.statusCode = 400;
    throw error;
  }
  const caseType = inferCaseType(concept);
  const amount = extractAmount(concept);
  const isLease = caseType === '房屋租赁合同纠纷';
  return {
    id: randomUUID(), title: `${caseType} · 案件草案`, caseType,
    side: input.side === 'defendant' ? 'defendant' : 'plaintiff', jurisdiction: String(input.jurisdiction || '中国大陆'),
    parties: { plaintiff: String(input.plaintiff || '主张方身份待补充'), defendant: String(input.defendant || '相对方身份待补充') },
    focus: isLease ? ['损坏是否在入住前已经存在', `争议金额 ${amount} 的计算和押金扣除依据`, '房东是否完成退租验收和维修金额举证'] : ['核心事实与时间线能否由原始材料相互印证', `争议金额 ${amount} 的计算和支付依据`, '关键条款是否被充分提示说明且具备效力'],
    evidencePlan: isLease ? ['入住/退租照片与元数据', '微信聊天、转账和维修凭证', '租赁合同押金条款与验收记录'] : ['合同、订单或协议原件', '付款、退款或结算凭证', '聊天记录、通知及完整时间戳'],
    source: 'node-local-rules', trace: { sourceType: 'user_input', amount, needsVerification: true },
  };
}

function auditContract(input) {
  const text = String(input.text || '').trim();
  if (!text) {
    const error = new Error('text 不能为空');
    error.statusCode = 400;
    throw error;
  }
  const clauses = splitClausesDetailed(text);
  const contractType = String(input.contractType || (/租赁|押金|房东|退租/.test(text) ? '房屋租赁合同' : '通用合同'));
  const position = String(input.position || '其他');
  const enabledRules = contractType.includes('租赁') ? auditRules : auditRules.filter((rule) => rule.id !== 'deposit');
  const findings = [];
  clauses.forEach((item, clauseIndex) => {
    enabledRules.forEach((rule) => {
      if (!rule.pattern.test(item.clause)) return;
      const sources = rule.lawSourceIds.map((sourceId) => ({ ...LAW_SOURCES[sourceId], sourceId }));
      const sideImpact = position === '甲方' ? '请同时核对乙方的履约与救济边界，避免单方免责。' : position === '乙方' ? '请重点核对付款、验收、押金和解除条件是否对我方不利。' : '请结合我方实际合同地位确认风险分配。';
      findings.push({
        id: `${rule.id}-${clauseIndex + 1}`, clauseIndex, clauseRange: { start: item.start, end: item.end }, clause: item.clause,
        category: rule.name, severity: rule.severity, skill_id: rule.skillId, skill_name: rule.skillName, skill_version: '1.0.0',
        issue: rule.issue, direction: `${rule.direction}${sideImpact}`, suggested_text: rule.suggestedText, suggestion: rule.direction,
        necessity: rule.necessity, confidence: 0.86, law_sources: sources, lawSourceIds: rule.lawSourceIds,
        pending_questions: ['请确认该条款对应的附件、履行记录和双方真实交易背景。'], status: '待人工确认',
      });
    });
  });
  const highRiskCount = findings.filter((finding) => finding.severity === 'high').length;
  return {
    summary: { position, contractType, background: String(input.background || '未填写'), clauseCount: clauses.length, findingCount: findings.length, highRiskCount, sourceCoverage: findings.length ? 1 : 0 },
    findings, skills: [...new Set(findings.map((finding) => `${finding.skill_id}@${finding.skill_version}`))],
    engine: 'argus-rule-orchestrator-v1', disclaimer: '这是训练用风险识别，不构成正式法律意见；高风险事项请人工复核。',
  };
}


const communityPosts = [
  { id: 'post-1', author: '证据收藏家', time: '今天 09:20', title: '租赁押金关卡复盘', body: '先找入住照片，再用聊天确认时间线，最后用合同条款和维修凭证完成闭环。', tags: ['#证据链', '#租赁'], likes: 18, comments: 4 },
  { id: 'post-2', author: '仲裁员小王', time: '昨天 21:05', title: '合同审查顺序', body: '我会先做主体与期限，再看付款、验收和违约责任，最后检查争议解决。', tags: ['#合同审查', '#方法论'], likes: 32, comments: 7 },
];


function resolveCorsOrigin(requestOrigin, configuredOrigin) {
  const allowedOrigins = String(configuredOrigin || '*').split(',').map((origin) => origin.trim()).filter(Boolean);
  if (!allowedOrigins.length || allowedOrigins.includes('*')) return '*';
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) return requestOrigin;
  return allowedOrigins[0];
}

function json(res, statusCode, payload, corsOrigin) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': corsOrigin, 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', Vary: 'Origin' });
  if (statusCode === 204) { res.end(); return; }
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) { const error = new Error('请求体超过 3MB'); error.statusCode = 413; throw error; }
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { const error = new Error('请求体必须是有效 JSON'); error.statusCode = 400; throw error; }
}

function createRequestHandler(options = {}) {
  const configuredCorsOrigin = options.corsOrigin || process.env.CORS_ORIGIN || 'http://localhost:3000';
  return async function requestHandler(req, res) {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const corsOrigin = resolveCorsOrigin(req.headers.origin, configuredCorsOrigin);
    if (req.method === 'OPTIONS') { json(res, 204, {}, corsOrigin); return; }
    try {
      if (req.method === 'GET' && url.pathname === '/health') { json(res, 200, { status: 'ok', service: 'argus-backend', runtime: 'node', version: API_VERSION, timestamp: new Date().toISOString() }, corsOrigin); return; }
      if (req.method === 'GET' && url.pathname === '/api') { json(res, 200, { name: 'ARGUS+ API', version: API_VERSION, endpoints: ['GET /health', 'POST /api/cases/draft', 'POST /api/contracts/audit', 'GET /api/campaign/levels', 'GET /api/campaign/cases/:id', 'GET /api/campaign/demo', 'POST /api/campaign/respond', 'POST /api/campaign/verdict', 'GET /api/community/feed', 'POST /api/community/posts'] }, corsOrigin); return; }
      if (req.method === 'POST' && url.pathname === '/api/cases/draft') { json(res, 201, { data: buildCaseDraft(await readJson(req)) }, corsOrigin); return; }
      if (req.method === 'POST' && url.pathname === '/api/contracts/audit') { json(res, 200, { data: auditContract(await readJson(req)) }, corsOrigin); return; }
      if (req.method === 'GET' && url.pathname === '/api/campaign/levels') { json(res, 200, { data: getCampaignLevels() }, corsOrigin); return; }
      const caseRoute = url.pathname.match(/^\/api\/campaign\/cases\/([^/]+)$/);
      if (req.method === 'GET' && caseRoute) { json(res, 200, { data: getCampaignCase(caseRoute[1]) }, corsOrigin); return; }
      if (req.method === 'GET' && url.pathname === '/api/campaign/demo') { json(res, 200, { data: getCampaignCase() }, corsOrigin); return; }
      if (req.method === 'POST' && url.pathname === '/api/campaign/respond') { json(res, 200, { data: respondToDebate(await readJson(req)) }, corsOrigin); return; }
      if (req.method === 'POST' && url.pathname === '/api/campaign/verdict') { json(res, 200, { data: buildVerdict(await readJson(req)) }, corsOrigin); return; }
      if (req.method === 'GET' && url.pathname === '/api/community/feed') { json(res, 200, { data: { posts: communityPosts } }, corsOrigin); return; }
      if (req.method === 'POST' && url.pathname === '/api/community/posts') {
        const body = await readJson(req);
        const title = String(body.title || '').trim();
        const postBody = String(body.body || '').trim();
        if (!title || !postBody) { const error = new Error('title 和 body 不能为空'); error.statusCode = 400; throw error; }
        const post = { id: randomUUID(), author: String(body.author || '匿名律师猫'), time: '刚刚', title, body: postBody, tags: Array.isArray(body.tags) ? body.tags.slice(0, 5) : ['#新分享'], likes: 0, comments: 0 };
        communityPosts.unshift(post); json(res, 201, { data: post }, corsOrigin); return;
      }
      json(res, 404, { error: { message: '路由不存在' } }, corsOrigin);
    } catch (error) {
      const statusCode = Number(error.statusCode) || 500;
      json(res, statusCode, { error: { message: statusCode === 500 ? '服务器内部错误' : error.message } }, corsOrigin);
    }
  };
}

function createServer(options = {}) { return http.createServer(createRequestHandler(options)); }

if (require.main === module) {
  const port = Number(process.env.PORT) || DEFAULT_PORT;
  const host = process.env.HOST || '0.0.0.0';
  const server = createServer();
  server.listen(port, host, () => console.log(`ARGUS+ backend listening on http://${host}:${port}`));
}

module.exports = { auditContract, buildCaseDraft, buildVerdict, createRequestHandler, createServer, demoCase, inferCaseType, respondToDebate, splitClauses };
