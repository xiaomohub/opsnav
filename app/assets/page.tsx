"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";

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
  const [showForm, setShowForm] = useState(false);

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
    setShowForm(false);
    await load();
  }

  async function onDelete(id: number) {
    if (!confirm("确定删除该资产？")) return;
    await fetch(`/api/assets/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <>
      <PageHeader
        title="Linux 资产"
        description="SSH 服务器清单；凭据加密存储，访问前需 TOTP 解锁。"
        actions={
          !blocked ? (
            <button className="btn btn-primary" type="button" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "收起表单" : "添加资产"}
            </button>
          ) : undefined
        }
      />
      {blocked && (
        <div className="alert alert-warn">
          {blocked} <Link href="/manage/totp">前往 TOTP 验证</Link>
        </div>
      )}
      {showForm && !blocked && (
        <div className="panel">
          {error && <div className="alert alert-error">{error}</div>}
          <h2 className="panel-title">新增服务器</h2>
          <form onSubmit={onCreate}>
            <div className="form-row">
              <div>
                <label>名称</label>
                <input name="name" required placeholder="生产 Web-01" />
              </div>
              <div>
                <label>SSH 用户名</label>
                <input name="username" required />
              </div>
            </div>
            <div className="form-row">
              <div>
                <label>主机</label>
                <input name="host" required placeholder="192.168.1.10" />
              </div>
              <div>
                <label>端口</label>
                <input name="port" type="number" defaultValue={22} />
              </div>
            </div>
            <label>认证方式</label>
            <select name="authType" defaultValue="password">
              <option value="password">密码</option>
              <option value="private_key">私钥</option>
            </select>
            <label>密码（密码模式）</label>
            <input name="password" type="password" autoComplete="new-password" />
            <label>私钥 PEM（私钥模式）</label>
            <textarea name="privateKey" rows={4} placeholder="-----BEGIN OPENSSH PRIVATE KEY-----" />
            <div className="form-actions">
              <button className="btn btn-primary" type="submit">添加</button>
              <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>
                取消
              </button>
            </div>
          </form>
        </div>
      )}
      <div className="panel">
        <h2 className="panel-title">资产列表</h2>
        {items.length === 0 ? (
          <p className="text-muted">暂无资产。解锁 TOTP 后可添加服务器。</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>名称</th>
                  <th>连接信息</th>
                  <th>认证</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id}>
                    <td className="cell-strong">{a.name}</td>
                    <td className="text-muted">{a.username}@{a.host}:{a.port}</td>
                    <td>
                      <span className="badge badge-muted">
                        {a.authType === "private_key" ? "私钥" : "密码"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link className="btn btn-primary btn-sm" href={`/assets/${a.id}/terminal`}>
                          Web SSH
                        </Link>
                        <button className="btn btn-danger btn-sm" type="button" onClick={() => onDelete(a.id)}>
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
