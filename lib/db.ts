import { PrismaClient } from "@prisma/client";

// Normalize database URL aliases from Vercel Postgres / Prisma integrations
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.DB_DATABASE_URL ||
    process.env.DB_PRISMA_DATABASE_URL ||
    process.env.DB_POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
