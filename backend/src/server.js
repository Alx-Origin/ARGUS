const http = require('node:http');
const { randomUUID } = require('node:crypto');
const { URL } = require('node:url');

const DEFAULT_PORT = 4000;
const MAX_BODY_BYTES = 3 * 1024 * 1024;

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

const demoCase = {
  id: 'rental-deposit-001', title: '租赁押金争议：墙面划痕是谁造成？', type: '房屋租赁合同纠纷', difficulty: 1,
  playerSide: '原告 · 租客张某', opponentSide: '被告 · 房东李某', goal: '证明房东无权扣留全部押金，并指出维修金额缺乏真实凭证。',
  focus: ['损坏是否由租客造成', '房东是否有权扣除全部押金', '维修金额是否有证据'],
  scenes: [
    { id: 'rental-room', title: '场景一 · 出租屋', description: '退租当天的出租屋。墙面、家具、钥匙和验收单都可能留下时间线线索。', hotspots: [
      { id: 'wall', title: '墙面划痕', icon: '🧱', evidenceId: 'ev-movein-photo', hint: '刮痕边缘已有旧灰尘。' }, { id: 'furniture', title: '旧家具', icon: '🪑', evidenceId: 'ev-inventory', hint: '入住清单记载已有磨损。' }, { id: 'keys', title: '钥匙与验收单', icon: '🔑', evidenceId: 'ev-checkout', hint: '退租交接没有双方签字。' },
    ] },
    { id: 'phone', title: '场景二 · 手机聊天', description: '连续微信对话、转账记录和房东发送的维修报价。', hotspots: [
      { id: 'chat', title: '微信对话', icon: '💬', evidenceId: 'ev-chat', hint: '房东曾说“墙面本来就有几道痕”。' }, { id: 'transfer', title: '押金转账', icon: '💴', evidenceId: 'ev-transfer', hint: '3000 元押金有完整流水。' },
    ] },
    { id: 'document-desk', title: '场景三 · 文件桌', description: '完整租赁合同、入住照片和维修报价单。点击原件中的黄色区域获得证据。', hotspots: [
      { id: 'contract', title: '租赁合同', icon: '📄', evidenceId: 'ev-contract', hint: '第5条约定无损坏应在7日内退还押金。' }, { id: 'repair', title: '维修报价单', icon: '🧾', evidenceId: 'ev-repair', hint: '只有报价，没有付款凭证。' },
    ] },
  ],
  documents: [
    { id: 'doc-contract', name: '房屋租赁合同（完整）', type: 'doc', content: '《房屋租赁合同》\n第一条 租赁房屋位于杭州市西湖区某小区，租期自2025年3月1日至2026年2月28日。\n第二条 月租金5000元，乙方于签约时支付押金3000元。\n第五条 租赁期满，乙方无违约行为且房屋无损坏的，甲方应在7日内全额退还押金。\n第六条 退租时双方应共同验收并签署交接单。', hotspots: [{ id: 'doc-contract-deposit', evidenceId: 'ev-contract', label: '第五条：7日内全额退还押金' }] },
    { id: 'doc-chat', name: '微信聊天记录（完整）', type: 'chat', content: '2026-02-20 09:14 张某：今天晚上可以验收吗？\n2026-02-20 09:18 李某：我先看看，墙面本来就有几道痕，之前没来得及处理。\n2026-02-20 18:32 张某：那几道痕入住时照片里就有。\n2026-02-20 18:40 李某：我核对一下照片。\n2026-02-28 10:05 李某：维修报价要 2500 元，押金先全部扣着。', hotspots: [{ id: 'doc-chat-old-damage', evidenceId: 'ev-chat', label: '房东确认墙面本来就有痕迹' }] },
    { id: 'doc-photo', name: '入住照片与元数据', type: 'img', content: '照片 IMG_0301.jpg\n形成时间：2025-03-01 12:06\n拍摄位置：客厅东侧墙面\n可见：与退租时相同位置存在浅色横向划痕。', hotspots: [{ id: 'doc-photo-scratch', evidenceId: 'ev-movein-photo', label: '入住当天已存在同位置划痕' }] },
    { id: 'doc-repair', name: '维修报价单', type: 'doc', content: '墙面修补及家具清洁报价：2500元。\n出具方：个人维修联系人。\n缺少：维修完成照片、付款流水、盖章发票和分项明细。', hotspots: [{ id: 'doc-repair-no-proof', evidenceId: 'ev-repair', label: '报价单没有付款和分项凭证' }] },
  ],
  evidence: [
    { id: 'ev-movein-photo', title: '入住照片：旧划痕', type: 'image', sourceDocumentId: 'doc-photo', sourceRange: 'IMG_0301.jpg · 2025-03-01 12:06', description: '入住当天同一墙面已经存在浅色横向划痕。', proofPurpose: '证明损坏形成时间早于租客退租。', authenticity: '原始文件待核验', relevance: '高', credibility: 9 },
    { id: 'ev-chat', title: '微信确认：墙面本来就有痕', type: 'chat', sourceDocumentId: 'doc-chat', sourceRange: '2026-02-20 09:18', description: '房东在聊天中先于争议确认墙面原本已有痕迹。', proofPurpose: '证明相对方对既有损坏有先行陈述。', authenticity: '含上下文', relevance: '高', credibility: 8 },
    { id: 'ev-contract', title: '合同第5条：7日退还押金', type: 'document', sourceDocumentId: 'doc-contract', sourceRange: '第五条', description: '无违约且无损坏时，房东应在7日内全额退还押金。', proofPurpose: '证明押金退还条件和期限。', authenticity: '合同原件', relevance: '高', credibility: 9 },
    { id: 'ev-repair', title: '维修报价：缺少实际支出凭证', type: 'receipt', sourceDocumentId: 'doc-repair', sourceRange: '报价单全文', description: '报价单没有付款流水、发票和分项明细。', proofPurpose: '质疑损失金额和证明力。', authenticity: '待核验', relevance: '高', credibility: 6 },
    { id: 'ev-transfer', title: '押金转账：3000元', type: 'payment', sourceDocumentId: 'doc-chat', sourceRange: '转账记录（完整）', description: '租客支付3000元押金的流水。', proofPurpose: '证明押金实际交付。', authenticity: '银行流水截图', relevance: '中', credibility: 8 },
    { id: 'ev-inventory', title: '入住清单：家具旧磨损', type: 'document', sourceDocumentId: 'doc-contract', sourceRange: '附件一 · 入住清单', description: '清单记载家具已有轻微磨损，退租验收未单独标注新增损坏。', proofPurpose: '证明房屋原状及损耗背景。', authenticity: '附件原件', relevance: '中', credibility: 7 },
    { id: 'ev-checkout', title: '退租交接：未共同签字', type: 'document', sourceDocumentId: 'doc-contract', sourceRange: '第六条及交接记录', description: '房东单方面查看并扣押押金，交接单没有双方签字。', proofPurpose: '质疑验收程序和单方扣款。', authenticity: '待核验', relevance: '高', credibility: 7 },
  ],
  keyEvidenceIds: ['ev-movein-photo', 'ev-chat', 'ev-contract', 'ev-repair'],
};

