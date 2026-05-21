/**
 * Production build entrypoint.
 * On Vercel (VERCEL=1): generate PostgreSQL Prisma client, apply migrations, then next build.
 * Locally: next build only (use npm run db:generate for SQLite client before testing production locally).
 */
import { execSync } from "node:child_process";

const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";

if (isVercel) {
  if (!process.env.DATABASE_URL) {
    console.warn("[production-build] WARNING: DATABASE_URL is not set. Lookup will fail at runtime.");
  } else {
    console.log("[production-build] DATABASE_URL is set — using PostgreSQL Prisma schema.");
  }

  execSync("npx prisma generate --schema prisma/schema.postgresql.prisma", { stdio: "inherit" });
  execSync("npx prisma migrate deploy --schema prisma/schema.postgresql.prisma", { stdio: "inherit" });
} else {
  console.log("[production-build] Local build — using existing Prisma client (SQLite after npm install).");
}

execSync("npx next build", { stdio: "inherit" });
