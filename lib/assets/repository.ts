import type { Asset, AuthType } from "@prisma/client";
import { ensureDatabase } from "../db/init";
import { prisma } from "../prisma";

export type AssetSummary = {
  id: number;
  name: string;
  host: string;
  port: number;
  username: string;
  authType: AuthType;
};

export async function listAssetSummaries(): Promise<AssetSummary[]> {
  await ensureDatabase();
  return prisma.asset.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      host: true,
      port: true,
      username: true,
      authType: true,
    },
  });
}

export async function findAssetById(id: number): Promise<Asset | null> {
  await ensureDatabase();
  return prisma.asset.findUnique({ where: { id } });
}

export async function createAsset(data: {
  name: string;
  host: string;
  port: number;
  username: string;
  authType: AuthType;
  secretEncrypted: string;
}): Promise<number> {
  await ensureDatabase();
  const row = await prisma.asset.create({ data });
  return row.id;
}

export async function deleteAsset(id: number): Promise<void> {
  await ensureDatabase();
  await prisma.asset.delete({ where: { id } });
}
