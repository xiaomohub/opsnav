import type { IronSession } from "iron-session";
import { findUserById } from "./index";
import { getSession, isTotpUnlocked, type SessionData } from "../session";

type Denied = { status: number; error: string };

export async function assertTotpAssetAccess(
  session: IronSession<SessionData>
): Promise<Denied | null> {
  if (!session.userId) return { status: 401, error: "未登录" };
  const user = await findUserById(session.userId);
  if (!user?.totpEnabled) return { status: 403, error: "请先绑定 TOTP" };
  if (!isTotpUnlocked(session.totpVerifiedAt)) {
    return { status: 403, error: "TOTP 验证已过期，请重新验证" };
  }
  return null;
}

export async function requireLoggedInSession(): Promise<
  | { session: IronSession<SessionData>; denied: null }
  | { session: null; denied: Denied }
> {
  const session = await getSession();
  if (!session.userId) {
    return { session: null, denied: { status: 401, error: "未登录" } };
  }
  return { session, denied: null };
}
