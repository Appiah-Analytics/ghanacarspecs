/**
 * Resolve the database URL for Prisma (app + seed).
 * PostgreSQL when DATABASE_URL uses postgres protocol; otherwise local SQLite.
 */
export function isPostgresDatabaseUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase();
  return trimmed.startsWith("postgresql://") || trimmed.startsWith("postgres://");
}

export function resolvePrismaDatabaseUrl(databaseUrl: string): string {
  return databaseUrl.trim();
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
