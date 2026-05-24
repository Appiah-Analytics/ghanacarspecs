/**
 * Resolve the database URL for the active Prisma client.
 * Local dev always uses SQLite at prisma/dev.db so seed data matches the app,
 * even when DATABASE_URL in .env points at Neon for production testing.
 */
export function resolvePrismaDatabaseUrl(): string {
  const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";

  if (isVercel) {
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
      throw new Error("DATABASE_URL is required when VERCEL=1 (PostgreSQL).");
    }
    return url;
  }

  if (process.env.USE_POSTGRES_LOCAL === "1" || process.env.USE_POSTGRES_LOCAL === "true") {
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
      throw new Error("USE_POSTGRES_LOCAL is set but DATABASE_URL is missing.");
    }
    return url;
  }

  const sqliteFile = `${process.cwd()}/prisma/dev.db`.replace(/\\/g, "/");
  return `file:${sqliteFile}`;
}
