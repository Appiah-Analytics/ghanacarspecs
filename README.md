# GhanaCarSpecs (local MVP + VIN decode fallback + CSV ingestion)

Next.js app with **Prisma** and **SQLite** for vehicle lookup by **VIN** or **plate number**. **Local database is always tried first.** If there is no local row and the input is a **17-character VIN**, the app calls the free **NHTSA vPIC** API (US DOT) and shows decoded specifications on a separate page, clearly labeled as an **external** decode. Local admins can also import vehicle/event rows from CSV files into SQLite.

## Prerequisites

- [Node.js](https://nodejs.org/) **20+** (LTS recommended)
- npm (bundled with Node)
- **Outbound HTTPS** to `vpic.nhtsa.dot.gov` when testing external VIN decode (no API key required)

## Setup (first run)

From the repository root:

```bash
npm install
npm run db:setup
```

`db:setup` runs `prisma db push` (creates/updates `prisma/dev.db`) and `prisma db seed` (sample vehicles and events).

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

Use any seeded **VIN** or **plate** (lookup uses the local DB only for these; no external call).

| Vehicle | VIN | Plate |
|--------|-----|--------|
| Toyota Camry 2007 | `4T1BE46K37U123456` | `GR-1234-21` |
| Volkswagen Golf 2014 | `WVWZZZ3CZWE123456` | `GT 5678-22` |
| Honda Accord 1991 | `1HGBH41JXMN109186` | *(none)* |

**Expected:** Redirect to `/vehicles/{id}` with a green banner **Local GhanaCarSpecs record**, full specs, a **Vehicle intelligence** section (mileage checks, accident flag, import indicator, service continuity, timeline summary, confidence score), and event timeline (mileage, source, dates per event).

### B. External VIN decoded record (NHTSA vPIC)

Use a **valid 17-character VIN** that is **not** in the seed list above (any real VIN NHTSA can decode works).

Example (BMW, not in seed data):

`WBADT43452G922939`

**Expected:** After submit, redirect to `/decoded` with a blue banner **External VIN decoded record**, decoded specifications, and an empty event-history note (no local rows).

### C. No record found

Use a **plate** that does not exist in the seed data, e.g. `XX-0000-00`.

**Expected:** Orange **No record found** message on the home page (plates do not trigger the external VIN API).

### D. External decode failure

Use a 17-character pattern NHTSA rejects (e.g. invalid check digit / invalid VIN).  
**Expected:** Red error area with HTTP **502** and a short explanation plus `detail` from the server when the upstream decoder returns an error.

### E. Local CSV ingestion

Open the local admin import page:

```text
http://localhost:3000/admin/ingest
```

If Next is running on another port, use that port instead (for example `http://localhost:3001/admin/ingest`).

Upload a `.csv` file using this template:

```csv
vin,plateNumber,make,model,year,eventType,eventDate,mileage,sourceSystem,description
JTDKN3DU0A0123456,GR-9000-24,Toyota,Prius,2010,IMPORT,2024-01-12,87000,Tema Port,Imported from Japan
JTDKN3DU0A0123456,GR-9000-24,Toyota,Prius,2010,SERVICE,2024-05-03,90120,Accra Hybrid Care,Hybrid battery inspected
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
- Optional columns: `plateNumber`, `mileage`, `sourceSystem`, `description`
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
  -d "{\"vinOrPlate\":\"WBADT43452G922939\"}"
```

Response includes `"recordSource":"external"`, `"recordSourceLabel":"External VIN decoded record"`, `"dataProvider":"NHTSA vPIC"`, and a `decoded` object.

On macOS/Linux, use `\` line breaks or a single-line `curl` with single-quoted JSON.

## Scripts

| Command | Description |
| -------- | ----------- |
| `npm run dev` | Next.js dev server (Turbopack) |
| `npm run dev:webpack` | Dev server (Webpack fallback) |
| `npm run build` | Production build |
| `npm run start` | Production server (after `build`) |
| `npm run lint` | Typecheck (`tsc --noEmit`) |
| `npm run db:push` | Apply Prisma schema to SQLite |
| `npm run db:seed` | Reseed sample data |
| `npm run db:setup` | `db:push` then `db:seed` |
| `npm run report:docx` | Regenerate Word progress report in `docs/` |

## Project layout (main pieces)

- `app/page.tsx` — Home + lookup form  
- `app/vehicles/[id]/page.tsx` — Local vehicle report  
- `app/decoded/page.tsx` — External NHTSA decode report (fed via `sessionStorage` after lookup)  
- `app/admin/ingest/page.tsx` — Local admin CSV upload page  
- `app/api/v1/lookup/route.ts` — `POST` JSON `{ "vinOrPlate": "..." }`  
- `app/api/admin/ingest/route.ts` — CSV upload API (`multipart/form-data`)  
- `lib/csv-ingest.ts` — CSV parsing, validation, vehicle upsert, event insert  
- `lib/vehicle-intelligence.ts` — Risk/intelligence signals from local events  
- `lib/lookup.ts` — Local VIN/plate resolution + orchestration with external fallback  
- `lib/nhtsa-vin.ts` — NHTSA vPIC client  
- `lib/record-source.ts` — Human-readable source labels  
- `prisma/schema.prisma` — `Vehicle`, `VehicleEvent`  
- `prisma/seed.ts` — Sample data  

See `docs/project.md`, `docs/architecture.md`, and `docs/roadmap.md` for scope.

## Out of scope (not implemented)

Azure, Terraform, payments, auth, dealer/partner dashboards, risk flags, and production ingestion automation.
