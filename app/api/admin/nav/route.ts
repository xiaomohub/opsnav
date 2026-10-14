import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

function requireLogin() {
  return getSession();
}

export async function GET() {
  getDb();
  const session = await requireLogin();
  if (!session.userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const items = getDb()
    .prepare(`SELECT id, name, url, description FROM nav_entries ORDER BY updated_at DESC`)
    .all();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  getDb();
  const session = await requireLogin();
  if (!session.userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const url = String(body.url ?? "").trim();
  const description = String(body.description ?? "").trim();
  if (!name || !url) {
    return NextResponse.json({ error: "名称和 URL 必填" }, { status: 400 });
  }
  const result = getDb()
    .prepare(
      `INSERT INTO nav_entries (name, url, description) VALUES (?, ?, ?)`
    )
    .run(name, url, description);
  return NextResponse.json({ id: result.lastInsertRowid });
}
