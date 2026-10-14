"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const from = search.get("from") ?? "/manage/nav";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        password: form.get("password"),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "登录失败");
      return;
    }
    router.push(from);
    router.refresh();
  }

  return (
    <>
      {error && <div className="alert error">{error}</div>}
      <form onSubmit={onSubmit}>
        <label htmlFor="username">用户名</label>
        <input id="username" name="username" required autoComplete="username" />
        <label htmlFor="password">密码</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "登录中…" : "登录"}
        </button>
      </form>
    </>
  );
}
