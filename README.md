# OpsNav

轻量运维导航：**公开站点导航**、**Linux 服务器资产管理**、浏览器内 **Web SSH**（xterm.js + ssh2），登录后需 **TOTP（RFC 6238）** 验证才能访问资产（默认 30 分钟解锁窗口）。

## 功能

| 模块 | 说明 |
|------|------|
| 站点导航 | 名称 / URL / 简介；公开列表 [`/nav`](http://localhost:3000/nav)；登录后 [`/manage/nav`](http://localhost:3000/manage/nav) 增删改 |
| 资产管理 | 仅 Linux：主机、端口、用户名、密码或私钥；凭据 AES-GCM 加密后存入 PostgreSQL |
| Web SSH | 自定义 `server.ts` 提供 HTTP + WebSocket；终端页 `/assets/:id/terminal` |
| 认证 | 用户名密码（iron-session + bcrypt）；TOTP 绑定与验证（otplib + qrcode） |

## 技术栈

- Next.js 15（App Router）+ 自定义 Node 服务 `server.ts`
- **PostgreSQL** + **Prisma**（迁移与类型安全数据层）
- 模块划分：`lib/auth`、`lib/session`、`lib/totp`、`lib/nav`、`lib/assets`、`lib/ssh`
- `iron-session`、`bcryptjs`、`otplib`、`qrcode`、`ssh2`、`xterm`

## 快速开始

### 1. 数据库（Docker 推荐）

```bash
cp .env.example .env
docker compose up -d
```

默认连接串见 `.env.example`：`postgresql://opsnav:opsnav@localhost:5432/opsnav`

### 2. 应用

```bash
npm install
npx prisma migrate deploy   # 应用迁移
npm run build
npm run start               # 或 npm run dev（会先 build 再启动）
```

自定义 HTTP/WebSocket 服务通过 `server.ts` 启动；部分 Node 环境缺少 `globalThis.AsyncLocalStorage`，`start`/`dev` 已通过 `scripts/als-polyfill.cjs` 自动注入。

浏览器打开 [http://localhost:3000](http://localhost:3000)。默认管理员见 `.env.example`（`admin` / `changeme`），**首次连接数据库后**自动创建种子用户与示例导航。

### 环境变量

见 [`.env.example`](./.env.example)。**不要提交** `.env` 或本地数据库卷数据。

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | PostgreSQL 连接串（必填） |
| `SSH_DEMO_MODE` | 默认 `true`：Web SSH 使用内置演示 shell；设为 `false` 时走真实 SSH |
| `SESSION_SECRET` / `DATA_ENCRYPTION_KEY` | 会话与资产密钥加密（生产环境务必更换） |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | 种子管理员（仅当库中无对应用户时创建） |

## 使用流程

1. 登录 → 2. [`/manage/totp`](http://localhost:3000/manage/totp) 绑定验证器 → 3. 输入验证码解锁 → 4. [`/assets`](http://localhost:3000/assets) 管理服务器并打开 Web SSH

## 脚本

```bash
npm run db:migrate      # 生产环境：prisma migrate deploy
npm run db:migrate:dev  # 开发：创建/应用迁移
npm run dev             # 构建并启动自定义 server
npm run build           # Next + server 包
npm run start           # 生产启动
npm run smoke           # 端到端：起 Postgres → 迁移 → 登录 → 导航 → TOTP → 资产 → WS 演示终端
```

## 安全说明

- 仓库内**不含**真实密码、私钥或业务数据；SSH 凭据在库内加密存储。
- 生产部署请更换所有默认密钥，将 `SSH_DEMO_MODE=false`，并限制网络访问与数据库权限。
- TOTP 解锁为会话级时间窗口，过期后需重新验证。

## 许可证

MIT
