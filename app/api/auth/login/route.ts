import { NextRequest, NextResponse } from "next/server";
import { findUserByUsername, sanitizeUser, verifyPassword } from "@/lib/auth";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "");

  if (!username || !password) {
    return NextResponse.json({ error: "用户名和密码必填" }, { status: 400 });
  }

  const user = await findUserByUsername(username);
  if (!user || !verifyPassword(user, password)) {
    return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
  }

  const session = await getSession();
  session.userId = user.id;
  session.username = user.username;
  await session.save();

  return NextResponse.json({ user: sanitizeUser(user) });
}
