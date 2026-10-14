import { ensureDatabase } from "../db/init";
import { prisma } from "../prisma";

export type NavListItem = {
  id: number;
  name: string;
  url: string;
  description: string;
};

export async function listNavEntries(): Promise<NavListItem[]> {
  await ensureDatabase();
  return prisma.navEntry.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, url: true, description: true },
  });
}

export async function createNavEntry(data: {
  name: string;
  url: string;
  description: string;
}): Promise<number> {
  await ensureDatabase();
  const row = await prisma.navEntry.create({ data });
  return row.id;
}

export async function updateNavEntry(
  id: number,
  data: { name: string; url: string; description: string }
): Promise<void> {
  await ensureDatabase();
  await prisma.navEntry.update({ where: { id }, data });
}

export async function deleteNavEntry(id: number): Promise<void> {
  await ensureDatabase();
  await prisma.navEntry.delete({ where: { id } });
}
