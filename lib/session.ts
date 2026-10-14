import { SessionOptions, getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { config } from "./config";

export type SessionData = {
  userId?: number;
  username?: string;
  totpVerifiedAt?: number;
};

export const sessionOptions: SessionOptions = {
  password: config.sessionSecret(),
  cookieName: "opsnav_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export function isTotpUnlocked(totpVerifiedAt?: number): boolean {
  if (!totpVerifiedAt) return false;
  const windowMs = config.totpUnlockMinutes * 60 * 1000;
  return Date.now() - totpVerifiedAt < windowMs;
}
