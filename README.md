# OpsNav

轻量运维导航：**公开站点导航**、**Linux 服务器资产管理**、浏览器内 **Web SSH**（xterm.js + ssh2），登录后需 **TOTP（RFC 6238）** 验证才能访问资产（默认 30 分钟解锁窗口）。

## 功能

| 模块 | 说明 |
|------|------|
| 站点导航 | 名称 / URL / 简介；公开列表 [`/nav`](http://localhost:3000/nav)；登录后 [`/manage/nav`](http://localhost:3000/manage/nav) 增删改 |
| 资产管理 | 仅 Linux：主机、端口、用户名、密码或私钥；密钥加密存入 SQLite（`data/`） |
| Web SSH | 自定义 `server.ts` 提供 HTTP + WebSocket；终端页 `/assets/:id/terminal` |
| 认证 | 用户名密码（iron-session + bcrypt）；TOTP 绑定与验证（otplib + qrcode） |

## 技术栈

- Next.js 15（App Router）+ 自定义 Node 服务 `server.ts`
- SQLite（`better-sqlite3`）
- `iron-session`、`bcryptjs`、`otplib`、`qrcode`、`ssh2`、`xterm`

## 快速开始

```bash
cp .env.example .env
npm install
npm run build   # 首次需构建 Next + 自定义 server 包
npm run start   # 或 npm run dev（会先 build 再启动）
```

自定义 HTTP/WebSocket 服务通过 `server.ts` 启动；部分 Node 环境缺少 `globalThis.AsyncLocalStorage`，`start`/`dev` 已通过 `scripts/als-polyfill.cjs` 自动注入。

浏览器打开 [http://localhost:3000](http://localhost:3000)。默认管理员见 `.env.example`（`admin` / `changeme`），首次启动自动写入数据库。

### 环境变量

见 [`.env.example`](./.env.example)。**不要提交** `.env` 或 `data/`。

| 变量 | 说明 |
|------|------|
| `SSH_DEMO_MODE` | 默认 `true`：Web SSH 使用内置演示 shell；设为 `false` 时走真实 SSH |
| `SESSION_SECRET` / `DATA_ENCRYPTION_KEY` | 会话与资产密钥加密（生产环境务必更换） |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | 种子管理员（仅当库中无用户时创建） |

## 使用流程

1. 登录 → 2. [`/manage/totp`](http://localhost:3000/manage/totp) 绑定验证器 → 3. 输入验证码解锁 → 4. [`/assets`](http://localhost:3000/assets) 管理服务器并打开 Web SSH

## 脚本

```bash
npm run dev      # 开发（tsx watch server.ts）
npm run build    # Next 生产构建
npm run start    # 生产启动
npm run smoke    # 端到端：登录 → 导航 → TOTP → 资产 → WebSocket 演示终端
```

## 安全说明

- 仓库内**不含**真实密码、私钥或业务数据；运行时数据在 `data/`（已 gitignore）。
- 生产部署请更换所有默认密钥，并将 `SSH_DEMO_MODE=false` 且限制网络访问。
- TOTP 解锁为会话级时间窗口，过期后需重新验证。

## 许可证

MIT
