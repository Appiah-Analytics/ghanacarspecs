# GhanaCarSpecs — Project Handoff Master

**Purpose:** Primary operational memory document for architecture, workflows, debugging history, deployment, and roadmap continuity.  
**Status:** Operational MVP / early production-ready platform.  
**Scope:** Documentation-only reference (no runtime behavior changes).

---

## 1. Project Overview

### What GhanaCarSpecs is

GhanaCarSpecs is a Ghana-focused vehicle intelligence platform that combines:

- local history records
- event timelines
- visual evidence
- provenance and confidence metadata

The system is built to answer operational trust questions around a vehicle, not only static specs.

### Mission and trust philosophy

The mission is to help users make safer, clearer vehicle decisions by showing what evidence exists, where it came from, and how reliable it appears.

Core trust principle:

- provenance and confidence are decision aids, not legal adjudication

### Current stage

The platform is in an operational MVP / early production-ready stage with:

- Vercel deployment support
- Neon PostgreSQL production workflow
- local SQLite developer workflow
- admin ingestion and upload tools
- health diagnostics and structured runtime checks

### Why provenance and confidence matter

In vehicle trust systems, false confidence can create real financial/legal harm. GhanaCarSpecs explicitly marks:

- **provenance** (source type/origin)
- **confidence** (estimated evidence reliability)

so users can reason about uncertainty rather than assume truth.

### Ghana-specific fraud and insurance context

The Ghana market has practical trust gaps around imported vehicles, accident/repair history, and fragmented records. GhanaCarSpecs is designed to reduce ambiguity in this context by making evidence auditable and attributable at a metadata level.

### Key use cases

| Use case | Platform relevance |
|---|---|
| Salvage/rebuild awareness | Event timeline + visual evidence can expose repair history patterns |
| Accident history visibility | Admin-entered events and photos show known incident indicators |
| Insurance fraud reduction | Better evidence lineage helps detect unsupported claims |
| Imported vehicle intelligence | Import events + source-labeled photos provide context before purchase |
| Trust/provenance verification | Badges and metadata show source class and confidence tier |

---

## 2. Current Technology Stack

### Frontend

- Next.js 15 App Router
- TypeScript
- TailwindCSS-style utility workflow is part of the intended frontend approach; current implementation is primarily via `app/globals.css`

### Backend

- Next.js API routes (`app/api/*`)
- Prisma ORM
- structured logging (`lib/logger.ts`)
- environment validation and startup checks (`lib/env.ts`)

### Storage

- SQLite for local development
- Neon PostgreSQL for production/staging workflows
- Vercel Blob for admin evidence image storage

### Infrastructure

- Vercel hosting/runtime
- Neon database infrastructure
- Vercel Blob object storage

---

## 3. Architecture Overview

### Public lookup flow

```text
User input (VIN/plate/chassis)
  -> POST /api/v1/lookup
    -> Local DB lookup first (Prisma)
      -> If found: local record response (/vehicles/[id])
      -> If not found and input is 17-char VIN: NHTSA decode fallback (/decoded)
      -> Else: no-local-record error UX
```

### Admin workflow

```text
Admin login (/admin/login)
  -> session cookie (or Bearer/X-Admin-Key)
  -> protected /admin routes + /api/admin/*
  -> dashboard (summary, data health, VIN/plate/chassis search) -> manage vehicle -> add events/photos
```

**Dashboard data health (Phase 18.1):** `getAdminDataHealth()` in `lib/admin-dashboard.ts` reports vehicle/event/photo totals, vehicles with plate or chassis populated, and published/draft/archived evidence counts (sum of `VehicleEvent` + `VehiclePhoto` by `status`). Vehicle search uses server-side `contains` filters on `vin`, `plateNumber`, and `chassisNumber` via `/admin?q=`.

**CSV import quality (Phase 18.2):** `ingestVehicleEventsCsv()` runs `detectImportDuplicates()` before commit (warnings only), returns `report` + `quality` in the API JSON, and appends successful runs to `prisma/data/import-history.json`. See [`docs/data_acquisition_and_import_quality.md`](data_acquisition_and_import_quality.md).

**Event idempotency + preview (Phase 19):** `planEventIdempotency()` skips duplicate events by fingerprint; `mode=preview` performs zero writes; `mode=commit` inserts only new events and audits creates. Import history excludes preview runs. See [`docs/event_idempotency_and_import_preview.md`](event_idempotency_and_import_preview.md).

**Vehicle Trust Score (Phase 20):** `calculateVehicleTrustScore()` in `lib/vehicle-trust-score.ts` produces an explainable 0–100 score from published evidence completeness, confidence/provenance, and risk signals. Shown on public reports and admin manage pages. See [`docs/vehicle_trust_score.md`](vehicle_trust_score.md).

