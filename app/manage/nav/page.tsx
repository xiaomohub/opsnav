"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type NavItem = {
  id: number;
  name: string;
  url: string;
  description: string;
};

export default function ManageNavPage() {
  const [items, setItems] = useState<NavItem[]>([]);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<NavItem | null>(null);

  async function load() {
    const res = await fetch("/api/admin/nav");
    if (res.status === 401) {
      window.location.href = "/login?from=/manage/nav";
      return;
    }
    const data = await res.json();
    setItems(data.items ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const body = {
      name: String(form.get("name")),
      url: String(form.get("url")),
      description: String(form.get("description") ?? ""),
    };
    const res = await fetch(
      editing ? `/api/admin/nav/${editing.id}` : "/api/admin/nav",
      {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "保存失败");
      return;
    }
    setEditing(null);
    e.currentTarget.reset();
    await load();
  }

  async function onDelete(id: number) {
    if (!confirm("确定删除该导航？")) return;
    await fetch(`/api/admin/nav/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="container">
      <h1>导航管理</h1>
      <p className="muted">
        需要登录。公开页面：<Link href="/nav">/nav</Link>
      </p>
      <div className="card">
        {error && <div className="alert error">{error}</div>}
        <h2>{editing ? "编辑条目" : "新增条目"}</h2>
        <form onSubmit={onSubmit}>
          <label>名称</label>
          <input name="name" required value={editing?.name ?? undefined} key={editing?.id ?? "new-name"} defaultValue={editing?.name ?? ""} />
          <label>URL</label>
          <input name="url" required type="url" defaultValue={editing?.url ?? ""} key={(editing?.id ?? "new") + "-url"} />
          <label>简介</label>
          <textarea name="description" rows={2} defaultValue={editing?.description ?? ""} key={(editing?.id ?? "new") + "-desc"} />
          <div className="form-actions">
            <button className="btn" type="submit">保存</button>
            {editing && (
              <button className="btn secondary" type="button" onClick={() => setEditing(null)}>
                取消编辑
              </button>
            )}
          </div>
        </form>
      </div>
      <div className="card">
        <h2>现有条目</h2>
        <table>
          <thead>
            <tr>
              <th>名称</th>
              <th>URL</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.url}</td>
                <td>
                  <button className="btn secondary" type="button" onClick={() => setEditing(item)}>
                    编辑
                  </button>
                  <button className="btn danger" type="button" onClick={() => onDelete(item.id)} style={{ marginLeft: 8 }}>
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
