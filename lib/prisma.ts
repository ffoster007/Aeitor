// lib/prisma.ts

import { PrismaClient } from "@/lib/generated/prisma";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Create the PostgreSQL connection pool.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create the Prisma adapter.
const adapter = new PrismaPg(pool);

// Reuse a singleton client to avoid connection leaks during development.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function hasCurrentDelegates(client: PrismaClient | undefined): client is PrismaClient {
  return Boolean(client && "passwordResetToken" in client);
}

export const prisma =
  (hasCurrentDelegates(globalForPrisma.prisma)
    ? globalForPrisma.prisma
    : undefined) ??
  new PrismaClient({
    adapter, // Required for the PostgreSQL adapter setup.
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}