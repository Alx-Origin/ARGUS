# ARGUS+

ARGUS+ 是一个法律训练产品原型，当前采用前后端分离的工作区结构：

- `frontend/`：Next.js App Router + React + TypeScript，默认运行在 `3000` 端口。
- `backend/`：独立 Node.js HTTP API，默认运行在 `4000` 端口。
- `legacy/index.html`：原始单文件静态页面快照，保留现有交互作为迁移参考。

## 快速开始

```bash
npm install
npm run dev
```

打开 <http://localhost:3000>。前端会通过 `NEXT_PUBLIC_API_BASE_URL` 访问 Node.js 服务；默认值为 `http://localhost:4000`。

也可以分别启动：

```bash
npm run dev:backend
npm run dev:frontend
```

## Vercel + 独立 Node.js 部署

前端目标平台为 Vercel，后端保持为独立 Node.js 服务。当前仓库是 monorepo，创建 Vercel
项目时将 **Root Directory** 设置为 `frontend/`，框架选择 Next.js，构建命令使用默认的
`next build`。配置文件位于 `frontend/vercel.json`。

部署步骤：

1. 将仓库导入 Vercel，Root Directory 选择 `frontend/`。
2. 在 Vercel 的 Production、Preview 环境分别配置 `NEXT_PUBLIC_API_BASE_URL`，值为后端公开 HTTPS 地址。
3. 将 `backend/` 部署到支持常驻 Node.js 进程的平台（例如 Render、Railway、Fly.io 或自有服务器）。
4. 在后端配置 `CORS_ORIGIN`。多个 Vercel 生产/预览域名用英文逗号分隔，例如：

   ```env
   CORS_ORIGIN=https://argus.vercel.app,https://argus-git-main-988ms.vercel.app
   ```

Vercel 前端使用根路径 `/`，不再需要 GitHub Pages 的 `/ARGUS` `basePath` 和静态导出。
每个 Pull Request 可以自动生成 Preview，前端 API 地址通过 Vercel 环境变量在构建时注入。

## API

- `GET /health`：服务健康检查
- `GET /api`：服务版本和路由清单
- `POST /api/cases/draft`：根据案件概念生成案件草案
- `POST /api/contracts/audit`：执行首版规则合同审查

示例：

```bash
curl http://localhost:4000/health
curl -X POST http://localhost:4000/api/cases/draft \
  -H 'Content-Type: application/json' \
  -d '{"concept":"租客退租后房东扣留押金3000元"}'
```

## 当前边界

这一版先建立领域边界和 HTTP 契约。案件工坊与合同审查已经连通独立后端；法庭闯关、社区广场和原页面的复杂交互保留在 `legacy/index.html`，后续按领域逐步迁移为 React 组件与 Node.js 服务。

## 目录约定

```text
frontend/app/       页面、布局和全局样式
frontend/public/    前端静态资源
backend/src/        Node.js API 与测试
legacy/             旧版静态页面快照
.framework/         迁移验证与回滚工件
```

## MVP 与独立服务器

当前 MVP 已实现四个可操作模块：案件工坊、合同猎魔、租赁押金法庭闯关、社区广场。后端新增案件草案、逐条审查、完整原件搜证、动态质证、解释性裁判和脱敏发帖 API。

后端可以部署在你自己的 `api.tomeet.chat` 服务器。详细的 Docker Compose、Nginx、HTTPS 和环境变量步骤见 [`deploy/README.md`](deploy/README.md)。