### Upload flow

```text
Admin picks image -> POST /api/admin/uploads (multipart)
  -> auth check
  -> MIME + size + filename validation
  -> put() to Vercel Blob path vehicle-evidence/{vehicleId}/{timestamp}-{filename}
  -> returns public URL
  -> URL stored as VehiclePhoto via /api/admin/vehicles/[id]/photos
```

### Evidence rendering flow

```text
Vehicle page query includes photos + events
  -> render gallery/timeline
  -> render provenance + confidence badges per item
  -> show trust explanation block under visual evidence
```

### Neon + Blob relationship

- Neon stores metadata (`VehiclePhoto.url`, provenance/confidence, events).
- Blob stores binary image objects.
- Public report reads URL from Neon and serves image directly from Blob CDN URL.

### Prisma client generation strategy

- SQLite client: `npm run db:generate`
- PostgreSQL client: `npm run db:generate:postgres`
- Vercel build generates PostgreSQL client using `schema.postgresql.prisma`

### Why SQLite and PostgreSQL schemas are separated

Prisma client generation is provider-bound. SQLite and PostgreSQL require different datasource providers at build/generate time, so both schema files are maintained in parallel.

---

## 4. Environment Model

### Modes

| Mode | Database behavior | Typical use |
|---|---|---|
| Local SQLite mode | `schema.prisma` + `prisma/dev.db` | Default local development |
| Neon PostgreSQL mode | `schema.postgresql.prisma` + `DATABASE_URL=postgres...` | Staging/prod-like workflows |
| Vercel production mode | Postgres client generation at build/runtime | Hosted production |

### Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Selects PostgreSQL target when using `postgres://`/`postgresql://` |
| `BLOB_READ_WRITE_TOKEN` | Required for admin image upload route |
| `ADMIN_API_KEY` / `ADMIN_PASSWORD` | Admin authentication |
| `VERCEL` | Build/runtime mode flag in hosted environment |

### `DATABASE_URL` behavior

- If PostgreSQL protocol is detected, app/seed use PostgreSQL path.
- Otherwise local development falls back to SQLite file path.
- `db:seed` is SQLite-oriented; `db:seed:postgres` is mandatory for Neon seeding.

### Env validation system

`lib/env.ts` centralizes runtime checks and supports safer startup diagnostics and health reporting.

### Why `.env.example` exists

It provides a safe template for required variables and prevents guesswork when onboarding.

### Why real `.env` must never be committed

It can contain secrets (`ADMIN_API_KEY`, Blob token, connection strings). Committing it is a direct security risk.

---

## 5. Important Commands

### Local SQLite workflow

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

### Neon PostgreSQL workflow

```bash
export DATABASE_URL="postgresql://..."
npm run db:generate:postgres
npm run db:migrate:postgres
npm run db:seed:postgres
npm run dev
```

### Runtime recovery workflow

```bash
rm -rf .next
rm -rf node_modules/.prisma
npm run db:generate:postgres
npm run dev
```

### Build/testing

```bash
npm run lint
npm run build
```

### Git workflow

```bash
git status
git add .
git commit
git push origin main
```

---

## 6. Current Major Features

### Public

- VIN lookup
- Plate/chassis support
- External VIN decoding fallback
- Visual evidence gallery
- Timeline events
- Provenance badges
- Confidence badges
- Improved error UX
- `/api/health` endpoint

### Admin

- Admin login/session
- CSV ingestion
- Vehicle management page
- Add photos
- Add events
- Blob uploads
- Provenance/confidence assignment
- Evidence edit and archive (soft delete)
- Moderation status controls (`DRAFT`/`REVIEWED`/`PUBLISHED`/`REJECTED`/`ARCHIVED`)
- Recent admin activity feed on manage page

---

## 7. Current Data Model

### Core entities

| Model | Purpose |
|---|---|
| `Vehicle` | Canonical record for identity/specs/import context |
| `VehiclePhoto` | Visual evidence URL + metadata + trust indicators |
| `VehicleEvent` | Timeline evidence event + metadata + trust indicators |

### Trust enums

| Enum | Values |
|---|---|
| `ConfidenceLevel` | `LOW`, `MEDIUM`, `HIGH`, `VERIFIED` |
| `ProvenanceType` | `DEMO`, `USER_SUBMITTED`, `DEALER`, `IMPORTER`, `AUCTION`, `INTERNAL`, `GOVERNMENT`, `INSURER`, `POLICE`, `OTHER` |

### Trust philosophy guardrails

