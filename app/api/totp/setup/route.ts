import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { findUserById, setUserTotpSecret } from "@/lib/auth";
import { requireLoggedInSession } from "@/lib/auth/totp-access";
import { generateTotpSecret, getTotpUri } from "@/lib/totp";

export async function POST() {
  const auth = await requireLoggedInSession();
  if (auth.denied) {
    return NextResponse.json({ error: auth.denied.error }, { status: auth.denied.status });
  }
  const user = await findUserById(auth.session!.userId!);
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 401 });
  }
  if (user.totpEnabled) {
    return NextResponse.json({ error: "已绑定 TOTP" }, { status: 400 });
  }

  const secret = generateTotpSecret();
  await setUserTotpSecret(user.id, secret);

  const uri = getTotpUri(user.username, secret);
  const qrDataUrl = await QRCode.toDataURL(uri);

  return NextResponse.json({ qrDataUrl, otpauth: uri });
}
