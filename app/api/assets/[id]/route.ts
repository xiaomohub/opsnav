import { NextResponse } from "next/server";
import { findUserById } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getSession, isTotpUnlocked } from "@/lib/session";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  getDb();
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const user = findUserById(session.userId);
  if (!user?.totp_enabled || !isTotpUnlocked(session.totpVerifiedAt)) {
    return NextResponse.json({ error: "需要有效的 TOTP 验证" }, { status: 403 });
  }
  const { id } = await params;
  getDb().prepare("DELETE FROM assets WHERE id = ?").run(Number(id));
  return NextResponse.json({ ok: true });
}