- `VERIFIED` does **not** mean legally certified by the state.
- Provenance is **not** equivalent to factual truth.
- Confidence reflects evidence trust level, not court-grade certainty.
- UI and docs should avoid defamatory or accusatory language.

---

## 8. Production Infrastructure

### Vercel deployment flow

1. Code pushed to repository
2. Vercel runs production build script
3. Postgres Prisma client generated in build
4. Next.js build produced and deployed

### Neon migration workflow

Migrations are applied manually via:

```bash
npm run db:migrate:postgres
```

### Why `prisma migrate deploy` is NOT run in Vercel build

To avoid advisory lock contention and deployment instability (especially Neon lock timeout scenarios). Decoupling migration from build improves reliability.

### Manual migration workflow

```bash
npm run db:generate:postgres
npm run db:migrate:postgres
```

### Manual seed workflow

```bash
npm run db:seed:postgres
```

### Blob setup workflow

1. Create/connect Vercel Blob store
2. Set `BLOB_READ_WRITE_TOKEN`
3. Use `/api/admin/uploads` to store evidence images
4. Save returned URL into `VehiclePhoto`

### Production env requirements

- `DATABASE_URL`
- `ADMIN_API_KEY` or `ADMIN_PASSWORD`
- `BLOB_READ_WRITE_TOKEN` (if uploads required)

---

## 9. Health & Diagnostics

### Endpoint

- `GET /api/health`

### Expected response (high-level)

- service status
- environment mode
- database connectivity check
- blob configuration status
- timestamp/version metadata

### Diagnostic layers

- Structured logging for operational events/errors
- Environment validation to surface misconfiguration early
- Production-safe error responses (avoid leaking sensitive internals)

### What health should confirm

- database connected
- blob configured (or explicitly missing)
- environment mode recognized (local vs hosted)

---

## 10. Major Debugging History

### SQLite/Postgres Prisma mismatch

- **Symptoms:** seed/build behavior inconsistent between local and Neon
- **Root cause:** provider/schema mismatch and command misuse
- **Fix:** dual schema strategy + explicit postgres scripts
- **Prevention:** always use `db:seed:postgres` for Neon

### Neon `photo_count` issue

- **Symptoms:** reports rendered but no photo cards in production
- **Root cause:** seeding wrong database or no `vehicle_photos` rows in Neon
- **Fix:** seed against correct `DATABASE_URL`, verify SQL counts
- **Prevention:** use Neon runbook and `[seed] database:` log check

### Stale `.next` runtime cache

- **Symptoms:** behavior/code changes not reflected accurately
- **Root cause:** stale build artifacts
- **Fix:** clear `.next` and regenerate client
- **Prevention:** use runtime recovery workflow during environment drift

### Blob token missing

- **Symptoms:** upload API returns config error
- **Root cause:** `BLOB_READ_WRITE_TOKEN` unset
- **Fix:** set token in local/Vercel env
- **Prevention:** include token in deployment checklist

### `type="url"` vs `type="text"`

- **Symptoms:** browser rejected valid relative demo paths
- **Root cause:** HTML URL input strictness
- **Fix:** switched to `type="text"` while backend validation enforces allowed prefixes
- **Prevention:** avoid client validators that conflict with accepted backend formats

### Windows Prisma EPERM lock

- **Symptoms:** `prisma generate` rename EPERM on query engine DLL
- **Root cause:** file lock by running dev process/OS scanner
- **Fix:** stop dev server, rerun generate
- **Prevention:** regenerate when process lock is released

### Linux `tsc` missing

- **Symptoms:** lint/typecheck failure in environment without dependencies
- **Root cause:** node_modules/dev dependencies missing
- **Fix:** `npm install` before lint
- **Prevention:** treat dependency install as required first-step in fresh environments

### Node version warning

- **Symptoms:** tooling/runtime warnings or incompatibility hints
- **Root cause:** non-target Node version
- **Fix:** align to Node 20+ LTS
- **Prevention:** enforce runtime version in team onboarding docs

### Production build verification

- **Symptoms:** uncertainty about deploy readiness
- **Root cause:** environment drift and schema generation ambiguity
- **Fix:** standardized `npm run build` + production runbooks + health endpoint checks
- **Prevention:** pre-release checklist and build log discipline

---

## 11. Important Existing Docs

