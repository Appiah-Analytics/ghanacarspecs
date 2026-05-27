import { NextResponse } from "next/server";
import pkg from "@/package.json";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let database: "connected" | "error" = "connected";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    database = "error";
    logger.error("health check database query failed", {
      error: error instanceof Error ? error.message : "unknown error",
    });
  }

  return NextResponse.json({
    ok: true,
    environment: env.NODE_ENV,
    database,
    blob: env.BLOB_READ_WRITE_TOKEN ? "configured" : "missing",
    timestamp: new Date().toISOString(),
    version: pkg.version,
  });
}
