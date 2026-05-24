/**
 * Resolve the database URL for Prisma (app + seed).
 * PostgreSQL when DATABASE_URL uses postgres protocol; otherwise local SQLite.
 */
export function isPostgresDatabaseUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase();
  return trimmed.startsWith("postgresql://") || trimmed.startsWith("postgres://");
}

export function resolvePrismaDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL?.trim();

  if (envUrl && isPostgresDatabaseUrl(envUrl)) {
    return envUrl;
  }

  const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";
  if (isVercel) {
    if (!envUrl) {
      throw new Error("DATABASE_URL is required when VERCEL=1 (PostgreSQL).");
    }
    return envUrl;
  }

  const sqliteFile = `${process.cwd()}/prisma/dev.db`.replace(/\\/g, "/");
  return `file:${sqliteFile}`;
}

/** Safe log line for seed/scripts — never prints passwords. */
export function formatDatabaseUrlForLog(url: string): string {
  if (url.startsWith("file:")) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = "***";
    }
    return parsed.toString();
  } catch {
    return url.replace(/:([^:@/]+)@/, ":***@");
  }
}
