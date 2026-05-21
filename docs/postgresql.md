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
| `npm run db:seed` | Reseed sample data |
| `npm run db:setup` | `db:push` + `db:seed` |

`DATABASE_URL` is **not required** for the default SQLite workflow.

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
npm run db:seed
```

Or use the combined helper (requires `DATABASE_URL`):

```bash
npm run db:setup:postgres
```

Migrations live in `prisma/migrations/` and apply **only** to PostgreSQL (`--schema prisma/schema.postgresql.prisma`).

### 3. Production deploy order

**Vercel (automatic):** When `VERCEL=1`, `npm install` and `npm run build` (or `vercel-build`) use the PostgreSQL schema:

```bash
# Handled by scripts/production-build.mjs on Vercel:
prisma generate --schema prisma/schema.postgresql.prisma
prisma migrate deploy --schema prisma/schema.postgresql.prisma
next build
```

Set **`DATABASE_URL`** in the Vercel project (Neon pooled connection string). Run **`npm run db:seed`** once against Neon if the database is empty (migrations do not seed data).

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

| Vercel setting | Value |
|----------------|--------|
| **Build Command** | `npm run vercel-build` (default via `vercel.json`) |
| **Environment** | `DATABASE_URL` = Neon PostgreSQL connection string |
| **Admin (optional)** | `ADMIN_API_KEY` or `ADMIN_PASSWORD` |

The build runs `prisma generate --schema prisma/schema.postgresql.prisma` before `next build`. If lookup returns **Lookup failed**, check Vercel logs: usually missing `DATABASE_URL`, wrong connection string, or Prisma client generated for SQLite (redeploy after this fix).

One-time after creating the Neon database:

```bash
DATABASE_URL="postgresql://..." npm run db:migrate:postgres
DATABASE_URL="postgresql://..." npm run db:seed
```

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
