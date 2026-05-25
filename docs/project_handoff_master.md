# GhanaCarSpecs — Project Handoff (Master Reference)

**Purpose:** Single operational reference for continuing development, onboarding, or recovering context after a break.  
**Status:** Operational MVP / public demo (Vercel + Neon + Vercel Blob).  
**Last updated:** Phase 14 (admin Blob uploads, evidence confidence/provenance).

Cross-reference deeper docs rather than duplicating them:

| Topic | Doc |
|-------|-----|
| Neon seed / empty photos | [`debugging_neon_seed_photos.md`](debugging_neon_seed_photos.md) |
| Dual-schema PostgreSQL | [`postgresql.md`](postgresql.md) |
| Blob uploads | [`vercel_blob_setup.md`](vercel_blob_setup.md) |
| Trust badges | [`evidence_confidence_and_provenance.md`](evidence_confidence_and_provenance.md) |
| Admin CRUD | [`admin_record_management.md`](admin_record_management.md) |
| Engineering history | [`build_log.md`](build_log.md) |
| Phases | [`roadmap.md`](roadmap.md) |
| QA VINs | [`sample_data.md`](sample_data.md) |

---

## 1. Project Overview

### What GhanaCarSpecs is

**GhanaCarSpecs** is a vehicle history, specs, and **trust/provenance** platform focused on Ghana (with room to expand). It lets users look up a vehicle by **VIN**, **plate**, or **chassis** and view a structured report: identity, timeline events, visual evidence, and (where applicable) risk/intelligence signals from local data.

### Core mission

Build a **credible, explainable record** of what is known about a vehicle in Ghana — who reported it, how confident the platform is, and what is **not** official government or insurer data — before buyers, insurers, or partners rely on it.

### Current stage

**Operational MVP / demo:** deployable on Vercel with Neon PostgreSQL, seeded demo vehicles, admin ingestion, and admin image uploads. Not a full commercial product (no payments, no public user accounts, no live DVLA feed).

### Key use cases

| Use case | How the product supports it today |
|----------|-----------------------------------|
| **Fraud awareness** | Timeline + visual evidence with provenance/confidence badges; clear disclaimers vs official records |
| **Salvage / rebuild visibility** | Demo accident/repair photos and events (e.g. VW sample) |
| **Insurance risk** | Mileage updates, accident events (sample narratives; no live insurer API) |
| **Trust / provenance** | `ProvenanceType` + `ConfidenceLevel` on photos and events; admin-controlled entry |
| **Imported vehicle intelligence** | Import events, port/importer-style demo evidence (Toyota/Honda samples) |

---

## 2. Current Architecture

### Frontend

| Layer | Technology |
|-------|------------|
| Framework | **Next.js 15** (App Router) |
| Language | **TypeScript** |
| UI | **React 19**, **global CSS** (`app/globals.css`) — *Tailwind is not used in this repo* |
| Dev server | `npm run dev` (Turbopack default; `dev:webpack` fallback) |

Key routes:

- `/` — lookup form
- `/vehicles/[id]` — local vehicle report
- `/decoded` — external NHTSA decode (sessionStorage)
- `/admin/*` — dashboard, CSV ingest, vehicle manage

### Backend

- **Next.js Route Handlers** under `app/api/`
- **Public:** `POST /api/v1/lookup`
- **Admin (middleware + session or Bearer):** ingest, login/logout, vehicle photos/events, Blob uploads

Shared logic lives in `lib/` (lookup, Prisma, admin auth, CSV ingest, evidence metadata, upload validation).

### Databases

| Environment | Provider | Schema file |
|-------------|----------|-------------|
| **Local dev (default)** | SQLite `prisma/dev.db` | `prisma/schema.prisma` |
| **Production (Vercel)** | **Neon PostgreSQL** | `prisma/schema.postgresql.prisma` |

Migrations in `prisma/migrations/` apply to **PostgreSQL only**. Local SQLite uses `db:push`.

### Hosting & storage

| Service | Role |
|---------|------|
| **Vercel** | Next.js hosting, build, env secrets |
| **Neon** | Production PostgreSQL |
| **Vercel Blob** | Admin-uploaded visual evidence (`vehicle-evidence/{vehicleId}/…`) |

Static demo assets: `public/demo-photos/*.svg`.

---

## 3. Environment Model

### Local SQLite workflow (default)

