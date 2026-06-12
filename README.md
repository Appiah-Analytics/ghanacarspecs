# GhanaCarSpecs (local MVP + VIN decode fallback + CSV ingestion)

Ghana vehicle **trust and verification** platform built with Next.js, **Prisma**, and **SQLite**. Search by **plate number**, **chassis number**, or **VIN** to view available specifications, history signals, risk indicators, and evidence on local records. **Local database is always tried first.** If there is no local row and the input is a **17-character VIN**, the app calls the free **NHTSA vPIC** API (US DOT) and shows decoded specifications on a separate page, clearly labeled as an **external** decode. Public pages include audience messaging and a future-focused [`/partners`](http://localhost:3000/partners) page (no intake forms). Local admins can import vehicle/event rows from CSV, **manage individual vehicles** (add events and visual evidence URLs), and view records on an **admin dashboard**.

Canonical test values: [`docs/sample_data.md`](docs/sample_data.md).

## Prerequisites

- [Node.js](https://nodejs.org/) **20+** (LTS recommended)
- npm (bundled with Node)
- **Outbound HTTPS** to `vpic.nhtsa.dot.gov` when testing external VIN decode (no API key required)

## Setup (first run)

From the repository root:

```bash
npm install
cp .env.example .env
# Edit .env: set ADMIN_API_KEY or ADMIN_PASSWORD (required for /admin routes)
npm run db:setup
```

`db:setup` runs `prisma db push` (creates/updates `prisma/dev.db`) and `prisma db seed` (sample vehicles and events).

**Admin access:** Set `ADMIN_API_KEY` or `ADMIN_PASSWORD` in `.env`, restart the dev server, then open `/admin/login`. Public lookup (`/` and `POST /api/v1/lookup`) does not require admin credentials.

### Admin env not loading?

1. **File location:** `.env` must live at the **repo root** (same folder as `package.json`), not under `app/` or `prisma/`.
2. **Uncommented:** `ADMIN_API_KEY=...` must be a real line — not `# ADMIN_API_KEY=...` (a commented copy of `.env.example` is ignored).
3. **Restart:** Stop and restart `npm run dev` after editing `.env` (middleware inlines env at compile time).
4. **Check:** Open `/admin/login` — the **Env check** box shows whether the server sees `ADMIN_API_KEY` / `ADMIN_PASSWORD` (never the secret value).

## Run the app

```bash
npm run dev
```

Open the URL shown in the terminal (often `http://localhost:3000`; if port 3000 is busy, Next may use **3001**).

`npm run dev` uses **Turbopack**. Wait until you see **`Ready in …ms`**, then open the site.

### Dev server stuck on `Starting...`

That message appears **before** Next finishes compiling. On a slow disk, antivirus scan, or **OneDrive**, the first boot can take **several minutes**.

1. **Wait** 5–15 minutes on the first run; if `node.exe` uses CPU in Task Manager, it is still working.
2. Delete the **`.next`** folder and run `npm run dev` again.
3. Try **`npm run dev:webpack`** if Turbopack misbehaves.
4. For OneDrive paths: `$env:WATCHPACK_POLLING="1"; npm run dev`
5. Prefer cloning to a folder **outside OneDrive** (e.g. `C:\dev\ghanacarspecs`) for faster file I/O.

## Test flows

### A. Local GhanaCarSpecs record (database)

Use any seeded **VIN**, **plate**, or **chassis** from [`docs/sample_data.md`](docs/sample_data.md) (lookup uses the local DB only; no external call). The homepage explains **where to find a VIN or chassis number** on the vehicle or on Ghana paperwork.

| Vehicle | VIN | Plate | Chassis |
|--------|-----|-------|---------|
| Toyota Camry 2007 | `4T1BE46K37U123456` | `GR-1234-21` | `BE46K37U123456` |
| Volkswagen Golf 2014 | `WVWZZZ3CZWE123456` | `GT 5678-22` | `ZZZ3CZWE123456` |
| Honda Accord 1991 | `1HGBH41JXMN109186` | *(none)* | `BH41JXMN109186` |

Look up any seeded vehicle by **VIN**, **plate**, or **chassis** (spacing/case ignored for plate and chassis).

**Expected:** Redirect to `/vehicles/{id}` with a green banner **Local GhanaCarSpecs record**, **Report Reference** (e.g. `GCS-4T1BE46K37U123456`), **Executive summary**, **Trust score**, **Vehicle risk profile**, full specs, **Vehicle intelligence**, visual evidence, event timeline, and **Compare this vehicle** / **Print report** / **Download PDF** / **Copy report link** actions.

### A1b. Print a local vehicle report

From any public report, open **Print report** or go directly to `/vehicles/{id}/print`.

**Expected:** Document-style layout with **Report Reference**, executive summary, trust/risk scores, specs, event table, and disclaimer. **Print report** opens the browser print dialog (save as PDF supported). **Download PDF** fetches a server-generated file. **Copy report link** copies the print page URL. Site header/footer hidden on the print route.

### A1c. Download a vehicle report PDF

From any public report or admin manage page, click **Download PDF**, or open:

`/api/vehicles/{id}/export/pdf`

**Expected:** Browser downloads `ghanacarspecs-{VIN}.pdf` with the same core sections as the print view. Returns `404` for unknown vehicles.

### A2. Compare two local vehicles

Open [`/compare`](http://localhost:3000/compare) or use query params:

`/compare?a=4T1BE46K37U123456&b=WVWZZZ3CZWE123456`

**Expected:** Side-by-side columns with trust/risk scores, evidence counts, and a cautious comparison summary. Toyota (A) should show higher trust and lower risk than VW (B); VW accident count visible.

### B. External VIN decoded record (NHTSA vPIC)

Use a **valid 17-character VIN** that is **not** in the seed list above (any real VIN NHTSA can decode works).

Example (not in seed data — see [`docs/sample_data.md`](docs/sample_data.md)):

`1HGCM82633A004352`

**Expected:** After submit, redirect to `/decoded` with a blue banner **External VIN decoded record**, decoded specifications from NHTSA vPIC, and an empty event-history note (no local GhanaCarSpecs rows). Only **17-character VINs** use this fallback; plates and chassis numbers do not.

### C. No local record (real or demo identifier)

Use a plate not in the sample database, for example `GR-9999-99` or `XX-0000-00`.

**Expected:** Orange alert titled **No local GhanaCarSpecs record found yet** with copy explaining the demo database only — not DVLA, insurer, police, garage, or official Ghana records. Real Ghana plates or chassis numbers not in the demo are not a claim that the vehicle has no history.

Plates and chassis numbers do **not** trigger the external VIN API. Only valid **17-character VINs** may fall back to NHTSA vPIC.

### D. External decode failure

Use this 17-character VIN (not in the seed database):

`00000000000000000`

**Expected:** Red error titled **VIN could not be decoded** (HTTP **502**) explaining no local record and that NHTSA vPIC did not return usable data. Server `detail` is for debugging only.

### E. Local admin dashboard

1. Ensure `.env` has `ADMIN_API_KEY` or `ADMIN_PASSWORD` and restart `npm run dev`.
2. Open `http://localhost:3000/admin/login`, enter the same secret, then visit the dashboard.

```text
http://localhost:3000/admin
```

**Expected:** Summary cards, a **Data health** panel (record totals and evidence lifecycle counts), server-side search by VIN/plate/chassis (`?q=`), and a vehicle table with **Manage** and **View report** links. Unauthenticated requests redirect to `/admin/login`.

### F. Admin vehicle management (Phase 12)

1. Sign in at `/admin/login`.
2. On the dashboard, click **Manage** for a seeded vehicle (or one created via CSV).
3. Add a visual evidence URL (e.g. `/demo-photos/toyota-inspection-walkaround.svg`) and one timeline event.
4. Open **Public report** and confirm the new photo and event appear.

See [`docs/admin_record_management.md`](docs/admin_record_management.md).

### G. Local CSV ingestion

Sign in at `/admin/login` first, then open:

```text
http://localhost:3000/admin/ingest
```

**API / curl:** Send the secret as `Authorization: Bearer <ADMIN_API_KEY>` or `X-Admin-Key: <secret>` on `POST /api/admin/ingest`.

If Next is running on another port, use that port instead (for example `http://localhost:3001/admin/ingest`).

Upload a `.csv` file using this template:

```csv
vin,plateNumber,chassisNumber,make,model,year,eventType,eventDate,mileage,sourceSystem,description
JTDKN3DU0A0123456,GR-9000-24,JTDKN3DU0A0123456,Toyota,Prius,2010,IMPORT,2024-01-12,87000,Tema Port,Imported from Japan
JTDKN3DU0A0123456,GR-9000-24,JTDKN3DU0A0123456,Toyota,Prius,2010,SERVICE,2024-05-03,90120,Accra Hybrid Care,Hybrid battery inspected
```

**Expected:** **Preview import** first (no DB writes), then **Commit import** after review. The page shows import summary (rows, vehicles to create/update, events to insert/skip, duplicate events skipped), quality score, warnings, and **recent import history** (committed imports only). Hard validation errors block commit; duplicate plate/chassis and duplicate events are warnings/skips only.

Then test the imported record from the frontend lookup:

```text
JTDKN3DU0A0123456
```

or:

```text
GR-9000-24
```

You should see a **Local GhanaCarSpecs record** with the imported vehicle specs and event timeline.

#### CSV validation rules

- Required columns: `vin`, `make`, `model`, `year`, `eventType`, `eventDate`
- Optional columns: `plateNumber`, `chassisNumber`, `mileage`, `sourceSystem`, `description`
- VIN must be exactly 17 characters.
- `eventType` must be one of: `IMPORT`, `REGISTRATION`, `SERVICE`, `ACCIDENT`, `INSURANCE_CLAIM`, `MILEAGE_UPDATE`, `THEFT`, `OTHER`
- `eventDate` must be a valid date, for example `2024-05-03`.
- `mileage` is optional, but when present must be a whole number.
- If the same VIN appears in multiple rows, `make`, `model`, `year`, and non-empty `plateNumber` must not conflict.
- Validation is all-or-nothing for **errors**: if any row has a hard error, no database records are written.
- Duplicate VIN (already in DB), plate, or chassis matches produce **warnings**; commit still runs when there are no errors.
- Duplicate events (same fingerprint in DB or file) are **skipped** on commit; re-uploading the same CSV does not duplicate events.
- Use **Preview import** before **Commit import** (`mode=preview` / `mode=commit` on `POST /api/admin/ingest`).

Example conflict to test validation:

```csv
vin,plateNumber,make,model,year,eventType,eventDate,mileage,sourceSystem,description
JTDKN3DU0A0123456,GR-9000-24,Toyota,Prius,2010,IMPORT,2024-01-12,87000,Tema Port,Imported from Japan
JTDKN3DU0A0123456,GR-9000-24,Honda,Prius,2010,SERVICE,2024-05-03,90120,Accra Hybrid Care,Make should conflict
```

**Expected:** The upload page shows row-level validation errors and imports nothing from that file.

## Test the lookup API (curl)

**Local (seeded Toyota):**

```bash
curl -s -X POST "http://localhost:3000/api/v1/lookup" ^
  -H "Content-Type: application/json" ^
  -d "{\"vinOrPlate\":\"4T1BE46K37U123456\"}"
```

Response includes `"recordSource":"local"` and `"recordSourceLabel":"Local GhanaCarSpecs record"`.

**External (example BMW VIN, not seeded):**

```bash
curl -s -X POST "http://localhost:3000/api/v1/lookup" ^
  -H "Content-Type: application/json" ^
  -d "{\"vinOrPlate\":\"1HGCM82633A004352\"}"
```

Response includes `"recordSource":"external"`, `"recordSourceLabel":"External VIN decoded record"`, `"dataProvider":"NHTSA vPIC"`, and a `decoded` object.

On macOS/Linux, use `\` line breaks or a single-line `curl` with single-quoted JSON.

## Health endpoint

Use this endpoint for runtime diagnostics:

```bash
curl -s "http://localhost:3000/api/health"
```

It returns deployment environment, database status, blob configuration status, timestamp, and app version.

## Scripts

| Command | Description |
| -------- | ----------- |
| `npm run dev` | Next.js dev server (Turbopack) |
| `npm run dev:webpack` | Dev server (Webpack fallback) |
| `npm run build` | Production build (SQLite client locally; PostgreSQL on Vercel via `VERCEL=1`) |
| `npm run build:local` | `db:generate` (SQLite) then `next build` — test production bundle locally |
| `npm run vercel-build` | Vercel build: postgres `prisma generate` + `next build` (no migrate during build) |
| `npm run start` | Production server (after `build`) |
| `npm run lint` | Typecheck (`tsc --noEmit`) |
| `npm run db:push` | Apply Prisma schema to SQLite |
| `npm run db:seed` | Reseed sample data (SQLite schema — local only) |
| `npm run db:setup` | `db:push` then `db:seed` (SQLite — default) |
| `npm run db:generate:postgres` | Generate Prisma client for PostgreSQL |
| `npm run db:migrate:postgres` | Apply PostgreSQL migrations (requires `DATABASE_URL`) |
| `npm run db:seed:postgres` | Reseed sample data on PostgreSQL (requires `DATABASE_URL`) |
| `npm run db:setup:postgres` | Postgres generate + migrate + seed (staging/production) |
| `npm run db:export:sqlite` | Export SQLite data to JSON |
| `npm run report:docx` | Regenerate Word progress report in `docs/` |

## Deployment overview

- Production env validation and startup safeguards are implemented in `lib/env.ts`.
- Runtime deployment diagnostics are available at `GET /api/health`.
- Follow [`docs/production_deployment.md`](docs/production_deployment.md) for local, Neon, and Vercel workflow.
- Use [`docs/production_checklist.md`](docs/production_checklist.md) before production release.
- Use [`docs/debugging_runtime_and_environment.md`](docs/debugging_runtime_and_environment.md) for fast runtime/env recovery.

## Project layout (main pieces)

- `app/page.tsx` — Home + lookup form  
- `app/vehicles/[id]/page.tsx` — Local vehicle report (specs, visual evidence, events)  
- `components/VehiclePhotos.tsx` — Sample photo gallery with provenance/confidence badges  
- `components/EvidenceBadges.tsx` — Provenance and confidence badges on reports  
- `lib/evidence-metadata.ts` — Badge labels and styling helpers  
- `app/decoded/page.tsx` — External NHTSA decode report (fed via `sessionStorage` after lookup)  
- `app/admin/page.tsx` — Local admin dashboard (summary, data health, search, vehicle table)  
- `app/admin/ingest/page.tsx` — Local admin CSV upload page  
- `app/admin/vehicles/[id]/page.tsx` — Manage vehicle (add events, photo URLs)  
- `lib/admin-dashboard.ts` — Admin summary, data health counts, searchable vehicle list  
- `lib/admin-auth.ts` — Admin secret verification and session cookie  
- `middleware.ts` — Protects `/admin` and `/api/admin/*`  
- `app/admin/login/page.tsx` — Admin sign-in  
- `app/api/v1/lookup/route.ts` — `POST` JSON `{ "vinOrPlate": "..." }`  
- `app/api/admin/ingest/route.ts` — CSV upload API (`multipart/form-data`)  
- `app/api/admin/vehicles/[id]/photos/route.ts` — Add `VehiclePhoto` (admin)  
- `app/api/admin/uploads/route.ts` — Admin image upload to Vercel Blob  
- `app/api/admin/vehicles/[id]/events/route.ts` — Add `VehicleEvent` (admin)  
- `lib/admin-upload.ts` — Upload validation and filename sanitization  
- `lib/csv-ingest.ts` — CSV parsing, validation, vehicle upsert, event insert (via `lib/vehicle-event-write.ts`)
- `lib/duplicate-detection.ts` — CSV/DB duplicate warnings (VIN, plate, chassis)
- `lib/import-validation.ts` — structured import report (`rowsProcessed`, `imported`, `skipped`, warnings, errors)
- `lib/import-quality-score.ts` — 0–100 import quality score and status label
- `lib/import-history.ts` — append/read recent imports (`prisma/data/import-history.json`)
- `lib/event-idempotency.ts` — event fingerprint and duplicate skip planning
- `docs/event_idempotency_and_import_preview.md` — preview/commit workflow and idempotency rules
- `lib/vehicle-event-write.ts` — shared VehicleEvent create + audit (admin UI and CSV ingest)  
- `lib/vehicle-intelligence.ts` — Risk/intelligence signals from local events  
- `lib/vehicle-trust-score.ts` — Explainable 0–100 vehicle trust score (published evidence only)
- `lib/vehicle-risk-profile.ts` — Explainable 0–100 vehicle risk profile (higher = more concern)
- `lib/vehicle-report-bundle.ts` — Shared trust/risk/intelligence derivations for reports
- `lib/vehicle-executive-summary.ts` — One-glance executive summary builder
- `lib/vehicle-comparison.ts` — Comparison snapshot builder
- `lib/resolve-vehicle-comparison.ts` — Resolve identifier to comparison snapshot
- `lib/vehicle-comparison-interpret.ts` — Cautious comparison summary lines
- `lib/report-export-summary.ts` — Plain export summary object (no PDF yet)
- `app/compare/page.tsx` — Side-by-side vehicle comparison page
- `components/VehicleComparison.tsx` — Comparison columns and interpretation
- `components/VehicleComparisonForm.tsx` — Compare form (Vehicle A / B)
- `components/VehicleTrustScore.tsx` — Trust score panel on public reports and admin manage page
- `components/VehicleRiskProfile.tsx` — Risk profile panel on public reports and admin manage page
- `components/VehicleExecutiveSummary.tsx` — Executive summary panel on public reports and admin manage page
- `lib/lookup.ts` — Local VIN/plate resolution + orchestration with external fallback  
- `lib/nhtsa-vin.ts` — NHTSA vPIC client  
- `lib/record-source.ts` — Human-readable source labels  
- `prisma/schema.prisma` — SQLite schema (local default)  
- `prisma/schema.postgresql.prisma` — PostgreSQL schema (Vercel / Neon production)  
- `vercel.json` — Vercel build command (`vercel-build`)  
- `prisma/seed.ts` — Sample data (vehicles, events, demo photos)  
- `public/demo-photos/` — SVG placeholders for seeded visual evidence (not real private photos)  

### Vehicle photos (demo)

Local reports include a **Visual evidence** section when the database has `VehiclePhoto` rows. Each photo and timeline event shows **provenance** (e.g. importer, auction, internal) and **confidence** (LOW through VERIFIED) badges so users can judge trust at a glance. Seeded examples use placeholder SVGs — **not** DVLA, police, insurer, or official Ghana records unless a future integration says otherwise. Admins **upload images** (Vercel Blob) or paste URLs on `/admin/vehicles/[id]`, then set provenance and confidence before save. See [`docs/evidence_confidence_and_provenance.md`](docs/evidence_confidence_and_provenance.md) and [`docs/vercel_blob_setup.md`](docs/vercel_blob_setup.md).

After pulling schema changes (including `VehiclePhoto`):

```bash
npm run db:generate
# Local SQLite
npm run db:push
npm run db:seed
```

Restart `npm run dev` after `db:generate` so the Prisma client includes the `photos` relation. Open a vehicle from a **fresh lookup** (IDs change after re-seed).

**Local SQLite (default):** leave `DATABASE_URL` unset — use `npm run db:seed` (SQLite schema). **Neon:** set `DATABASE_URL` to a `postgresql://…` string, then use the PostgreSQL scripts (not `db:seed`). See `.env.example`.

```bash
# Neon / production (manual — not run on Vercel build)
npm run db:generate:postgres
npm run db:migrate:postgres
npm run db:seed:postgres
```

The seed log should show `postgresql://…` (masked), not `file:…/dev.db`.

### Vercel + Neon deploy

For production seed debugging (empty Visual evidence, `photo_count`, wrong database), see [`docs/debugging_neon_seed_photos.md`](docs/debugging_neon_seed_photos.md).

Vercel runs **`prisma generate`** (PostgreSQL schema) and **`next build`** only. It does **not** run `prisma migrate deploy` during build (avoids advisory-lock timeouts on Neon).

When the schema changes, run migrations **manually before or after deploy**:

```bash
npm run db:generate:postgres
npm run db:migrate:postgres
npm run db:seed:postgres   # optional — demo rows only
```

See [`docs/postgresql.md`](docs/postgresql.md) for the full dual-schema workflow.

## Documentation

| Doc | Purpose |
|-----|---------|
| [`docs/roadmap.md`](docs/roadmap.md) | Phases 1–7 (delivery order) |
| [`docs/build_log.md`](docs/build_log.md) | Engineering history per phase |
| [`docs/architecture.md`](docs/architecture.md) | Current system design |
| [`docs/architecture_decisions.md`](docs/architecture_decisions.md) | Architecture Decision Records (why key designs were chosen) |
| [`docs/deployment_plan.md`](docs/deployment_plan.md) | Production readiness (not deployed yet) |
| [`docs/postgresql.md`](docs/postgresql.md) | SQLite → PostgreSQL dual-schema guide (Phase 9) |
| [`docs/debugging_neon_seed_photos.md`](docs/debugging_neon_seed_photos.md) | Neon production seed & VehiclePhoto runbook |
| [`docs/admin_record_management.md`](docs/admin_record_management.md) | Admin manage page: events & visual evidence URLs |
| [`docs/evidence_confidence_and_provenance.md`](docs/evidence_confidence_and_provenance.md) | Trust model, enums, badges, future official feeds |
| [`docs/public_trust_and_transparency.md`](docs/public_trust_and_transparency.md) | Public trust UX, confidence/provenance help, verification limits |
| [`docs/vehicle_trust_score.md`](docs/vehicle_trust_score.md) | Vehicle Trust Score formula, bands, limitations |
| [`docs/vehicle_risk_profile.md`](docs/vehicle_risk_profile.md) | Vehicle Risk Profile, trust vs risk separation, limitations |
| [`docs/report_presentation_and_comparison_foundation.md`](docs/report_presentation_and_comparison_foundation.md) | Executive summary, report order, comparison/export foundation |
| [`docs/vehicle_comparison_ui.md`](docs/vehicle_comparison_ui.md) | Side-by-side comparison page, fields, limitations |
| [`docs/data_acquisition_and_import_quality.md`](docs/data_acquisition_and_import_quality.md) | CSV ingest, shared event write path, import quality |
| [`docs/event_idempotency_and_import_preview.md`](docs/event_idempotency_and_import_preview.md) | Event fingerprint, preview/commit, idempotent re-import |
| [`docs/vercel_blob_setup.md`](docs/vercel_blob_setup.md) | Blob store + `BLOB_READ_WRITE_TOKEN` for admin uploads |
| [`docs/evidence_lifecycle_management.md`](docs/evidence_lifecycle_management.md) | Moderation states, soft delete rules, public visibility filters, audit logging |
| [`docs/project_handoff_master.md`](docs/project_handoff_master.md) | Primary operational memory: architecture, workflows, debugging, deployment, roadmap |
| [`docs/public_demo_plan.md`](docs/public_demo_plan.md) | Public demo scope and Vercel/Neon deploy checklist (not deployed) |
| [`docs/production_deployment.md`](docs/production_deployment.md) | Production deployment runbook (env, Neon, Vercel, health, rollback) |
| [`docs/production_checklist.md`](docs/production_checklist.md) | Release readiness checklist for production cutover |
| [`docs/debugging_runtime_and_environment.md`](docs/debugging_runtime_and_environment.md) | Runtime and environment debugging lessons and recovery checklist |
| [`docs/sample_data.md`](docs/sample_data.md) | Canonical VINs, plates, chassis for QA |
| [`docs/project.md`](docs/project.md) | Scope and MVP definition |

Copy [`.env.example`](.env.example) to `.env`. **Admin routes require** `ADMIN_API_KEY` or `ADMIN_PASSWORD` (see Phase 8 in the roadmap).

## Out of scope (not implemented)

Azure hosting, Terraform, payments, per-user accounts, OAuth, dealer/partner dashboards, and automated production ingestion. Admin uses a **single shared secret** (not user accounts). Image upload requires Vercel Blob (`BLOB_READ_WRITE_TOKEN`). Deployment is **documented only** in Phase 7 (`docs/deployment_plan.md`); nothing is deployed from this repo yet.
