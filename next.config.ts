import type { NextConfig } from "next";

// Support DB_DATABASE_URL and other Vercel Prisma Postgres aliases
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    process.env.DB_DATABASE_URL ||
    process.env.DB_PRISMA_DATABASE_URL ||
    process.env.DB_POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL;
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
