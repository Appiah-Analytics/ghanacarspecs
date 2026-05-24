# Debugging runbook: Neon production seed & VehiclePhoto

Postmortem for empty **Visual evidence** on Vercel/Neon while local SQLite looked correct.

**Related:** [`postgresql.md`](postgresql.md), [`sample_data.md`](sample_data.md), [`public_demo_plan.md`](public_demo_plan.md)

---

## Summary

Production showed the Visual evidence empty state (“No GhanaCarSpecs photos are available for this vehicle yet”) even though the `VehiclePhotos` component, seed data, and placeholder SVGs worked locally. Root causes were **seeding the wrong database** (SQLite instead of Neon), **missing `vehicle_photos` rows on Neon**, and several supporting issues (seed importing `server-only`, unstable vehicle IDs on full reseed, Vercel running `migrate deploy` during build). Fixes aligned seed URL resolution with `DATABASE_URL`, isolated the seed script from Next-only modules, stabilized VIN-based upserts, and removed automatic migrations from the Vercel build.

---

## Symptom

| Where | What users saw |
|--------|----------------|
| **Production (Vercel + Neon)** | Lookup succeeded; vehicle report loaded; **Visual evidence** section appeared with empty-state copy (no photo cards). |
| **Local (SQLite)** | Same VINs showed two demo photo cards after `npm run db:seed`. |

Neon SQL initially showed vehicles present but **`photo_count = 0`** for seed VINs.

---

## Root causes

1. **Seed targeted SQLite, not Neon**  
   `resolvePrismaDatabaseUrl()` always used `file:…/prisma/dev.db` for local runs unless `VERCEL=1` or `USE_POSTGRES_LOCAL=1`. With `DATABASE_URL` set to Neon in `.env`, `npm run db:seed` still logged `file:…/dev.db`, so photos were written to SQLite while production read Neon.

2. **App/seed database split (earlier)**  
   Even when the UI path was correct, lookup and reports could read Neon (empty photos) while seed populated SQLite (six `VehiclePhoto` rows).

3. **Seed imported `lib/prisma.ts`**  
   `prisma/seed.ts` imported the app Prisma singleton, which pulls in `server-only`. That module is valid in Next.js but **fails under `tsx`** (`Cannot find module 'server-only'`).

4. **No photos on Neon until production seed**  
   Migrations could exist on Neon while seed never ran against Postgres, or seed ran against the wrong file DB.

5. **Stale `/vehicles/[id]` URLs (earlier)**  
   Full `vehicle.deleteMany()` + recreate issued new CUIDs each seed; bookmarked report URLs pointed at old IDs with no photos.

6. **Vercel build: `migrate deploy` + P1002**  
   Running `prisma migrate deploy` on every build caused **Neon advisory lock timeout (P1002)**. Migrations were moved to a manual step (see [`postgresql.md`](postgresql.md)).

---

## What we checked

| Check | Result |
|--------|--------|
| `VehiclePhoto` in `schema.prisma` / `schema.postgresql.prisma` | Model and `Vehicle.photos` relation present |
| `getVehicleForReport()` / `vehicleReportInclude` | Includes `photos` with correct relation name |
| `VehicleReport` → `VehiclePhotos` | Props passed; empty state = `photos.length === 0` |
| CSS / SVG paths | Section rendered; broken SVGs were a separate issue (invalid XML in placeholders) |
| `npm run db:seed` log line | Must show `postgresql://…` (masked), not `file:…/dev.db`, when seeding Neon |
| Neon SQL photo counts | `photo_count` should be **2** per seed VIN after correct seed |
| Prisma client for Postgres seed | `npm run db:generate:postgres` before seeding Neon |
| Vercel `DATABASE_URL` | Must match the Neon branch/database you migrate and seed |

---

## Final fixes

| Area | Fix |
|------|-----|
| **DB URL** | `lib/prisma-datasource.ts`: if `DATABASE_URL` starts with `postgresql://` or `postgres://`, use it; else SQLite `prisma/dev.db`. `formatDatabaseUrlForLog()` masks passwords. |
| **App Prisma** | `lib/prisma.ts` uses shared resolver + `server-only` (Next only). |
| **Seed** | `prisma/seed.ts` uses `new PrismaClient({ datasources })` directly — **does not** import `lib/prisma.ts`. |
| **Seed data** | VIN-based `upsert` + `replaceVehicleHistory()`; global delete of photos/events, then per-vehicle `createMany` with current `vehicleId`. |
| **Vercel build** | `scripts/production-build.mjs`: `prisma generate` (postgres schema) + `next build` only — **no** `migrate deploy` on build. |
| **Local vs prod** | `lookup-normalize.ts` keeps client bundle from importing Prisma; dev logs in `getVehicleForReport()` for photo counts. |

