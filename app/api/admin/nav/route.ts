import { NextRequest, NextResponse } from "next/server";
import { requireLoggedInSession } from "@/lib/auth/totp-access";
import { createNavEntry, listNavEntries } from "@/lib/nav/repository";

export async function GET() {
  const auth = await requireLoggedInSession();
  if (auth.denied) {
    return NextResponse.json({ error: auth.denied.error }, { status: auth.denied.status });
  }
  const items = await listNavEntries();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const auth = await requireLoggedInSession();
  if (auth.denied) {
    return NextResponse.json({ error: auth.denied.error }, { status: auth.denied.status });
  }
  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const url = String(body.url ?? "").trim();
  const description = String(body.description ?? "").trim();
  if (!name || !url) {
    return NextResponse.json({ error: "名称和 URL 必填" }, { status: 400 });
  }
  const id = await createNavEntry({ name, url, description });
  return NextResponse.json({ id });
}