const communityPosts = [
  { id: 'post-1', author: '证据收藏家', time: '今天 09:20', title: '租赁押金关卡复盘', body: '先找入住照片，再用聊天确认时间线，最后用合同条款和维修凭证完成闭环。', tags: ['#证据链', '#租赁'], likes: 18, comments: 4 },
  { id: 'post-2', author: '仲裁员小王', time: '昨天 21:05', title: '合同审查顺序', body: '我会先做主体与期限，再看付款、验收和违约责任，最后检查争议解决。', tags: ['#合同审查', '#方法论'], likes: 32, comments: 7 },
];

function getDemoCase() { return JSON.parse(JSON.stringify(demoCase)); }

function respondToDebate(input) {
  const argument = String(input.argument || '').trim();
  if (!argument) {
    const error = new Error('argument 不能为空');
    error.statusCode = 400;
    throw error;
  }
  const evidenceIds = Array.isArray(input.evidenceIds) ? input.evidenceIds.filter(Boolean) : [];
  const history = Array.isArray(input.history) ? input.history : [];
  const has = (id) => evidenceIds.includes(id);
  const mentionsCausation = /入住|形成时间|原有|既有|因果|造成/.test(argument);
  const mentionsAmount = /维修|报价|付款|凭证|2500|实际损失/.test(argument);
  const mentionsClause = /合同|第五条|押金|七日|退还/.test(argument);
  let response;
  let judge;
  let scoreChange = 2;
  if (has('ev-movein-photo') && has('ev-chat')) {
    response = '对方律师：我方注意到你同时提交了入住照片和聊天原文。即便墙面存在旧痕，仍请说明退租时是否出现了新的扩大损坏，以及照片是否保留完整元数据。';
    judge = '证据链已覆盖“形成时间”和“相对方陈述”，关联性较强；继续补足损失金额。';
    scoreChange += 16;
  } else if (has('ev-contract') && mentionsClause) {
    response = '对方律师：合同确实写有押金退还期限，但“无损坏”仍是条件。请不要只引用期限，还需要证明损坏并非由租客造成。';
    judge = '规则引用与争点相关，但仍需要事实证据支撑条件是否成就。';
    scoreChange += 10;
  } else if (has('ev-repair') && mentionsAmount) {
    response = '对方律师：报价单只是修复估算，并不等于没有实际损失。请说明你如何核对报价人的身份、维修范围和合理市场价格。';
    judge = '你已抓住证明力问题；若能指出没有付款凭证和分项明细，论证会更完整。';
    scoreChange += 12;
  } else if (!evidenceIds.length) {
    response = '对方律师：这是单方陈述。请先指出事实发生的具体时间，并提交能定位到原始文件的证据。';
    judge = '当前没有出示证据，事实、关联性和证明力均不足。';
    scoreChange -= 9;
  } else {
    response = '对方律师：你提交的材料与押金争点有一定关联，但还没有解释形成时间、损失金额和合同条件之间的完整联系。请继续补足证据链。';
    judge = '已有材料入库，建议围绕“时间—损坏—金额—条款”四个节点组织论证。';
    scoreChange += Math.min(12, evidenceIds.length * 3);
  }
  if (mentionsCausation) scoreChange += 4;
  if (mentionsAmount) scoreChange += 4;
  if (mentionsClause) scoreChange += 3;
  const normalizedScore = Math.max(-20, Math.min(30, scoreChange));
  if (history.length > 0) {
    const followUps = [
      '请把你的回答定位到具体页码、时间戳或形成记录。',
      '请区分“对方主张”和“已经被原件证明的事实”。',
      '请说明这份材料如何排除其他合理解释。',
    ];
    response += ` ${followUps[history.length % followUps.length]}`;
  }
  const turn = { id: randomUUID(), speaker: 'opponent', argument, evidenceIds, response, judge, scoreChange: normalizedScore, createdAt: new Date().toISOString() };
  const allKeyEvidence = demoCase.keyEvidenceIds.every((id) => evidenceIds.includes(id));
  const strongArgument = mentionsCausation && mentionsAmount && (mentionsClause || /证据|举证/.test(argument));
  const won = allKeyEvidence && strongArgument;
  return { turn, response, judge, scoreChange: normalizedScore, opponentScoreChange: won ? -18 : normalizedScore > 10 ? -6 : 2, nextPrompt: won ? '关键证据链已闭合，可以请求法官裁判。' : '继续从完整原件中选择证据，回应对方刚才的具体质疑。', status: won ? 'ready_for_verdict' : 'in_progress', historyCount: history.length + 1 };
}

