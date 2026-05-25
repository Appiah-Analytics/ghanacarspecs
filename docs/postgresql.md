# PostgreSQL readiness (Phase 9)

GhanaCarSpecs uses **SQLite locally** and is prepared for **PostgreSQL in staging/production** via a dual-schema Prisma setup. Nothing is deployed from this document.

Related: [`deployment_plan.md`](deployment_plan.md), [`roadmap.md`](roadmap.md), [`.env.example`](../.env.example).

---

## Why two Prisma schemas?

Prisma binds each generated client to **one database provider**. A single `schema.prisma` cannot switch between SQLite and PostgreSQL at runtime.

| File | Provider | Used for |
|------|----------|----------|
| `prisma/schema.prisma` | SQLite (`file:./dev.db`) | **Default local dev** — unchanged workflow |
| `prisma/schema.postgresql.prisma` | PostgreSQL (`env("DATABASE_URL")`) | Staging, production, optional local Postgres |

Models in both files are kept **identical**. When you change models, update both schemas (or diff them before shipping).

---

## Local development (SQLite — default)

No change from Phase 1–8:

```bash
npm install
npm run db:setup    # db push + seed → prisma/dev.db
npm run dev
```

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate SQLite Prisma client (also runs on `postinstall`) |
| `npm run db:push` | Apply schema to SQLite |
| `npm run db:seed` | Reseed sample data (SQLite schema only) |
| `npm run db:setup` | `db:push` + `db:seed` |

`DATABASE_URL` is **not required** for the default SQLite workflow. Do **not** run `npm run db:seed` when `DATABASE_URL` points at Neon — use `npm run db:seed:postgres` instead (see below).

---

## PostgreSQL (staging / production)

### 1. Set connection string

In `.env` or host secrets:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/ghanacarspecs?sslmode=require"
```

### 2. Generate client and apply migrations

```bash
npm run db:generate:postgres
npm run db:migrate:postgres
npm run db:seed:postgres
```

| Command | Description |
|---------|-------------|
| `npm run db:generate:postgres` | Generate PostgreSQL Prisma client |
| `npm run db:migrate:postgres` | Apply migrations to `DATABASE_URL` |
| `npm run db:seed:postgres` | Reseed demo data (PostgreSQL schema + client) |

Or use the combined helper (requires `DATABASE_URL`):

```bash
npm run db:setup:postgres
```

Migrations live in `prisma/migrations/` and apply **only** to PostgreSQL (`--schema prisma/schema.postgresql.prisma`).

### 3. Production deploy order

**Vercel build (automatic):** When `VERCEL=1`, `npm install` and `npm run build` (or `vercel-build`) run:

```bash
# scripts/production-build.mjs on Vercel:
prisma generate --schema prisma/schema.postgresql.prisma
next build
```

Migrations are **not** run during the Vercel build (avoids Neon advisory-lock timeouts on concurrent deploys). Set **`DATABASE_URL`** in the Vercel project (Neon pooled connection string).

**Migrations (manual):** When the Prisma schema changes, run migrations **before or after** deploy from your machine or CI — not inside the Vercel build:

```bash
DATABASE_URL="postgresql://..." npm run db:migrate:postgres
```

Run **`npm run db:seed:postgres`** separately when you need demo data (migrations do not seed). Do not use `npm run db:seed` against Neon — that command uses the SQLite Prisma schema.

**Manual / other hosts:**

```bash
npm run db:generate:postgres
npm run db:migrate:postgres
npm run build:local   # or npm run build on Vercel only
npm run start
```

**Important:** Local `npm run dev` and `npm run db:setup` still use **SQLite** (`schema.prisma`). Only Vercel/production builds switch to PostgreSQL via `VERCEL=1`.

---

## Safest migration path from SQLite → PostgreSQL

Choose based on data size and tolerance for downtime.

### Path A — Re-seed (recommended for MVP / dev)

Best when you only have seed data and test CSV imports.

1. Provision empty PostgreSQL.
2. `npm run db:setup:postgres` with `DATABASE_URL` set.
3. Smoke-test lookup and admin flows from [`sample_data.md`](sample_data.md).

### Path B — Export / import (small real datasets)

When you have local SQLite rows you need to preserve:

```bash
# 1. Export from SQLite (default client)
npm run db:export:sqlite
# → prisma/data/sqlite-export.json