| Document | Purpose |
|---|---|
| `docs/postgresql.md` | Dual-schema and PostgreSQL operational workflow |
| `docs/debugging_neon_seed_photos.md` | Neon seeding/photo diagnostics runbook |
| `docs/debugging_runtime_and_environment.md` | Runtime/env troubleshooting and recovery |
| `docs/vercel_blob_setup.md` | Blob setup and upload workflow |
| `docs/admin_record_management.md` | Admin vehicle operations (events/photos) |
| `docs/production_deployment.md` | End-to-end production deployment runbook |
| `docs/production_checklist.md` | Pre-release and cutover checklist |
| `docs/evidence_confidence_and_provenance.md` | Trust model and badge semantics |
| `docs/evidence_lifecycle_management.md` | Moderation lifecycle, soft delete rules, audit logging |
| `docs/public_trust_and_transparency.md` | Public trust UX, transparency principles, verification limits |
| `docs/data_acquisition_and_import_quality.md` | CSV ingest, shared event write path, import quality principles |
| `docs/architecture_decisions.md` | ADRs — why key design choices were made (shared write path, lifecycle, trust score, duplicates, import history) |

For decision context beyond current system diagrams, start with [`architecture_decisions.md`](architecture_decisions.md) (ADR-001 through ADR-007 cover Phases 16–20 foundations).

---

## 12. Current Demo VINs

### Toyota — `4T1BE46K37U123456`

Demonstrates:

- import/registration/service timeline depth
- importer/internal provenance examples
- low-confidence demo evidence handling

### VW — `WVWZZZ3CZWE123456`

Demonstrates:

- accident/repair narrative visibility
- salvage/rebuild awareness style use case
- evidence with non-official source framing

### Honda — `1HGBH41JXMN109186`

Demonstrates:

- auction/import intelligence path
- imported vehicle storyline with source labels
- VIN/chassis lookup support when plate is absent

---

## 13. Current Limitations

- no official DVLA integration
- no insurer integration
- no advanced moderation queue yet (review workflow is basic)
- no audit history yet
- no public submission moderation yet
- demo/sample evidence still exists
- no automated confidence scoring
- no fraud scoring yet

---

## 14. Recommended Next Milestones

1. Production verification
2. Evidence management (edit/delete/moderation)
3. Audit logging
4. Mobile optimization
5. Bulk ingestion workflows
6. Dealer workflows
7. Insurance workflows
8. Public submissions
9. Fraud/risk scoring
10. Official integrations

---

## 15. Recovery Checklist

Fresh clone recovery path:

1. Install dependencies (`npm install`)
2. Configure env from `.env.example` (`ADMIN_API_KEY`/`ADMIN_PASSWORD`; optional Blob token)
3. Generate Prisma client (`npm run db:generate`)
4. Setup DB (`npm run db:push && npm run db:seed`)
5. Verify health endpoint (`/api/health`)
6. Test lookup (Toyota VIN and unknown VIN fallback)
7. Test admin login (`/admin/login`)
8. Test upload flow (if Blob token configured)
9. Test public evidence rendering (`/vehicles/[id]`)

Neon production sanity:

1. Set `DATABASE_URL`
2. Run `db:generate:postgres`, `db:migrate:postgres`, `db:seed:postgres`
3. Verify health and lookup behavior

---

## 16. Recommended Future Chat Context

Use this context seed in future ChatGPT/Cursor sessions:

```text
GhanaCarSpecs is a Next.js App Router + TypeScript vehicle trust platform for Ghana with local SQLite dev and Neon PostgreSQL production. Public lookup uses local-first VIN/plate/chassis matching with NHTSA VIN fallback for unknown 17-char VINs. Admin routes are protected by ADMIN_API_KEY/ADMIN_PASSWORD and support CSV ingest, event/photo creation, and Vercel Blob uploads. VehiclePhoto and VehicleEvent include provenance and confidence metadata; badges are rendered publicly to communicate trust level. Use db:seed for SQLite and db:seed:postgres for Neon. Vercel build generates Postgres Prisma client but does not run migrate deploy; migrations are manual via db:migrate:postgres. Core runbooks: docs/postgresql.md, docs/debugging_neon_seed_photos.md, docs/debugging_runtime_and_environment.md, docs/vercel_blob_setup.md, docs/project_handoff_master.md.
```

---

## 17. Operational Philosophy

1. Prioritize trust over hype
2. Avoid false accusations and unsupported claims
3. Evidence must be attributable and source-labeled
4. Provenance matters for decision context
5. Operational stability comes before aggressive scaling
6. Documentation is part of engineering, not an afterthought

This philosophy governs feature scope, language, and release discipline.

---

## Handoff Revision History

| Date | Version / Phase | Summary | Verification |
|---|---|---|---|
| 2026-05-28 | Production hardening + operational documentation | Added production diagnostics, health endpoint, structured logging, runtime/environment debugging documentation, and comprehensive project handoff architecture reference. | `npm run lint` passed; `npm run build` passed. |

Future sessions should append to this table instead of rewriting the whole handoff document unless the architecture changes significantly.
