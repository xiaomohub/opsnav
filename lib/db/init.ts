import { prisma } from "../prisma";
import { seedDatabase } from "./seed";

let ready = false;

/** Connect to Postgres and run idempotent seed (admin + sample nav). */
export async function ensureDatabase(): Promise<void> {
  if (ready) return;
  await prisma.$connect();
  await seedDatabase();
  ready = true;
}