1. Copy [`.env.example`](../.env.example) → `.env`
2. Set **`ADMIN_API_KEY`** or **`ADMIN_PASSWORD`** (required for `/admin`)
3. **Leave `DATABASE_URL` unset** (or non-Postgres) so the app and `db:seed` use `file:…/prisma/dev.db`
4. Run:

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

`lib/prisma-datasource.ts` resolves SQLite when `DATABASE_URL` is missing or not a `postgres://` / `postgresql://` URL.

### Neon production workflow

1. Set **`DATABASE_URL`** to Neon connection string (in Vercel **and** locally when seeding Neon)
2. Use **PostgreSQL-specific** scripts (different Prisma schema + client):

```bash
npm run db:generate:postgres
npm run db:migrate:postgres
npm run db:seed:postgres
```

3. Deploy app on Vercel; run migrations **manually** when schema changes (not during Vercel build)

### Why two Prisma schemas?

Prisma binds one generated client to **one provider**. SQLite and PostgreSQL cannot share a single `schema.prisma` at generate time. Both schema files must stay **model-identical**; change both when adding fields.

### Why `db:seed` vs `db:seed:postgres`?

| Command | Prisma schema | Typical target |
|---------|---------------|----------------|
| `npm run db:seed` | `schema.prisma` (SQLite) | Local `dev.db` |
| `npm run db:seed:postgres` | `schema.postgresql.prisma` | Neon when `DATABASE_URL` is Postgres |

Running **`db:seed`** while `DATABASE_URL` points at Neon causes **schema/provider mismatch** or seeds the wrong database. Always use **`db:seed:postgres`** for Neon. See [`debugging_neon_seed_photos.md`](debugging_neon_seed_photos.md).

### `.env` expectations

| Variable | Required | Notes |
|----------|----------|--------|
| `ADMIN_API_KEY` or `ADMIN_PASSWORD` | Yes (admin) | Uncommented line in `.env`; restart dev after change |
| `DATABASE_URL` | Production / Neon seed | `postgresql://…` or `postgres://…` |
| `BLOB_READ_WRITE_TOKEN` | Blob uploads | From Vercel Blob store; optional locally until testing uploads |
| `VERCEL` | Set by Vercel | `VERCEL=1` → build uses Postgres client; runtime requires `DATABASE_URL` |

### `DATABASE_URL` behavior

- **App + seed** (`prisma/seed.ts`): `resolvePrismaDatabaseUrl()` — Postgres if URL is postgres protocol; else SQLite file path
- **Vercel runtime:** Postgres required; missing URL → lookup failures
- **Seed log:** `[seed] database: postgresql://…` (masked) on Neon; `file:…/dev.db` locally

### `VERCEL` behavior

- **`scripts/production-build.mjs`:** if `VERCEL=1`, runs `prisma generate --schema prisma/schema.postgresql.prisma` then `next build`
- **Does not** run `prisma migrate deploy` on build (Neon advisory lock / timeout lessons)

---

## 4. Important Commands

### Local development

```bash
npm install
npm run dev              # http://localhost:3000
npm run db:generate      # SQLite Prisma client
npm run db:push          # Apply schema to dev.db
npm run db:seed          # Reseed demo data (SQLite only)
npm run db:setup         # db:push + db:seed
```

### Neon / PostgreSQL

```bash
# DATABASE_URL must be set in shell or .env
npm run db:generate:postgres
npm run db:migrate:postgres
npm run db:seed:postgres
npm run db:setup:postgres   # generate + migrate + seed:postgres
```

### Deployment (git)

```bash
git add .
git commit -m "Describe change"
git push
```

After schema migrations, run **`db:migrate:postgres`** against Neon before or after deploy (see [`postgresql.md`](postgresql.md)).

### Build / testing

```bash
npm run lint             # tsc --noEmit
npm run build            # production-build.mjs + next build
npm run build:local      # db:generate (SQLite) + next build
```

---

## 5. Current Major Features

### Public

| Feature | Notes |
|---------|--------|
| **VIN lookup** | 17-char VIN; local DB first, NHTSA fallback for unknown VINs |
| **Plate / chassis** | Normalized matching on seeded vehicles |
| **External VIN decode** | NHTSA vPIC → `/decoded` (no local photos) |
| **Visual evidence** | `VehiclePhoto` grid; demo SVGs + Blob HTTPS URLs |
| **Confidence / provenance badges** | Per photo and timeline event |
| **Timeline events** | `VehicleEvent` cards with type, date, mileage, source |
| **Risk / intelligence** | Derived signals from local events (not official scoring) |

