import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container">
      <div className="card">
        <h1>OpsNav</h1>
        <p className="muted">
          轻量运维导航：公开站点导航、Linux 服务器资产管理、浏览器内 Web SSH（支持 TOTP
          二次验证）。
        </p>
        <div className="form-actions">
          <Link className="btn" href="/nav">浏览导航</Link>
          <Link className="btn secondary" href="/login">管理员登录</Link>
        </div>
      </div>
    </div>
  );
}
