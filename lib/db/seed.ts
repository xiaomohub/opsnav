import bcrypt from "bcryptjs";
import { config } from "../config";
import { prisma } from "../prisma";

export async function seedDatabase() {
  const existing = await prisma.user.findUnique({
    where: { username: config.adminUsername() },
  });
  if (!existing) {
    const passwordHash = bcrypt.hashSync(config.adminPassword(), 10);
    await prisma.user.create({
      data: {
        username: config.adminUsername(),
        passwordHash,
      },
    });
    console.log(`[db] Seeded admin user: ${config.adminUsername()}`);
  }

  const navCount = await prisma.navEntry.count();
  if (navCount === 0) {
    await prisma.navEntry.createMany({
      data: [
        { name: "GitHub", url: "https://github.com", description: "代码托管" },
        {
          name: "OpsNav 文档",
          url: "https://github.com/xiaomohub/opsnav",
          description: "本仓库",
        },
      ],
    });
    console.log("[db] Seeded sample nav entries");
  }
}