### Admin

| Feature | Route / API |
|---------|-------------|
| **Login** | `/admin/login`, session cookie |
| **Dashboard** | `/admin` — vehicle table |
| **Vehicle manage** | `/admin/vehicles/[id]` — photos, events |
| **CSV ingestion** | `/admin/ingest` → `POST /api/admin/ingest` |
| **Add photo (URL)** | Manual `/demo-photos/`, `http://`, `https://` |
| **Add photo (upload)** | `POST /api/admin/uploads` → Blob → save `VehiclePhoto` |
| **Add event** | Form + `POST /api/admin/vehicles/[id]/events` |

Auth: middleware on `/admin/*` and `/api/admin/*`; Bearer / `X-Admin-Key` for API scripts.

---

## 6. Production Infrastructure

### Vercel

- Build: `vercel-build` → `scripts/production-build.mjs`
- Generates **PostgreSQL** Prisma client only on Vercel
- Env: `DATABASE_URL`, `ADMIN_API_KEY` or `ADMIN_PASSWORD`, `BLOB_READ_WRITE_TOKEN` (uploads)

### Neon

- Authoritative production data
- Migrations applied via `npm run db:migrate:postgres` **outside** the build

### Vercel Blob

- Public blobs for admin evidence images
- Path: `vehicle-evidence/{vehicleId}/{timestamp}-{filename}`
- Setup: [`vercel_blob_setup.md`](vercel_blob_setup.md)

### Why `prisma migrate deploy` is NOT run during Vercel build

Concurrent deploys against Neon caused **P1002 advisory lock timeouts** when migrate ran on every build. Current policy:

1. Build = `prisma generate` (postgres) + `next build`
2. Operator runs **`db:migrate:postgres`** manually when `prisma/migrations/` changes
3. Optional **`db:seed:postgres`** for demo rows (not automatic on deploy)

---

## 7. Important Debugging History

Lessons already paid for — details in linked runbooks.

| Issue | Lesson | Reference |
|-------|--------|-----------|
| **Neon advisory lock (P1002)** | Do not `migrate deploy` on every Vercel build | [`postgresql.md`](postgresql.md), [`build_log.md`](build_log.md) |
| **SQLite vs Postgres schema** | Two schema files; two generate/seed commands | [`postgresql.md`](postgresql.md) |
| **Production seeding confusion** | `db:seed` ≠ Neon; use `db:seed:postgres`; check `[seed] database:` log | [`debugging_neon_seed_photos.md`](debugging_neon_seed_photos.md) |
| **Stable demo vehicle IDs** | VIN-based upsert in seed; fresh lookup after reseed | [`debugging_neon_seed_photos.md`](debugging_neon_seed_photos.md) |
| **Empty visual evidence on prod** | Often wrong DB or zero `vehicle_photos` rows on Neon | [`debugging_neon_seed_photos.md`](debugging_neon_seed_photos.md) |
| **Photo rendering** | Use native `<img>` for SVGs; `normalizeDemoPhotoSrc()` for `/demo-photos/` | [`build_log.md`](build_log.md) |
| **Admin URL field `type="url"`** | Browsers reject relative `/demo-photos/…` paths → use `type="text"` | [`build_log.md`](build_log.md) |
| **Windows EPERM on `prisma generate`** | Stop `npm run dev` if query engine DLL locked; rerun generate | Local dev note |
| **Seed importing `server-only`** | `prisma/seed.ts` uses direct `PrismaClient`, not `lib/prisma.ts` | [`debugging_neon_seed_photos.md`](debugging_neon_seed_photos.md) |

---

## 8. Current Data Model

### Entities (high level)

**Vehicle**

- Identity: `vin` (unique), optional `plateNumber`, `chassisNumber`
- Specs: make, model, year, trim, engine, fuel, import metadata
- Relations: `photos[]`, `events[]`

**VehiclePhoto**

- `url`, `caption`, `sourceType` (import / inspection / accident / auction / other)
- `sourceLabel`, `takenAt`
- **`confidenceLevel`**, **`provenanceType`** (trust metadata)

**VehicleEvent**

- `eventType`, `eventDate`, `mileage`, `sourceSystem`, `rawPayload` (JSON)
- **`confidenceLevel`**, **`provenanceType`**

### Enums (trust)

