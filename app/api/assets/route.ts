import { NextRequest, NextResponse } from "next/server";
import { assertTotpAssetAccess } from "@/lib/auth/totp-access";
import { createAsset, listAssetSummaries } from "@/lib/assets/repository";
import { encryptSecret } from "@/lib/crypto";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  const denied = await assertTotpAssetAccess(session);
  if (denied) {
    return NextResponse.json({ error: denied.error }, { status: denied.status });
  }
  const items = await listAssetSummaries();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const denied = await assertTotpAssetAccess(session);
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

  const id = await createAsset({
    name,
    host,
    port,
    username,
    authType,
    secretEncrypted: encryptSecret(secret),
  });

  return NextResponse.json({ id });
}
