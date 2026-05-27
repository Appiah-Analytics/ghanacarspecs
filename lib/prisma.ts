import "server-only";

import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/env";
import { resolvePrismaDatabaseUrl } from "@/lib/prisma-datasource";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const url = resolvePrismaDatabaseUrl(env.DATABASE_URL);
  return new PrismaClient({
    datasources: { db: { url } },
    log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