**ConfidenceLevel:** `LOW` | `MEDIUM` | `HIGH` | `VERIFIED`  
**ProvenanceType:** `DEMO`, `USER_SUBMITTED`, `DEALER`, `IMPORTER`, `AUCTION`, `INTERNAL`, `GOVERNMENT`, `INSURER`, `POLICE`, `OTHER`

Defaults: `LOW` + `OTHER`.

### Trust philosophy

- Every evidence item should answer: **who said this** (provenance) and **how much we trust it** (confidence).
- Demo seed uses importer/auction/internal-style provenance with **LOW** confidence — explicitly not DVLA/police/insurer-official.
- High provenance labels (e.g. `GOVERNMENT`) are **vocabulary for the future**, not live integrations.

Full definitions: [`evidence_confidence_and_provenance.md`](evidence_confidence_and_provenance.md).

---

## 9. Product Philosophy

1. **GhanaCarSpecs is a trust and provenance platform**, not only a specs lookup site.
2. **Evidence confidence** is shown in the UI; we do not imply official verification without integration.
3. **Avoid fake accusations** — sample narratives are labeled demo; badges and copy state limitations.
4. **Admin-controlled ingestion first** — CSV, manual events, Blob uploads; no public submission queue yet.
5. **Official integrations later** — DVLA, police, insurers require authorization and separate phases.

---

## 10. Current Demo VINs

Canonical QA values: [`sample_data.md`](sample_data.md).

### Toyota — `4T1BE46K37U123456`

| Field | Value |
|-------|--------|
| Vehicle | 2007 Toyota Camry |
| Plate | `GR-1234-21` |
| Chassis | `BE46K37U123456` |

**Demonstrates:** import → registration → service → mileage timeline; Tema Port import + inspection **photos**; provenance **IMPORTER** / **INTERNAL**, confidence **LOW**.

### Volkswagen — `WVWZZZ3CZWE123456`

| Field | Value |
|-------|--------|
| Vehicle | 2014 VW Golf |
| Plate | `GT 5678-22` |

**Demonstrates:** import + **accident** event; accident/repair **visual evidence**; provenance **OTHER**, confidence **LOW** (salvage/repair narrative without insurer file).

### Honda — `1HGBH41JXMN109186`

| Field | Value |
|-------|--------|
| Vehicle | 1991 Honda Accord |
| Plate | *(none)* — use VIN or chassis `BH41JXMN109186` |

**Demonstrates:** US **auction** photo + import-source trail; **AUCTION** / **IMPORTER** provenance; classic import storyline.

**External decode test (not in seed):** `1HGCM82633A004352` → NHTSA `/decoded` flow.

---

## 11. Current Open Risks / Limitations

| Limitation | Impact |
|------------|--------|
| No official **DVLA** API | Registration events are samples only |
| No **insurer** / **police** feeds | Cannot verify claims automatically |
| No **moderation** workflow | Admin entries go live on save |
| No **public submissions** | End users cannot upload evidence |
| **Demo placeholders** still in seed | Must not be mistaken for real investigations |
| No **automated confidence scoring** | Badges are operator-selected |
| Single **shared admin secret** | Not multi-user RBAC |
| Blob uploads need **token** | 503 without `BLOB_READ_WRITE_TOKEN` |
| CSV ingest does not set provenance per row | Defaults `LOW` / `OTHER` |

---

## 12. Recommended Next Milestones

Suggested order (align with [`roadmap.md`](roadmap.md)):

1. **Production stabilization** — migrate/seed runbooks, monitoring, env parity Preview/Production  
2. **Admin operational UX** — edit/delete evidence, bulk tools, audit log  
3. **Moderation workflow** — review queue before public visibility  
4. **Public submissions** — authenticated or verified uploads with default LOW confidence  
5. **Dealer tools** — partner ingest, API keys, dashboards  
6. **Insurance partnerships** — authorized claim/loss feeds → provenance `INSURER`  
7. **Fraud scoring** — rules/ML on top of provenance (never replace human labels initially)  
8. **Government / official integrations** — DVLA etc. with legal basis and `VERIFIED` workflow  

---

## 13. Recovery Checklist

Fresh clone → working local demo:

- [ ] `git clone` + `cd` repo  
- [ ] `npm install`  
- [ ] Copy `.env.example` → `.env`; set **uncommented** `ADMIN_API_KEY=…`  
- [ ] `npm run db:generate && npm run db:push && npm run db:seed`  
- [ ] `npm run dev` → open `/`  
- [ ] Lookup Toyota VIN `4T1BE46K37U123456` → report with photos, badges, events  
- [ ] `/admin/login` → dashboard → **Manage** → add event or photo  
- [ ] (Optional) Set `BLOB_READ_WRITE_TOKEN` → upload image on manage page → save → verify on public report  
- [ ] `npm run lint && npm run build`  

