import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

// In Vercel serverless environment, the filesystem at /var/task is strictly read-only.
// SQLite fails with Error 14 (SQLITE_CANTOPEN) if opened directly on /var/task.
// To allow SQLite to open and run queries without permission issues,
// copy travel.db to the writable /tmp directory if running on Vercel.
if (process.env.VERCEL) {
  try {
    const tmpDbPath = "/tmp/travel.db";
    const sourceDbPath = path.join(process.cwd(), "prisma", "travel.db");

    if (fs.existsSync(sourceDbPath)) {
      if (!fs.existsSync(tmpDbPath)) {
        fs.copyFileSync(sourceDbPath, tmpDbPath);
      }
      process.env.DATABASE_URL = `file:${tmpDbPath}`;
    }
  } catch (err) {
    console.error("Failed to copy database to /tmp on Vercel:", err);
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

