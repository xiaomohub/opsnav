import { authenticator } from "otplib";
import { config } from "../config";

authenticator.options = { window: 1 };

export function generateTotpSecret(): string {
  const fromEnv = process.env.SMOKE_TOTP_SECRET;
  if (fromEnv) return fromEnv;
  return authenticator.generateSecret();
}

export function getTotpUri(username: string, secret: string): string {
  return authenticator.keyuri(username, config.appName, secret);
}

export function verifyTotpToken(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}
