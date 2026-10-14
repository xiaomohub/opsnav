import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  getDb();
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const url = String(body.url ?? "").trim();
  const description = String(body.description ?? "").trim();
  if (!name || !url) {
    return NextResponse.json({ error: "名称和 URL 必填" }, { status: 400 });
  }
  getDb()
    .prepare(
      `UPDATE nav_entries SET name = ?, url = ?, description = ?, updated_at = datetime('now') WHERE id = ?`
    )
    .run(name, url, description, Number(id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  getDb();
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await params;
  getDb().prepare("DELETE FROM nav_entries WHERE id = ?").run(Number(id));
  return NextResponse.json({ ok: true });
}
