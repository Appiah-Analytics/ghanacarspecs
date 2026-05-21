/**
 * Generate Prisma client for the active environment:
 * - Vercel / CI with VERCEL set → PostgreSQL (schema.postgresql.prisma)
 * - Local default → SQLite (schema.prisma)
 */
import { execSync } from "node:child_process";

const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";
const schema = isVercel ? "prisma/schema.postgresql.prisma" : "prisma/schema.prisma";

console.log(`[prisma-generate] VERCEL=${process.env.VERCEL ?? "(unset)"} → ${schema}`);

execSync(`npx prisma generate --schema ${schema}`, { stdio: "inherit" });