# 2. Target PostgreSQL: migrate empty schema
npm run db:generate:postgres
npm run db:migrate:postgres

# 3. Import JSON
DATABASE_URL="postgresql://..." npm run db:import:postgres

# 4. Restore SQLite client for local dev
npm run db:generate
```

### Path C — CSV re-import

If source CSV files are the system of record, run `db:setup:postgres` then re-upload via `/admin/ingest`.

### Not recommended yet

- Automatic online dual-write to SQLite and PostgreSQL  
- Provider switching in a single `schema.prisma`  
- Running production on SQLite  

---

## npm scripts reference

| Script | Purpose |
|--------|---------|
| `db:generate` | SQLite Prisma client (local default) |
| `db:generate:postgres` | PostgreSQL Prisma client |
| `db:push` | SQLite schema sync (dev only) |
| `db:push:postgres` | PostgreSQL schema sync (avoid in prod; prefer migrate) |
| `db:migrate:postgres` | Apply committed migrations to PostgreSQL |
| `db:migrate:postgres:dev` | Create new PostgreSQL migration locally |
| `db:setup:postgres` | generate:postgres + migrate + seed |
| `db:export:sqlite` | Export SQLite data to JSON |
| `db:import:postgres` | Import JSON export into PostgreSQL |

---

## Schema change checklist

When editing Prisma models:

1. Update `prisma/schema.prisma` (SQLite).
2. Update `prisma/schema.postgresql.prisma` to match.
3. Local: `npm run db:push` and test.
4. PostgreSQL: `npm run db:migrate:postgres:dev` to add a migration; commit `prisma/migrations/`.
5. Regenerate clients: `db:generate` (local) and `db:generate:postgres` (deploy).

---

## Vercel + Neon

**Troubleshooting empty Visual evidence on production:** see [`debugging_neon_seed_photos.md`](debugging_neon_seed_photos.md) (Neon seed, `VehiclePhoto` counts, `DATABASE_URL` resolution). **Adding records in production:** [`admin_record_management.md`](admin_record_management.md).

| Vercel setting | Value |
|----------------|--------|
| **Build Command** | `npm run vercel-build` (default via `vercel.json`) |
| **Environment** | `DATABASE_URL` = Neon PostgreSQL connection string |
| **Admin (optional)** | `ADMIN_API_KEY` or `ADMIN_PASSWORD` |

The build runs `prisma generate --schema prisma/schema.postgresql.prisma` before `next build`. If lookup shows **Lookup temporarily unavailable** (HTTP 500), check Vercel logs: usually missing `DATABASE_URL`, wrong connection string, or Prisma client generated for SQLite (redeploy after this fix).

**Before first deploy** (empty Neon) or **when schema changes** (before or after `git push` / Vercel redeploy):

```bash
npm run db:generate:postgres
npm run db:migrate:postgres
npm run db:seed:postgres   # optional — demo rows only
```

Typical flow when you add a migration: commit `prisma/migrations/`, run `db:migrate:postgres` against Neon, then deploy (or deploy first, then migrate — but the app needs the migration applied before new columns are used).

---

## Optional local PostgreSQL

To test PostgreSQL on your machine without affecting SQLite:

```bash
# Example: Docker
docker run --name gcs-postgres -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=ghanacarspecs -p 5432:5432 -d postgres:16

# .env.postgres.local (do not commit)
DATABASE_URL="postgresql://postgres:dev@localhost:5432/ghanacarspecs"

# Apply migrations + seed
npm run db:setup:postgres
```

Keep using `npm run db:setup` (SQLite) for day-to-day app development unless you intentionally switch.

---

## Known limitations

- Two schema files must stay in sync manually until a single-provider cutover.
- `@prisma/client` reflects whichever schema was last generated — run the correct `db:generate*` after switching.
- `prisma migrate` history is PostgreSQL-only; SQLite continues to use `db push` locally.
- No Azure PostgreSQL provisioning in this phase (Phase 7 docs only).

---

## Next step (Phase 7)

Provision Azure Database for PostgreSQL, set `DATABASE_URL` on App Service, and run the production deploy sequence above.
