"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";

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
    <>
      <PageHeader
        title="导航管理"
        description={
          <>
            维护团队站点书签。公开页：
            <Link href="/nav"> /nav</Link>
          </>
        }
      />
      <div className="panel-grid">
        <div className="panel">
          {error && <div className="alert alert-error">{error}</div>}
          <h2 className="panel-title">{editing ? "编辑条目" : "新增条目"}</h2>
          <form onSubmit={onSubmit}>
            <label>名称</label>
            <input name="name" required defaultValue={editing?.name ?? ""} key={editing?.id ?? "new-name"} />
            <label>URL</label>
            <input name="url" required type="url" defaultValue={editing?.url ?? ""} key={(editing?.id ?? "new") + "-url"} />
            <label>简介</label>
            <textarea name="description" rows={2} defaultValue={editing?.description ?? ""} key={(editing?.id ?? "new") + "-desc"} />
            <div className="form-actions">
              <button className="btn btn-primary" type="submit">保存</button>
              {editing && (
                <button className="btn btn-secondary" type="button" onClick={() => setEditing(null)}>
                  取消编辑
                </button>
              )}
            </div>
          </form>
        </div>
        <div className="panel">
          <h2 className="panel-title">现有条目 ({items.length})</h2>
          <div className="table-wrap">
            <table className="data-table">
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
                    <td className="cell-strong">{item.name}</td>
                    <td className="text-muted" style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.url}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-secondary btn-sm" type="button" onClick={() => setEditing(item)}>
                          编辑
                        </button>
                        <button className="btn btn-danger btn-sm" type="button" onClick={() => onDelete(item.id)}>
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