function buildVerdict(input) {
  const evidenceIds = Array.isArray(input.evidenceIds) ? input.evidenceIds : [];
  const hasAll = demoCase.keyEvidenceIds.every((id) => evidenceIds.includes(id));
  return { status: hasAll ? 'partially_supported' : 'insufficient_evidence', winner: hasAll ? '原告 · 租客张某（部分支持）' : '待裁决', score: hasAll ? 88 : Math.min(62, evidenceIds.length * 14), award: hasAll ? '建议房东退还押金2500元；其余500元需有合理清洁或维修凭证。' : '请继续搜证并补足形成时间、损失金额和合同条款之间的联系。', chain: hasAll ? ['入住照片证明旧划痕', '微信聊天形成相互印证', '合同第5条明确退还期限', '报价单缺少实际支出凭证'] : ['当前证据链仍有缺口'], reasoning: hasAll ? '原告已就损坏形成时间和押金返还条件提供相互印证材料；房东对2500元维修损失的证明不足，全部扣留押金缺少充分依据。' : '尚未取得全部关键原件，法官无法对损坏形成时间和实际损失作出稳定判断。', sources: [LAW_SOURCES.civil710, LAW_SOURCES.civil713] };
}

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
      if (req.method === 'GET' && url.pathname === '/health') { json(res, 200, { status: 'ok', service: 'argus-backend', runtime: 'node', version: '0.2.0', timestamp: new Date().toISOString() }, corsOrigin); return; }
      if (req.method === 'GET' && url.pathname === '/api') { json(res, 200, { name: 'ARGUS+ API', version: '0.2.0', endpoints: ['GET /health', 'POST /api/cases/draft', 'POST /api/contracts/audit', 'GET /api/campaign/demo', 'POST /api/campaign/respond', 'POST /api/campaign/verdict', 'GET /api/community/feed', 'POST /api/community/posts'] }, corsOrigin); return; }
      if (req.method === 'POST' && url.pathname === '/api/cases/draft') { json(res, 201, { data: buildCaseDraft(await readJson(req)) }, corsOrigin); return; }
      if (req.method === 'POST' && url.pathname === '/api/contracts/audit') { json(res, 200, { data: auditContract(await readJson(req)) }, corsOrigin); return; }
      if (req.method === 'GET' && url.pathname === '/api/campaign/demo') { json(res, 200, { data: getDemoCase() }, corsOrigin); return; }
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
