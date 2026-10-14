import bcrypt from "bcryptjs";
import { getDb, type UserRow } from "./db";

export function findUserByUsername(username: string): UserRow | undefined {
  return getDb()
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username) as UserRow | undefined;
}

export function findUserById(id: number): UserRow | undefined {
  return getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
}

export function verifyPassword(user: UserRow, password: string): boolean {
  return bcrypt.compareSync(password, user.password_hash);
}

export function sanitizeUser(user: UserRow) {
  return {
    id: user.id,
    username: user.username,
    totpEnabled: Boolean(user.totp_enabled),
    hasTotpSecret: Boolean(user.totp_secret),
  };
}
