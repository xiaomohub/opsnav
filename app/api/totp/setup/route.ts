import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { findUserById } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";
import { generateTotpSecret, getTotpUri } from "@/lib/totp";

export async function POST() {
  getDb();
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const user = findUserById(session.userId);
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 401 });
  }
  if (user.totp_enabled) {
    return NextResponse.json({ error: "已绑定 TOTP" }, { status: 400 });
  }

  const secret = generateTotpSecret();
  getDb()
    .prepare("UPDATE users SET totp_secret = ? WHERE id = ?")
    .run(secret, user.id);

  const uri = getTotpUri(user.username, secret);
  const qrDataUrl = await QRCode.toDataURL(uri);

  return NextResponse.json({ qrDataUrl, otpauth: uri });
}
