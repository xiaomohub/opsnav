import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>登录 OpsNav</h1>
        <p className="auth-sub">使用管理员账号进入后台管理。</p>
        <Suspense fallback={<p className="text-muted">加载中…</p>}>
          <LoginForm />
        </Suspense>
        <p className="text-muted" style={{ marginTop: "1.25rem", marginBottom: 0, fontSize: "0.82rem" }}>
          默认账号见 <code>.env.example</code>，首次连接数据库后自动创建。
        </p>
      </div>
    </div>
  );
}