---

## Correct production seed workflow

PowerShell (from repo root):

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
npm run db:generate:postgres
npm run db:migrate:postgres
npm run db:seed
```

bash:

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
npm run db:generate:postgres
npm run db:migrate:postgres
npm run db:seed
```

### Expected seed output

- **Neon:** `[seed] database: postgresql://user:***@host/...` (password never printed in full).
- **Local SQLite:** `[seed] database: file:…/prisma/dev.db` (with `DATABASE_URL` unset or non-Postgres).

Then:

```text
Seed OK — vehicles and photo counts:
  Toyota 4T1BE46K37U123456 … photos=2
  Volkswagen WVWZZZ3CZWE123456 … photos=2
  Honda 1HGBH41JXMN109186 … photos=2
```

**Do not redeploy Vercel for seed-only changes** — seed updates Neon data in place. Redeploy when application code or env vars change.

---

## SQL verification queries

Run in Neon SQL Editor or `psql` against the same database as `DATABASE_URL`.

### Photo count per VIN

```sql
SELECT v.vin, COUNT(vp.id) AS photo_count
FROM vehicles v
LEFT JOIN vehicle_photos vp ON vp."vehicleId" = v.id
GROUP BY v.vin
ORDER BY v.vin;
```

**Expected for demo seed:**

| vin | photo_count |
|-----|-------------|
| `1HGBH41JXMN109186` | 2 |
| `4T1BE46K37U123456` | 2 |
| `WVWZZZ3CZWE123456` | 2 |

### Tables exist

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('vehicles', 'vehicle_events', 'vehicle_photos');
```

### Sample photo URLs on Neon

```sql
SELECT v.vin, vp.url, vp.caption
FROM vehicle_photos vp
JOIN vehicles v ON v.id = vp."vehicleId"
ORDER BY v.vin, vp."createdAt";
```

URLs should start with `/demo-photos/` (static assets from the Next.js app, not stored in the DB).

---

## Lessons learned

1. **Always log which database seed touches** — one line (`[seed] database: …`) prevents silent SQLite vs Neon mistakes.
2. **Seed scripts must not import Next-only modules** (`server-only`, RSC-only paths). Use `@prisma/client` + shared URL helper only.
3. **Empty UI with a mounted component usually means empty data**, not CSS — confirm Prisma `include` and DB row counts first.
4. **Production static files ≠ DB seed** — SVGs deploy with Vercel; `VehiclePhoto` rows must be seeded on Neon separately.
5. **Do not run `migrate deploy` on every Vercel build** on Neon — use manual migrate + advisory-lock-aware workflow.
6. **Prefer VIN upserts** for demo vehicles so report URLs remain stable across reseeds.

---

## Prevention checklist

Before declaring production visual evidence fixed:

- [ ] **Vercel `DATABASE_URL`** matches the Neon project/branch you migrate and seed.
- [ ] **Neon tables** exist (`vehicles`, `vehicle_events`, `vehicle_photos`).
- [ ] **`npm run db:migrate:postgres`** completed against that `DATABASE_URL`.
- [ ] **`npm run db:seed`** logs **`postgresql://…` masked**, not `file:…/dev.db`.
- [ ] **SQL** `photo_count = 2` for all three seed VINs (query above).
- [ ] **Fresh lookup** from homepage for each VIN — do not rely on old `/vehicles/[id]` bookmarks.
- [ ] **Redeploy Vercel** only after code/config changes — not required after seed-only updates.
- [ ] **Prisma client** for deploy: Vercel build runs `db:generate:postgres` (via `vercel-build` / `VERCEL=1`).

### Seed VINs (canonical)

See [`sample_data.md`](sample_data.md):

- Toyota: `4T1BE46K37U123456`
- Volkswagen: `WVWZZZ3CZWE123456`
- Honda: `1HGBH41JXMN109186`

---

## Quick triage

| Observation | Likely cause | Action |
|-------------|--------------|--------|
| `[seed] database: file:…dev.db` but intent is Neon | Postgres `DATABASE_URL` not used | Set `$env:DATABASE_URL`; confirm `postgresql://` prefix; re-run seed |
| `photo_count = 0` on Neon | Seed not run on Neon or wrong DB | Run correct workflow above; re-run SQL |
| Photos locally, empty on prod | Split DB | Seed with Neon URL; verify SQL on Neon |
| `server-only` on `db:seed` | Seed imports `lib/prisma.ts` | Use current `seed.ts` (direct `PrismaClient`) |
| Vercel build P1002 | `migrate deploy` in build | Use manual `db:migrate:postgres`; see [`postgresql.md`](postgresql.md) |
| Empty section, SQL shows 2 photos | Stale vehicle `id` in URL | Lookup again from `/` |