Production Neon sanity:

- [ ] `DATABASE_URL` in Vercel matches target branch  
- [ ] `npm run db:generate:postgres && npm run db:migrate:postgres && npm run db:seed:postgres` (from machine with env)  
- [ ] SQL: 2 photos per seed VIN ([`debugging_neon_seed_photos.md`](debugging_neon_seed_photos.md))  
- [ ] Fresh lookup on production URL (not stale `/vehicles/[id]` bookmark)  

---

## 14. File Map

```
prisma/
  schema.prisma              # SQLite (local)
  schema.postgresql.prisma   # PostgreSQL (Neon / Vercel)
  seed.ts                    # Demo vehicles (VIN upsert)
  migrations/                # Postgres-only SQL migrations
  dev.db                     # Local SQLite (gitignored)

app/
  page.tsx                   # Home lookup
  vehicles/[id]/page.tsx     # Local report
  decoded/page.tsx           # NHTSA decode view
  admin/                     # Dashboard, ingest, manage, login
  api/
    v1/lookup/               # Public lookup API
    admin/                   # Ingest, login, uploads, photos, events
  globals.css                # All UI styles
  layout.tsx

components/
  VehicleReport.tsx          # Report shell
  VehiclePhotos.tsx          # Visual evidence + trust copy
  EventTimeline.tsx          # Events + badges
  EvidenceBadges.tsx
  AdminAddPhotoForm.tsx      # Upload + manual URL
  AdminAddEventForm.tsx
  AdminNav.tsx, AdminLoginForm.tsx, …

lib/
  prisma.ts                  # App DB client (server-only)
  prisma-datasource.ts       # URL resolution for app + seed
  lookup.ts, lookup-messages.ts
  nhtsa-vin.ts               # External decode
  admin-auth.ts, admin-api.ts, admin-record-mutations.ts
  admin-upload.ts            # Blob upload validation
  csv-ingest.ts
  vehicle-report.ts, vehicle-intelligence.ts
  evidence-metadata.ts, demo-photo-urls.ts, photo-source.ts

docs/                        # All operational + product docs (keep)
public/demo-photos/          # Seeded SVG placeholders

scripts/
  production-build.mjs       # Vercel vs local build
  prisma-generate.mjs        # postinstall generate
  export-sqlite-data.ts, import-postgres-data.ts

middleware.ts                # Admin route protection
vercel.json                  # vercel-build command
```

---

## 15. Recommended Future Chat Context

Paste this block into a new Cursor / ChatGPT session to restore context quickly:

```text
Project: GhanaCarSpecs (Next.js 15 App Router, TypeScript, global CSS).
Mission: Vehicle history + trust/provenance for Ghana — not just specs.
Stack: Local SQLite (prisma/schema.prisma, db:seed); production Neon PostgreSQL
(prisma/schema.postgresql.prisma, db:generate:postgres, db:migrate:postgres,
db:seed:postgres). Hosted on Vercel; admin uploads via Vercel Blob
(BLOB_READ_WRITE_TOKEN). Admin: ADMIN_API_KEY or ADMIN_PASSWORD.
Public: POST /api/v1/lookup (VIN/plate/chassis), reports at /vehicles/[id] with
VehiclePhoto + VehicleEvent + ConfidenceLevel/ProvenanceType badges.
External 17-char VIN fallback: NHTSA → /decoded. Demo VINs: Toyota 4T1BE46K37U123456,
VW WVWZZZ3CZWE123456, Honda 1HGBH41JXMN109186. Vercel build does NOT run migrate
(manual db:migrate:postgres). Master handoff: docs/project_handoff_master.md.
Deep dives: docs/debugging_neon_seed_photos.md, docs/postgresql.md,
docs/vercel_blob_setup.md, docs/evidence_confidence_and_provenance.md.
Do not use db:seed against Neon — use db:seed:postgres. Prisma models must stay
in sync across both schema files.
```

---

## Quick links (repo root)

- [README.md](../README.md) — setup and command table  
- [.env.example](../.env.example) — required env vars  

When in doubt, prefer **operational docs** in `docs/` over chat memory.
