import Link from "next/link";

export default function HomePage() {
  return (
    <div className="hero">
      <div className="hero-card">
        <h1>OpsNav</h1>
        <p>
          简洁的运维导航与 Linux 资产管理：公开站点书签、加密存储的 SSH 凭据、浏览器内 Web
          终端，登录后通过 TOTP 二次验证保护资产访问。
        </p>
        <div className="hero-actions">
          <Link className="btn btn-primary" href="/nav">浏览站点导航</Link>
          <Link className="btn btn-secondary" href="/login">管理员登录</Link>
        </div>
      </div>
      <div className="feature-grid">
        <div className="feature-tile">
          <h3>站点导航</h3>
          <p>团队常用链接集中展示，支持后台 CRUD 管理。</p>
        </div>
        <div className="feature-tile">
          <h3>Linux 资产</h3>
          <p>主机、端口、认证方式统一管理，凭据 AES-GCM 加密入库。</p>
        </div>
        <div className="feature-tile">
          <h3>Web SSH</h3>
          <p>自定义 WebSocket 服务 + xterm.js；演示模式或真实 ssh2 连接。</p>
        </div>
      </div>
    </div>
  );
}
