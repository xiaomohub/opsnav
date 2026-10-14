import type { User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ensureDatabase } from "../db/init";
import { prisma } from "../prisma";

export type { User };

export async function findUserByUsername(username: string): Promise<User | null> {
  await ensureDatabase();
  return prisma.user.findUnique({ where: { username } });
}

export async function findUserById(id: number): Promise<User | null> {
  await ensureDatabase();
  return prisma.user.findUnique({ where: { id } });
}

export function verifyPassword(user: User, password: string): boolean {
  return bcrypt.compareSync(password, user.passwordHash);
}

export function sanitizeUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    totpEnabled: user.totpEnabled,
    hasTotpSecret: Boolean(user.totpSecret),
  };
}

export async function setUserTotpSecret(userId: number, secret: string): Promise<void> {
  await ensureDatabase();
  await prisma.user.update({
    where: { id: userId },
    data: { totpSecret: secret },
  });
}

export async function enableUserTotp(userId: number): Promise<void> {
  await ensureDatabase();
  await prisma.user.update({
    where: { id: userId },
    data: { totpEnabled: true },
  });
}
