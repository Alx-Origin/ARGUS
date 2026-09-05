const http = require('node:http');
const { randomUUID } = require('node:crypto');
const { URL } = require('node:url');

const DEFAULT_PORT = 4000;
const MAX_BODY_BYTES = 1024 * 1024;

const auditRules = [
  {
    id: 'scope',
    name: '标的与范围',
    severity: 'medium',
    pattern: /标的|服务内容|货物|产品|商铺|房屋|面积|位置|用途/,
    suggestion: '用附件或清单明确标的、规格、数量、位置、状态和允许用途。',
  },
  {
    id: 'deadline',
    name: '期限与节点',
    severity: 'high',
    pattern: /及时|尽快|另行协商|届时|期限|工作日|完成/,
    suggestion: '补充明确日期、工作日数量、期限起算点和逾期处理方式。',
  },
  {
    id: 'payment',
    name: '价款、支付与发票',
    severity: 'high',
    pattern: /价款|租金|费用|支付|付款|收款|发票|账户/,
    suggestion: '明确含税总价、付款条件、结算周期、发票要求和账户变更验证。',
  },
  {
    id: 'acceptance',
    name: '交付与验收',
    severity: 'high',
    pattern: /交付|验收|合格|签收|异议|整改/,
    suggestion: '列明客观验收标准、验收期限、整改复验和书面反馈流程。',
  },
  {
    id: 'deposit',
    name: '保证金与押金',
    severity: 'medium',
    pattern: /保证金|押金|保函|扣除|退还/,
    suggestion: '明确扣划依据、通知程序、补足期限、退还条件和逾期责任。',
  },
  {
    id: 'liability',
    name: '违约责任',
    severity: 'high',
    pattern: /违约|赔偿|损失|违约金|罚款|责任/,
    suggestion: '让责任与具体义务对应，并补充催告、整改期、损失范围和责任边界。',
  },
  {
    id: 'dispute',
    name: '争议解决与送达',
    severity: 'medium',
    pattern: /争议|仲裁|法院|管辖|通知|送达|地址/,
    suggestion: '在仲裁和诉讼中明确选择一种路径，并约定有效送达地址。',
  },
];

function splitClauses(text) {
  return text
    .split(/\n+|(?<=[。；！？])/)
    .map((clause) => clause.trim())
    .filter(Boolean)
    .slice(0, 180);
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

  return {
    id: randomUUID(),
    title: `${caseType} · 案件草案`,
    caseType,
    side: input.side === 'defendant' ? 'defendant' : 'plaintiff',
    jurisdiction: String(input.jurisdiction || '中国大陆'),
    parties: {
      plaintiff: String(input.plaintiff || '主张方身份待补充'),
      defendant: String(input.defendant || '相对方身份待补充'),
    },
    focus: [
      '核心事实与时间线能否由原始材料相互印证',
      `争议金额 ${amount} 的计算和支付依据`,
      '关键条款是否被充分提示说明且具备效力',
    ],
    evidencePlan: [
      '合同、订单或协议原件',
      '付款、退款或结算凭证',
      '聊天记录、通知及完整时间戳',
    ],
    source: 'node-local-rules',
  };
}

function auditContract(input) {
  const text = String(input.text || '').trim();
  if (!text) {
    const error = new Error('text 不能为空');
    error.statusCode = 400;
    throw error;
  }

  const clauses = splitClauses(text);
  const findings = [];

  clauses.forEach((clause, clauseIndex) => {
    auditRules.forEach((rule) => {
      if (rule.pattern.test(clause)) {
        findings.push({
          id: `${rule.id}-${clauseIndex + 1}`,
          clauseIndex,
          clause,
          category: rule.name,
          severity: rule.severity,
          suggestion: rule.suggestion,
        });
      }
    });
  });

  const highRiskCount = findings.filter((finding) => finding.severity === 'high').length;
  return {
    summary: {
      position: String(input.position || '其他'),
      clauseCount: clauses.length,
      findingCount: findings.length,
      highRiskCount,
    },
    findings,
    engine: 'node-local-rules-v1',
  };
}

function resolveCorsOrigin(requestOrigin, configuredOrigin) {
  const allowedOrigins = String(configuredOrigin || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (!allowedOrigins.length || allowedOrigins.includes('*')) return '*';
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) return requestOrigin;
  return allowedOrigins[0];
}

function json(res, statusCode, payload, corsOrigin) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    Vary: 'Origin',
  });
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      const error = new Error('请求体超过 1MB');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (!chunks.length) return {};

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const error = new Error('请求体必须是有效 JSON');
    error.statusCode = 400;
    throw error;
  }
}

function createRequestHandler(options = {}) {
  const configuredCorsOrigin = options.corsOrigin || process.env.CORS_ORIGIN || 'http://localhost:3000';

  return async function requestHandler(req, res) {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const corsOrigin = resolveCorsOrigin(req.headers.origin, configuredCorsOrigin);

    if (req.method === 'OPTIONS') {
      json(res, 204, {}, corsOrigin);
      return;
    }

    try {
      if (req.method === 'GET' && url.pathname === '/health') {
        json(
          res,
          200,
          {
            status: 'ok',
            service: 'argus-backend',
            runtime: 'node',
            timestamp: new Date().toISOString(),
          },
          corsOrigin,
        );
        return;
      }

      if (req.method === 'GET' && url.pathname === '/api') {
        json(
          res,
          200,
          {
            name: 'ARGUS+ API',
            version: '0.1.0',
            endpoints: ['GET /health', 'POST /api/cases/draft', 'POST /api/contracts/audit'],
          },
          corsOrigin,
        );
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/cases/draft') {
        const body = await readJson(req);
        json(res, 201, { data: buildCaseDraft(body) }, corsOrigin);
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/contracts/audit') {
        const body = await readJson(req);
        json(res, 200, { data: auditContract(body) }, corsOrigin);
        return;
      }

      json(res, 404, { error: { message: '路由不存在' } }, corsOrigin);
    } catch (error) {
      const statusCode = Number(error.statusCode) || 500;
      json(
        res,
        statusCode,
        { error: { message: statusCode === 500 ? '服务器内部错误' : error.message } },
        corsOrigin,
      );
    }
  };
}

function createServer(options = {}) {
  return http.createServer(createRequestHandler(options));
}

if (require.main === module) {
  const port = Number(process.env.PORT) || DEFAULT_PORT;
  const server = createServer();
  server.listen(port, () => {
    console.log(`ARGUS+ backend listening on http://localhost:${port}`);
  });
}

module.exports = {
  auditContract,
  buildCaseDraft,
  createRequestHandler,
  createServer,
  inferCaseType,
  splitClauses,
};
