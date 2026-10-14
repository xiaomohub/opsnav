import { NextRequest, NextResponse } from "next/server";
import { requireLoggedInSession } from "@/lib/auth/totp-access";
import { deleteNavEntry, updateNavEntry } from "@/lib/nav/repository";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireLoggedInSession();
  if (auth.denied) {
    return NextResponse.json({ error: auth.denied.error }, { status: auth.denied.status });
  }
  const { id } = await params;
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const url = String(body.url ?? "").trim();
  const description = String(body.description ?? "").trim();
  if (!name || !url) {
    return NextResponse.json({ error: "名称和 URL 必填" }, { status: 400 });
  }
  await updateNavEntry(Number(id), { name, url, description });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireLoggedInSession();
  if (auth.denied) {
    return NextResponse.json({ error: auth.denied.error }, { status: auth.denied.status });
  }
  const { id } = await params;
  await deleteNavEntry(Number(id));
  return NextResponse.json({ ok: true });
}
