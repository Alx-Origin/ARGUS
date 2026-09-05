# ARGUS+ 后端部署与服务隔离

ARGUS+ 可以与同一台服务器上的其他 tomeet.chat 服务并行运行。建议使用“独立域名 + 独立主机端口 + 独立 systemd/Docker 服务名”三层隔离。

推荐域名：`argus-api.tomeet.chat`。如果必须共用 `api.tomeet.chat`，则只占用 `/argus/` 路径。

## 服务器准备

- Node.js 22+ 或 Docker
- DNS：将 `argus-api.tomeet.chat`（推荐）或 `api.tomeet.chat` 的 A/AAAA 记录指向服务器公网地址
- 防火墙只开放 80/443；ARGUS+ 只监听本机 `4100`（Docker 容器内部仍使用 `4000`）

## 方式 A：Docker Compose（推荐）

```bash
cd /opt/argus
cp backend/.env.example backend/.env
# 编辑 backend/.env，将 CORS_ORIGIN 改成实际前端域名
# 例如：CORS_ORIGIN=https://argus.example.com

docker compose -f deploy/docker-compose.backend.yml up -d --build
curl http://127.0.0.1:4100/health
```

## 方式 B：Node + systemd

```bash
cd /opt/argus
npm ci --omit=dev
PORT=4100 HOST=127.0.0.1 CORS_ORIGIN=https://argus.example.com npm run start:backend
```

生产环境可用 systemd/PM2 守护 `npm run start:backend`，并将 `HOST=127.0.0.1`，避免直接暴露 Node 端口。

## 方案 A：独立子域名（推荐）

```bash
sudo cp deploy/nginx/argus-api.tomeet.chat.conf /etc/nginx/sites-available/argus-api.tomeet.chat
sudo ln -s /etc/nginx/sites-available/argus-api.tomeet.chat /etc/nginx/sites-enabled/argus-api.tomeet.chat
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d argus-api.tomeet.chat
```

前端配置：

```env
NEXT_PUBLIC_API_BASE_URL=https://argus-api.tomeet.chat
```

## 方案 B：共用 `api.tomeet.chat`，使用路径隔离

如果 `api.tomeet.chat` 已有 Nginx `server` 块，不要再创建第二个同名 `server`；将
`deploy/nginx/api.tomeet.chat.conf` 中的 `location ^~ /argus/` 合并到现有 `server` 块内：

```bash
sudo cp deploy/nginx/api.tomeet.chat.conf /etc/nginx/sites-available/api.tomeet.chat
sudo ln -s /etc/nginx/sites-available/api.tomeet.chat /etc/nginx/sites-enabled/api.tomeet.chat
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.tomeet.chat
```

前端配置为带路径的 API 地址：

```env
NEXT_PUBLIC_API_BASE_URL=https://api.tomeet.chat/argus
```

此时其他服务继续使用 `api.tomeet.chat` 的原有路径，ARGUS+ 只处理 `/argus/*`。

## 隔离关系

| 层级 | ARGUS+ 标识 | 其他服务 |
| --- | --- | --- |
| 公网域名 | `argus-api.tomeet.chat`，或 `/argus/` | 各自的域名/路径 |
| Nginx 上游 | `127.0.0.1:4100` | 不同端口 |
| Docker | `argus-api` | 不同 compose service/container |
| systemd | `argus-api.service` | 不同 unit |
| CORS | `CORS_ORIGIN` 指向 ARGUS+ 前端 | 各自的前端 origin |

## 已提供的 MVP API

- `GET /health`
- `POST /api/cases/draft`
- `POST /api/contracts/audit`
- `GET /api/campaign/demo`
- `POST /api/campaign/respond`
- `POST /api/campaign/verdict`
- `GET /api/community/feed`
- `POST /api/community/posts`

当前数据保存在进程内存中，服务重启后社区新帖和会话状态会重置。下一阶段接入 PostgreSQL/对象存储时，可沿用现有 JSON API 契约。

如不使用 Docker，仓库也提供 [`deploy/systemd/argus-api.service`](systemd/argus-api.service)：

```bash
sudo useradd --system --home /opt/argus --shell /usr/sbin/nologin argus
sudo cp deploy/systemd/argus-api.service /etc/systemd/system/argus-api.service
sudo systemctl daemon-reload
sudo systemctl enable --now argus-api
sudo systemctl status argus-api
```
