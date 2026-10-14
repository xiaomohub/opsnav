import { NextResponse } from "next/server";
import { assertTotpAssetAccess } from "@/lib/auth/totp-access";
import { deleteAsset } from "@/lib/assets/repository";
import { getSession } from "@/lib/session";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  const denied = await assertTotpAssetAccess(session);
  if (denied) {
    return NextResponse.json({ error: denied.error }, { status: denied.status });
  }
  const { id } = await params;
  await deleteAsset(Number(id));
  return NextResponse.json({ ok: true });
}
