import { NextResponse } from "next/server";
import { findUserById, sanitizeUser } from "@/lib/auth";
import { getSession, isTotpUnlocked } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  const user = await findUserById(session.userId);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({
    user: sanitizeUser(user),
    totpUnlocked: isTotpUnlocked(session.totpVerifiedAt),
  });
}
