import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  if (url.startsWith("file:") && !path.isAbsolute(url.slice(5))) {
    const relativePath = url.slice(5).replace(/^\.\//, "");
    return `file:${path.join(process.cwd(), relativePath)}`;
  }
  return url;
}

const databaseUrl = getDatabaseUrl();
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
