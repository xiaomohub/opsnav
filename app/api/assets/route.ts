import { NextRequest, NextResponse } from "next/server";
import { findUserById } from "@/lib/auth";
import { encryptSecret } from "@/lib/crypto";
import { getDb } from "@/lib/db";
import { getSession, isTotpUnlocked } from "@/lib/session";

function assertTotpAccess(session: Awaited<ReturnType<typeof getSession>>) {
  if (!session.userId) return { status: 401, error: "未登录" };
  const user = findUserById(session.userId);
  if (!user?.totp_enabled) return { status: 403, error: "请先绑定 TOTP" };
  if (!isTotpUnlocked(session.totpVerifiedAt)) {
    return { status: 403, error: "TOTP 验证已过期，请重新验证" };
  }
  return null;
}

export async function GET() {
  getDb();
  const session = await getSession();
  const denied = assertTotpAccess(session);
  if (denied) {
    return NextResponse.json({ error: denied.error }, { status: denied.status });
  }
  const items = getDb()
    .prepare(
      `SELECT id, name, host, port, username, auth_type as authType FROM assets ORDER BY updated_at DESC`
    )
    .all();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  getDb();
  const session = await getSession();
  const denied = assertTotpAccess(session);
  if (denied) {
    return NextResponse.json({ error: denied.error }, { status: denied.status });
  }

  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const host = String(body.host ?? "").trim();
  const port = Number(body.port ?? 22);
  const username = String(body.username ?? "").trim();
  const authType = body.authType === "private_key" ? "private_key" : "password";
  const password = String(body.password ?? "");
  const privateKey = String(body.privateKey ?? "");

  if (!name || !host || !username) {
    return NextResponse.json({ error: "名称、主机、用户名必填" }, { status: 400 });
  }
  const secret = authType === "private_key" ? privateKey : password;
  if (!secret) {
    return NextResponse.json({ error: "请提供密码或私钥" }, { status: 400 });
  }

  const result = getDb()
    .prepare(
      `INSERT INTO assets (name, host, port, username, auth_type, secret_encrypted)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(name, host, port, username, authType, encryptSecret(secret));

  return NextResponse.json({ id: result.lastInsertRowid });
}
