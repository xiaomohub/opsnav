"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Asset = {
  id: number;
  name: string;
  host: string;
  port: number;
  username: string;
  authType: string;
};

export default function AssetsPage() {
  const [items, setItems] = useState<Asset[]>([]);
  const [blocked, setBlocked] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const me = await fetch("/api/auth/me");
    const meData = await me.json();
    if (!meData.user) {
      window.location.href = "/login?from=/assets";
      return;
    }
    if (!meData.user.totpEnabled) {
      setBlocked("请先绑定 TOTP。");
    } else if (!meData.totpUnlocked) {
      setBlocked("TOTP 验证已过期，请前往 TOTP 页面重新验证。");
    }

    const res = await fetch("/api/assets");
    if (res.status === 403) {
      const data = await res.json();
      setBlocked(data.error ?? "需要 TOTP 验证");
      return;
    }
    const data = await res.json();
    setItems(data.items ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const authType = String(form.get("authType"));
    const res = await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        host: form.get("host"),
        port: Number(form.get("port") || 22),
        username: form.get("username"),
        authType,
        password: authType === "password" ? form.get("password") : undefined,
        privateKey: authType === "private_key" ? form.get("privateKey") : undefined,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "创建失败");
      return;
    }
    e.currentTarget.reset();
    await load();
  }

  async function onDelete(id: number) {
    if (!confirm("确定删除该资产？")) return;
    await fetch(`/api/assets/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="container">
      <h1>Linux 资产</h1>
      {blocked && (
        <div className="alert warn">
          {blocked} <Link href="/manage/totp">前往 TOTP</Link>
        </div>
      )}
      <div className="card">
        {error && <div className="alert error">{error}</div>}
        <h2>新增服务器</h2>
        <form onSubmit={onCreate}>
          <label>名称</label>
          <input name="name" required />
          <label>主机</label>
          <input name="host" required placeholder="192.168.1.10" />
          <label>端口</label>
          <input name="port" type="number" defaultValue={22} />
          <label>SSH 用户名</label>
          <input name="username" required />
          <label>认证方式</label>
          <select name="authType" defaultValue="password">
            <option value="password">密码</option>
            <option value="private_key">私钥</option>
          </select>
          <label>密码（密码模式）</label>
          <input name="password" type="password" autoComplete="new-password" />
          <label>私钥 PEM（私钥模式）</label>
          <textarea name="privateKey" rows={4} placeholder="-----BEGIN OPENSSH PRIVATE KEY-----" />
          <button className="btn" type="submit">添加</button>
        </form>
      </div>
      <div className="card">
        <h2>资产列表</h2>
        <table>
          <thead>
            <tr>
              <th>名称</th>
              <th>连接</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td className="muted">{a.username}@{a.host}:{a.port}</td>
                <td>
                  <Link className="btn secondary" href={`/assets/${a.id}/terminal`}>Web SSH</Link>
                  <button className="btn danger" type="button" onClick={() => onDelete(a.id)} style={{ marginLeft: 8 }}>
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
