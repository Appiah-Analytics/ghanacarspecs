# GhanaCarSpecs (local MVP + VIN decode fallback + CSV ingestion)

Next.js app with **Prisma** and **SQLite** for vehicle lookup by **VIN**, **plate number**, or **chassis number**. **Local database is always tried first.** If there is no local row and the input is a **17-character VIN**, the app calls the free **NHTSA vPIC** API (US DOT) and shows decoded specifications on a separate page, clearly labeled as an **external** decode. Local admins can import vehicle/event rows from CSV and view records on a simple **admin dashboard**.

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

**Expected:** Redirect to `/vehicles/{id}` with a green banner **Local GhanaCarSpecs record**, full specs, a **Vehicle intelligence** section (mileage checks, accident flag, import indicator, service continuity, timeline summary, confidence score), and event timeline (mileage, source, dates per event).

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

**Expected:** Summary cards and a vehicle table with links to `/vehicles/{id}`. Unauthenticated requests redirect to `/admin/login`.

### F. Local CSV ingestion

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

**Expected:** The upload page shows a success summary:

- Vehicles created
- Vehicles updated
- Events inserted
- Rows processed

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
- Validation is all-or-nothing: if any row has an error, no database records are written.

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
| `npm run db:seed` | Reseed sample data |
| `npm run db:setup` | `db:push` then `db:seed` (SQLite — default) |
| `npm run db:generate:postgres` | Generate Prisma client for PostgreSQL |
| `npm run db:migrate:postgres` | Apply PostgreSQL migrations (requires `DATABASE_URL`) |
| `npm run db:setup:postgres` | Postgres migrate + seed (staging/production) |
| `npm run db:export:sqlite` | Export SQLite data to JSON |
| `npm run report:docx` | Regenerate Word progress report in `docs/` |

## Project layout (main pieces)

- `app/page.tsx` — Home + lookup form  
- `app/vehicles/[id]/page.tsx` — Local vehicle report (specs, visual evidence, events)  
- `components/VehiclePhotos.tsx` — Sample photo gallery / empty state on local reports  
- `app/decoded/page.tsx` — External NHTSA decode report (fed via `sessionStorage` after lookup)  
- `app/admin/page.tsx` — Local admin dashboard (summary + vehicle table)  
- `app/admin/ingest/page.tsx` — Local admin CSV upload page  
- `lib/admin-dashboard.ts` — Admin summary queries and vehicle list  
- `lib/admin-auth.ts` — Admin secret verification and session cookie  
- `middleware.ts` — Protects `/admin` and `/api/admin/*`  
- `app/admin/login/page.tsx` — Admin sign-in  
- `app/api/v1/lookup/route.ts` — `POST` JSON `{ "vinOrPlate": "..." }`  
- `app/api/admin/ingest/route.ts` — CSV upload API (`multipart/form-data`)  
- `lib/csv-ingest.ts` — CSV parsing, validation, vehicle upsert, event insert  
- `lib/vehicle-intelligence.ts` — Risk/intelligence signals from local events  
- `lib/lookup.ts` — Local VIN/plate resolution + orchestration with external fallback  
- `lib/nhtsa-vin.ts` — NHTSA vPIC client  
- `lib/record-source.ts` — Human-readable source labels  
- `prisma/schema.prisma` — SQLite schema (local default)  
- `prisma/schema.postgresql.prisma` — PostgreSQL schema (Vercel / Neon production)  
- `vercel.json` — Vercel build command (`vercel-build`)  
- `prisma/seed.ts` — Sample data (vehicles, events, demo photos)  
- `public/demo-photos/` — SVG placeholders for seeded visual evidence (not real private photos)  

### Vehicle photos (demo)

Local reports include a **Visual evidence** section when the database has `VehiclePhoto` rows. Seeded examples use placeholder SVGs with captions such as import condition, inspection, and accident/repair evidence. These are **sample/demo visual evidence only** — not DVLA, police, insurer, or official Ghana records. **Photo upload is not implemented yet** (future admin work).

After pulling schema changes:

```bash
# Local SQLite
npm run db:push
npm run db:seed

# Neon / production (manual — not run on Vercel build)
DATABASE_URL="postgresql://..." npm run db:migrate:postgres
DATABASE_URL="postgresql://..." npm run db:seed
```

### Vercel + Neon deploy

Vercel runs **`prisma generate`** (PostgreSQL schema) and **`next build`** only. It does **not** run `prisma migrate deploy` during build (avoids advisory-lock timeouts on Neon).

When the schema changes, run migrations **manually before or after deploy**:

```bash
DATABASE_URL="postgresql://..." npm run db:migrate:postgres
DATABASE_URL="postgresql://..." npm run db:seed   # optional
```

See [`docs/postgresql.md`](docs/postgresql.md) for the full dual-schema workflow.

## Documentation

| Doc | Purpose |
|-----|---------|
| [`docs/roadmap.md`](docs/roadmap.md) | Phases 1–7 (delivery order) |
| [`docs/build_log.md`](docs/build_log.md) | Engineering history per phase |
| [`docs/architecture.md`](docs/architecture.md) | Current system design |
| [`docs/deployment_plan.md`](docs/deployment_plan.md) | Production readiness (not deployed yet) |
| [`docs/postgresql.md`](docs/postgresql.md) | SQLite → PostgreSQL dual-schema guide (Phase 9) |
| [`docs/public_demo_plan.md`](docs/public_demo_plan.md) | Public demo scope and Vercel/Neon deploy checklist (not deployed) |
| [`docs/sample_data.md`](docs/sample_data.md) | Canonical VINs, plates, chassis for QA |
| [`docs/project.md`](docs/project.md) | Scope and MVP definition |

Copy [`.env.example`](.env.example) to `.env`. **Admin routes require** `ADMIN_API_KEY` or `ADMIN_PASSWORD` (see Phase 8 in the roadmap).

## Out of scope (not implemented)

Azure hosting, Terraform, payments, per-user accounts, OAuth, dealer/partner dashboards, automated production ingestion, and **vehicle photo upload** (schema and read-only UI only for now). Admin uses a **single shared secret** (not user accounts). Deployment is **documented only** in Phase 7 (`docs/deployment_plan.md`); nothing is deployed from this repo yet.
