import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h1>登录</h1>
      <div className="card">
        <Suspense fallback={<p className="muted">加载中…</p>}>
          <LoginForm />
        </Suspense>
        <p className="muted" style={{ marginTop: "1rem" }}>
          默认账号见 <code>.env.example</code>（首次启动自动创建）。
        </p>
      </div>
    </div>
  );
}
