import { PrismaClient } from "@/prisma/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/** Alias for importing Prisma as `db` per convention in feature logic files. */
export const db = prisma;
