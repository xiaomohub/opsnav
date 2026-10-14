import { NextRequest, NextResponse } from "next/server";
import { findUserById } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";
import { verifyTotpToken } from "@/lib/totp";

export async function POST(req: NextRequest) {
  getDb();
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const user = findUserById(session.userId);
  if (!user?.totp_secret) {
    return NextResponse.json({ error: "请先生成绑定二维码" }, { status: 400 });
  }

  const body = await req.json();
  const token = String(body.token ?? "").trim();
  if (!/^\d{6}$/.test(token)) {
    return NextResponse.json({ error: "验证码格式错误" }, { status: 400 });
  }

  if (!verifyTotpToken(user.totp_secret, token)) {
    return NextResponse.json({ error: "验证码无效" }, { status: 400 });
  }

  let bound = false;
  if (!user.totp_enabled) {
    getDb().prepare("UPDATE users SET totp_enabled = 1 WHERE id = ?").run(user.id);
    bound = true;
  }

  session.totpVerifiedAt = Date.now();
  await session.save();

  return NextResponse.json({ ok: true, bound });
}
