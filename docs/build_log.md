# GhanaCarSpecs — Engineering Build Log

Living record of major engineering work on [GhanaCarSpecs.com](https://github.com/Appiah-Analytics/ghanacarspecs).  
Update this file after every major feature or phase.

**Last updated:** 2026-05-20 (Lookup error UX)  
**Current stack:** Next.js 15 (App Router), TypeScript, Prisma, SQLite (local default) / PostgreSQL (production-ready), NHTSA vPIC

**Phase numbering:** Matches [`roadmap.md`](roadmap.md) Phases 1–10. Sample VINs, plates, and chassis numbers are centralized in [`sample_data.md`](sample_data.md).

---

## How to use this log

When you ship a meaningful feature:

1. Add or extend a phase section below (or add **Phase N**).
2. Fill in all six subsections: goal, files, behavior, testing, limitations, next step.
3. Bump **Last updated** at the top.
4. Cross-check `docs/roadmap.md`, `README.md`, and `docs/sample_data.md` if test values changed.

---

## Phase 1 — Local MVP foundation

### Goal

Deliver a working **local-first** vehicle lookup app: user enters a VIN or plate, the app queries SQLite, and shows vehicle specs plus an event timeline. No cloud, auth, or payments.

### Files added / changed

| Area | Paths |
|------|--------|
| App shell | `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `app/not-found.tsx`, `next.config.ts`, `tsconfig.json`, `package.json` |
| API | `app/api/v1/lookup/route.ts` |
| Pages | `app/vehicles/[id]/page.tsx` |
| Components | `components/LookupForm.tsx`, `components/VehicleReport.tsx`, `components/EventTimeline.tsx` |
| Data | `prisma/schema.prisma`, `prisma/seed.ts`, `lib/prisma.ts`, `lib/lookup.ts` |
| Docs | `README.md`, `docs/product_vision.md`, `docs/project.md`, `docs/architecture.md`, `docs/roadmap.md` |
| Tooling | `.gitignore`, `CHANGELOG.md` |

### Behavior implemented

- **Prisma models:** `Vehicle` (unique VIN, optional plate, specs, import metadata) and `VehicleEvent` (`EventType` enum, date, mileage, source, `rawPayload` JSON).
- **Lookup:** `POST /api/v1/lookup` with `{ "vinOrPlate": string }`. VIN normalized (17 chars, uppercase). Plate matched by alphanumeric key so `GR-1234-21` and `gr 1234-21` align.
- **UI:** Home lookup form; success navigates to `/vehicles/[id]`; 404 shows “No record found” on the home page.
- **Report:** Spec grid + event timeline (newest first), last known mileage, placeholder CTA for future paid reports.
- **Seed:** Three sample vehicles (Toyota with plate, VW with plate, Honda VIN-only) with realistic events.

### How it was tested

- `npm install`, `npm run db:setup`, `npm run dev`
- Browser: seeded VINs and plates from `prisma/seed.ts`
- API: `curl` / `Invoke-RestMethod` against `POST /api/v1/lookup`
- `npm run lint` (`tsc --noEmit`), `npm run build`

**Sample values:** See [`sample_data.md`](sample_data.md). Seeded vehicles:

| Vehicle | VIN | Plate | Chassis |
|---------|-----|-------|---------|
| Toyota Camry 2007 | `4T1BE46K37U123456` | `GR-1234-21` | `BE46K37U123456` |
| Volkswagen Golf 2014 | `WVWZZZ3CZWE123456` | `GT 5678-22` | `ZZZ3CZWE123456` |
| Honda Accord 1991 | `1HGBH41JXMN109186` | *(none)* | `BH41JXMN109186` |

### Known limitations

- SQLite only; not suitable for multi-user production without migration.
- No auth; anyone with the URL can use the app locally.
- Plate lookup scans vehicles with non-null plates (fine for MVP scale).
- Marketing site (Squarespace) out of repo; lookup app is separate.
- Dev server can be slow on first boot under OneDrive (documented in README).

### Next recommended step

Add external VIN decode when local DB has no row (Phase 2), then CSV ingestion for real partner-style data (Phase 3).

---

## Phase 2 — External VIN decode fallback

### Goal

Keep **local database lookup first**. If a **17-character VIN** is not in SQLite, call a **free** external decoder and return specs with a clear label that the result is **not** a GhanaCarSpecs history record.

### Files added / changed

| Area | Paths |
|------|--------|
| External API client | `lib/nhtsa-vin.ts` |
| Lookup orchestration | `lib/lookup.ts` (`resolveLookupWithExternalVin`, `ResolveLookupOutcome`) |
| Labels / storage | `lib/record-source.ts`, `lib/lookup-storage.ts` |
| API | `app/api/v1/lookup/route.ts` (extended response shapes) |
| UI | `components/SourceBanner.tsx`, `components/ExternalVinReport.tsx`, `app/decoded/page.tsx` |
| UI updates | `components/LookupForm.tsx`, `components/VehicleReport.tsx`, `app/page.tsx`, `app/globals.css` |
| Docs | `README.md`, `docs/roadmap.md` |

### Behavior implemented

- **Provider:** [NHTSA vPIC](https://vpic.nhtsa.dot.gov/api/) `DecodeVinValues` — no API key, 15s timeout.
- **Flow:** Local lookup → if miss and input is 17-char VIN → NHTSA decode → else 404 (plates never trigger external).
- **API labels:** `recordSource` / `recordSourceLabel`: `local` = “Local GhanaCarSpecs record”, `external` = “External VIN decoded record”.
- **Local hit:** Unchanged navigation to `/vehicles/[id]` + green source banner.
- **External hit:** JSON stored in `sessionStorage`, redirect to `/decoded` + blue source banner; specs grid from decode; empty history note.
- **Failures:** HTTP 502 when NHTSA returns unusable data, with `detail` message.

### How it was tested

- Seeded VIN still resolves **local** (e.g. `4T1BE46K37U123456`).
- Non-seeded valid VIN (e.g. `1HGCM82633A004352`) → `/decoded` with external banner.
- Unknown plate → 404 on home (no external call).
- `npm run lint`, `npm run build`
- Git Bash / PowerShell `curl` against lookup API (use correct port if 3001).

### Known limitations

- External decode is **US-oriented** (NHTSA); Ghana-specific registry not integrated.
- No persistence of external decodes in DB.
- `sessionStorage` for `/decoded` is lost on new tab / clear storage; deep-link to decode result not supported.
- No intelligence/risk layer on external pages (no local events).
- Requires outbound HTTPS to `vpic.nhtsa.dot.gov`.

### Next recommended step

CSV ingestion so more vehicles exist locally before fallback (Phase 3).

---

## Phase 3 — CSV ingestion pipeline

### Goal

Allow **local admin** import of vehicle and event rows from CSV into SQLite: validate file, upsert vehicles by VIN, insert events, surface row-level errors. No auth, no Azure.

### Files added / changed

| Area | Paths |
|------|--------|
| Ingestion logic | `lib/csv-ingest.ts` |
| API | `app/api/admin/ingest/route.ts` |
| Admin UI | `app/admin/ingest/page.tsx`, `components/CsvUploadForm.tsx` |
| Styles | `app/globals.css` (admin cards, alerts, template block) |
| Docs | `README.md`, `docs/roadmap.md` |

### Behavior implemented

- **Page:** `/admin/ingest` — upload form, embedded CSV template, validation rules list.
- **Upload:** `POST /api/admin/ingest` (`multipart/form-data`, field `file`, `.csv` only).
- **Columns:** Required `vin`, `make`, `model`, `year`, `eventType`, `eventDate`; optional `plateNumber`, `chassisNumber`, `mileage`, `sourceSystem`, `description`.
- **Validation (all-or-nothing):** Header checks; VIN length 17; year range; enum event types; valid dates; integer mileage; **no conflicting VIN rows** (make/model/year/plate) within the same file.
- **Write:** Transaction — `vehicle.upsert` by VIN, `vehicleEvent.createMany`; `description` → `rawPayload.description` + `importedFrom: "csv"`.
- **UI feedback:** Success summary (created/updated vehicles, events inserted) or numbered row errors; nothing written on validation failure.

### How it was tested

- `npm run dev` → open `/admin/ingest` (or `:3001` if port busy).
- Upload README template (e.g. `JTDKN3DU0A0123456` / `GR-9000-24`).
- Lookup imported VIN and plate on home → local report with events.
- Upload conflict CSV (same VIN, different make on row 2) → errors, no DB change.
- `npm run lint`, `npm run build`
- Programmatic smoke via `ingestVehicleEventsCsv()` + `resolveLookupWithExternalVin()` (dev script, not committed).

### Known limitations

- **No authentication** — admin URL is open on localhost; not for public deployment as-is.
- Single-file, synchronous import; no queue or large-file streaming.
- Custom CSV parser (quoted fields); exotic Excel exports may need cleanup.
- Does not dedupe events (re-upload creates duplicate events).
- Plate assignment on update only fills empty plate; conflicts rejected at validation time.
- Lookup flow unchanged; no ingest audit log table.

### Next recommended step

Vehicle intelligence / risk signals on local reports (Phase 4), then production hardening (Azure, auth) when ready.

---

## Phase 4 — Vehicle intelligence / risk layer

### Goal

Add a **simple intelligence layer** on local records: mileage checks, accident flag, import indicator, service continuity score, timeline summary, and history confidence — without changing lookup routing or adding auth/Azure.

### Files added / changed

| Area | Paths |
|------|--------|
| Analysis | `lib/vehicle-intelligence.ts` |
| UI | `components/VehicleIntelligence.tsx` |
| Integration | `components/VehicleReport.tsx`, `app/api/v1/lookup/route.ts` |
| Styles | `app/globals.css` (intel grid/cards) |
| Docs | `README.md`, `docs/roadmap.md` |

### Behavior implemented

Computed in `analyzeVehicleIntelligence()` from vehicle + events:

| Signal | Logic (summary) |
|--------|------------------|
| **Mileage inconsistency** | Drops between dated readings; jumps &gt; ~80k km/year flagged. |
| **Accident risk flag** | Flagged if any `ACCIDENT` or `INSURANCE_CLAIM` events. |
| **Imported vehicle** | Import event, `importDate`, or non-Ghana `countryOfOrigin`. |
| **Service continuity** | Score 0–100 from service count vs. years of history; label Strong/Moderate/Limited/Unknown. |
| **Timeline summary** | Prose summary: event counts by type, span, accident note. |
| **History confidence** | Score 0–100 from event count, type diversity, mileage coverage, source diversity, service score; label High/Medium/Low. |

- **UI:** “Vehicle intelligence” section on `/vehicles/[id]` between specs and event history.
- **API:** Local lookup responses include `intelligence` object (same structure).
- **External decode:** Unchanged; no intelligence block (no local events).

### How it was tested

- **Toyota** `4T1BE46K37U123456` — import indicated, no accident flag, moderate/strong continuity.
- **Volkswagen** `WVWZZZ3CZWE123456` — accident risk **Flagged**, import indicated.
- API: local lookup JSON includes `intelligence`.
- `npm run lint`, `npm run build`

### Known limitations

- Heuristic rules only; not ML, not insurer-grade risk pricing.
- Ghana-specific rules minimal (import = non-Ghana origin or IMPORT event).
- No intelligence on external NHTSA-only decodes.
- Confidence score is transparent but subjective; not calibrated on real fleet data.
- Does not write flags back to DB (computed at read time).
- Mileage logic needs at least two mileage-bearing events to detect trends.

### Next recommended step

- Persist optional “risk snapshot” on report generation if API consumers need stable scores.
- Event deduplication on CSV re-import.
- Azure deployment + auth for admin/ingest (roadmap Phase 7).
- Partner API keys and paid report tiers (out of current scope).

---

## Phase 5 — Chassis number support

### Goal

Let users search and display **chassis numbers** alongside VIN and plate, without changing external VIN decode rules (17-character VIN only, after local miss).

### Files added / changed

| Area | Paths |
|------|--------|
| Schema | `prisma/schema.prisma` (`chassisNumber String? @unique`) |
| Seed | `prisma/seed.ts` (sample chassis per vehicle) |
| Lookup | `lib/lookup.ts` (`lookupByVinPlateOrChassis`, chassis normalization) |
| CSV | `lib/csv-ingest.ts` (optional `chassisNumber` column, conflict checks) |
| API | `app/api/v1/lookup/route.ts` (`chassisNumber` in vehicle payload, 404 message) |
| UI | `app/page.tsx`, `components/LookupForm.tsx`, `components/VehicleReport.tsx` |
| Admin | `app/admin/ingest/page.tsx` (template + validation copy) |
| Docs | `README.md`, `docs/roadmap.md`, `docs/build_log.md` |

### Behavior implemented

- **Database:** Optional unique `chassisNumber` on `Vehicle` (SQLite allows multiple nulls).
- **Lookup order:** VIN (if 17 chars) → plate (normalized) → chassis (normalized) → external NHTSA only if still missing and input is 17-char VIN.
- **CSV:** Optional `chassisNumber` column; same-VIN chassis conflicts rejected; duplicate chassis across different VINs in one file rejected; upsert sets chassis when provided.
- **Report:** Chassis shown in header identifiers and spec grid when present.
- **Backward compatibility:** API body field remains `vinOrPlate`; `lookupByVinOrPlate` aliases the new function.

### How it was tested

- `npm run db:push` and `npm run db:seed` after schema change.
- Lookup by seeded VIN, plate, and chassis (e.g. Toyota chassis `BE46K37U123456`).
- Confirm `1HGCM82633A004352` still uses external decode when not in DB.
- `npm run lint`, `npm run build`

### Known limitations

- Chassis lookup scans vehicles with non-null chassis (same pattern as plate; fine for local MVP scale).
- No separate chassis format validation (length/check digit); normalization is alphanumeric only.
- External decode never runs for chassis-only queries, even if chassis looks like 17 characters but is stored only as chassis.
- DB unique constraint on chassis will error on ingest if chassis already belongs to another vehicle (not pre-validated against DB before insert).

### Next recommended step

- Index or exact-match query for plate/chassis at scale.
- Optional chassis field on external decode page (display-only).
- Production migration path when moving off SQLite.

---

## Phase 6 — Local admin dashboard

### Goal

Provide a simple **local admin dashboard** at `/admin` to view GhanaCarSpecs SQLite records: aggregate counts and a vehicle table with links to existing report pages. No authentication, Azure, or payments.

### Files added / changed

| Area | Paths |
|------|--------|
| Admin UI | `app/admin/page.tsx` |
| Data | `lib/admin-dashboard.ts` |
| Admin ingest | `app/admin/ingest/page.tsx` (link back to `/admin`) |
| Styles | `app/globals.css` (admin stats, table, back-row) |
| Docs | `README.md`, `docs/roadmap.md`, `docs/build_log.md` |
| Rules | `.cursor/rules/project_rules.md` (removed deferred “advanced admin dashboard”) |

### Behavior implemented

- **`/admin`:** Server-rendered dashboard with five summary cards: total vehicles, total events, vehicles with accident or insurance-claim events, vehicles with a chassis number, and imported vehicles (import event, `importDate`, or non-Ghana `countryOfOrigin` — same rules as vehicle intelligence).
- **Vehicle table:** make, model, year, VIN, chassis, plate, event count, latest event date; each row links to `/vehicles/[id]` (existing report page).
- **Navigation:** `/admin` links to `/admin/ingest`; ingest page links back to `/admin` and home lookup.
- **`/admin/ingest`:** Unchanged CSV upload flow and API.

### How it was tested

- `npm run dev` → open `/admin` after `npm run db:setup`
- Confirm summary counts match seeded data (3 vehicles, multiple events)
- Click **View report** on a row → `/vehicles/[id]` loads full report
- Open `/admin/ingest` from dashboard; upload CSV still works; back link returns to `/admin`
- `npm run lint`, `npm run build`

### Known limitations

- No authentication — admin routes are open on localhost; not for public deployment as-is.
- Imported-vehicle count loads all vehicles for filtering (fine for local MVP scale).
- No search, pagination, or export on the vehicle table.
- Summary does not include external NHTSA decodes (local DB only).

### Next recommended step

- Auth for admin routes before any non-local deployment.
- Optional filters on the vehicle table (make, year, accident flag).
- Azure deployment and monitoring (roadmap Phase 7).

---

## Cross-phase architecture (current)

```text
User → Home (LookupForm)
         → POST /api/v1/lookup
              → lib/lookup.resolveLookupWithExternalVin
                   ├─ local hit (VIN / plate / chassis) → /vehicles/[id]
                   │     └─ VehicleReport + analyzeVehicleIntelligence
                   ├─ external VIN → sessionStorage → /decoded
                   └─ miss → 404

Admin → /admin/login (ADMIN_API_KEY or ADMIN_PASSWORD)
     → /admin (summary + vehicle table → /vehicles/[id])
     → /admin/ingest → POST /api/admin/ingest → lib/csv-ingest
```

**Database:** `prisma/dev.db` (SQLite) — `vehicles`, `vehicle_events`.

**Explicitly not built:** Azure, Terraform, payments, auth, dealer/partner portal, DVLA integrations.

---

## Changelog index (git milestones)

| Milestone | Summary |
|-----------|---------|
| Initial docs + SemVer | Product vision, roadmap, `v0.1.0` tag |
| Phase 1 MVP | Next.js + Prisma + lookup + seed + report UI |
| UX / seed fix | Report layout, ASCII seed strings, Word progress report |
| Phase 2–4 (branch) | NHTSA fallback, CSV ingest, intelligence layer |
| Phase 5 | Chassis number support |
| Phase 6 | Local admin dashboard |
| Phase 7 (docs) | Deployment readiness plan, `.env.example`, doc stabilization |
| Phase 8 | Basic admin protection (env secret + middleware) |
| Phase 9 | PostgreSQL readiness (dual schema + migrations) |
| Phase 10 | Public demo readiness (homepage, disclaimer, demo plan) |

For commit-level detail, use `git log` on the main feature branches for each phase.

---

## Phase 10 — Public demo readiness

### Goal

Prepare a **credible public demo** of GhanaCarSpecs as a vehicle intelligence and history platform for Ghana, with clear sample-data disclaimers and try-it examples — without deploying or adding payments, accounts, DVLA, or Azure.

### Files added / changed

| Area | Paths |
|------|--------|
| Homepage | `app/page.tsx`, `components/HowItWorks.tsx`, `components/DemoExamples.tsx`, `components/VinChassisGuidance.tsx`, `components/PublicDisclaimer.tsx` |
| Chrome | `components/SiteHeader.tsx`, `components/SiteFooter.tsx`, `app/layout.tsx` (metadata) |
| Lookup | `components/LookupForm.tsx` (fill-demo event, input id) |
| Styles | `app/globals.css` |
| Docs | `docs/public_demo_plan.md`, `README.md`, `docs/roadmap.md` |

### Behavior implemented

- Homepage positions **local GhanaCarSpecs records** + **NHTSA external decode** with Ghana-focused messaging.
- **Try the demo** section with one-click fill from [`sample_data.md`](sample_data.md) values.
- **VIN/chassis guidance** for Ghana users (where to find identifiers; what to enter; demo DB limitation).
- **Public demo notice** disclaimer: sample local data; external decode limitations.
- Site header/footer; **no admin link** on public homepage.
- Open Graph / title / description updated for demo sharing.
- Admin protection unchanged (Phase 8).

### How it was tested

- `npm run lint`, `npm run build`
- Manual: Try buttons fill lookup; local VIN, external VIN, not-found flows unchanged

### Known limitations

- Demo examples omit invalid-VIN error case on homepage (documented in `sample_data.md`).
- `AdminEnvDiagnostic` still on `/admin/login` (admin-only).
- Not deployed to Vercel/Neon yet — see `public_demo_plan.md` checklist.

### Next recommended step

- Optional public deploy to Vercel + Neon using `public_demo_plan.md` §6.
- Azure production path remains Phase 7 when ready.

---

## Lookup error UX (post–Phase 10)

### Goal

Replace generic **Something went wrong** / **Lookup failed** copy with clearer, trust-building messages for demo users — without changing lookup or database logic.

### Files added / changed

| Area | Paths |
|------|--------|
| Messages | `lib/lookup-messages.ts` (titles/bodies, plate/chassis heuristic for 404 copy) |
| API | `app/api/v1/lookup/route.ts` (500 returns `title` + `message`) |
| UI | `components/LookupForm.tsx` (structured fallbacks, 500 handling) |
| Docs | `README.md`, `docs/build_log.md` |

### Behavior implemented

- **404:** **No local GhanaCarSpecs record found yet** — generic or plate/chassis-specific body; no implication of official Ghana records.
- **502:** **VIN could not be decoded** — local miss + NHTSA failure; `detail` still in JSON for logs.
- **500 / network:** **Lookup temporarily unavailable** — professional retry guidance.
- Lookup routing and Prisma queries unchanged.

### How it was tested

- `npm run lint`, `npm run build`
- Manual: `GR-9999-99` (404), `00000000000000000` (502), seeded VIN (200)

### Next recommended step

- Optional deploy; monitor Vercel logs for 500s (often `DATABASE_URL` / Prisma on production).

---

## Phase 8 — Basic admin protection

### Goal

Protect admin UI and CSV ingest API before any public deployment using a single environment secret — no user accounts, OAuth, or database users.

### Files added / changed

| Area | Paths |
|------|--------|
| Auth | `lib/admin-auth.ts` |
| Middleware | `middleware.ts` |
| Login | `app/admin/login/page.tsx`, `app/api/admin/login/route.ts`, `app/api/admin/logout/route.ts`, `components/AdminLoginForm.tsx`, `components/AdminSignOut.tsx` |
| Ingest | `app/api/admin/ingest/route.ts`, `components/CsvUploadForm.tsx` |
| Admin UI | `app/admin/page.tsx`, `app/admin/ingest/page.tsx`, `app/globals.css` |
| Config / docs | `.env.example`, `README.md`, `docs/roadmap.md`, `docs/deployment_plan.md`, `docs/architecture.md` |

### Behavior implemented

- **`ADMIN_API_KEY`** (preferred) or **`ADMIN_PASSWORD`** must be set or admin routes return **503** with configuration guidance.
- **Middleware** guards `/admin`, `/admin/ingest`, and `/api/admin/*` except `/admin/login`, `/api/admin/login`, `/api/admin/logout`.
- **Browser:** sign-in at `/admin/login` → httpOnly session cookie (8 hours, `secure` in production).
- **API / scripts:** `Authorization: Bearer <secret>` or `X-Admin-Key: <secret>` on `POST /api/admin/ingest`.
- **Public lookup** (`/`, `/api/v1/lookup`, `/vehicles/[id]`, `/decoded`) unchanged.

### How it was tested

- Without `.env` secret → `/admin` redirects to login with not-configured message.
- With secret → login → dashboard and CSV upload succeed; sign out clears access.
- `POST /api/v1/lookup` without admin headers still works.
- `npm run lint`, `npm run build`

### Known limitations

- Single shared secret for all admins (no per-user audit trail).
- No rate limiting on login attempts.
- Session is a static HMAC-derived token (no server-side session store).

### Next recommended step

- Azure deployment (Phase 7) with secrets in App Service configuration.
- Optional rate limiting on `/api/admin/login` and lookup API.

---

## Phase 9 — PostgreSQL readiness

### Goal

Prepare for **PostgreSQL in production** while keeping **SQLite local development** unchanged. No Azure provisioning or deploy.

### Files added / changed

| Area | Paths |
|------|--------|
| PostgreSQL schema | `prisma/schema.postgresql.prisma` |
| Migrations | `prisma/migrations/20260520120000_init/`, `migration_lock.toml` |
| Data scripts | `scripts/export-sqlite-data.ts`, `scripts/import-postgres-data.ts` |
| Docs | `docs/postgresql.md`, `docs/deployment_plan.md` §6, `README.md`, `docs/roadmap.md`, `.env.example` |
| Scripts | `package.json` (`db:generate:postgres`, `db:migrate:postgres`, `db:setup:postgres`, export/import) |
| SQLite schema | `prisma/schema.prisma` (comment only — still default) |

### Behavior implemented

- **Dual-schema strategy:** Prisma cannot switch providers in one schema; SQLite stays in `schema.prisma`, PostgreSQL in `schema.postgresql.prisma` with `env("DATABASE_URL")`.
- **Migrations:** Initial PostgreSQL migration committed; SQLite continues `db push` locally.
- **Cutover paths documented:** re-seed (MVP), export/import scripts, CSV re-import.
- **Production sequence:** `db:generate:postgres` → `db:migrate:postgres` → `build` → `start`.

### How it was tested

- `npm run db:setup` (SQLite unchanged)
- `npm run db:export:sqlite` (exports seed vehicles)
- `npm run db:generate:postgres`
- `npm run lint`, `npm run build`

### Known limitations

- Two schema files must be kept in sync manually.
- `@prisma/client` reflects last `db:generate*` run — document switching.
- PostgreSQL migrate/import not exercised without a live Postgres instance.
- Azure PostgreSQL still Phase 7 (not provisioned).

### Next recommended step

- Add `db:generate:postgres` + `db:migrate:postgres` to CI/deploy pipeline when Azure staging exists.
- Optional: local Docker Postgres smoke test before first staging deploy.

---

## Stabilization pass — documentation alignment

### Goal

Align README, roadmap, architecture, deployment plan, and build log: consistent **phase numbering (1–7)**, verified **npm scripts**, canonical **sample VINs/plates/chassis**, and `.env.example` matching current and planned configuration. No product features; no deploy.

### Files added / changed

| Area | Paths |
|------|--------|
| Canonical test data | `docs/sample_data.md` |
| Phase roadmap | `docs/roadmap.md` (ordered Phases 1–7) |
| Architecture | `docs/architecture.md` (current tree and flows) |
| Deployment | `docs/deployment_plan.md`, `.env.example` |
| Cross-links | `README.md`, `docs/build_log.md` |

### Behavior implemented

- Roadmap Phases 3–4 split out from the old combined “Phase 2” bucket (CSV vs intelligence).
- Infrastructure and deployment docs are **Phase 7** (replacing the old “Phase 3 (infrastructure)” label).
- External-decode failure test documents `00000000000000000` instead of a vague invalid-VIN note only.
- `.env.example` states that `DATABASE_URL` is not wired in `schema.prisma` yet.

### How it was tested

- Compared all doc tables to `prisma/seed.ts` and `components/LookupForm.tsx` placeholder.
- Verified `package.json` scripts against README and `deployment_plan.md`.

### Known limitations

- `scripts/generate-progress-report.ts` may still describe older phase groupings until regenerated.
- `docs/product_vision.md` and `docs/project.md` use high-level phase wording only (not renumbered).

### Next recommended step

- Wire `env("DATABASE_URL")` when starting Phase 7 Azure work; follow `deployment_plan.md` checklist.

---

## Template for future phases

```markdown
## Phase N — [Title]

### Goal
...

### Files added / changed
...

### Behavior implemented
...

### How it was tested
...

### Known limitations
...

### Next recommended step
...
```
