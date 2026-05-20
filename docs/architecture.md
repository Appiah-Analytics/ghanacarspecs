# GhanaCarSpecs Architecture

**Stack:** Next.js 15 (App Router), React 19, TypeScript, Prisma 6, SQLite (`prisma/dev.db`), NHTSA vPIC (external VIN).

**Phases:** See [`roadmap.md`](roadmap.md) (Phases 1–7). **Deployment:** [`deployment_plan.md`](deployment_plan.md). **Test data:** [`sample_data.md`](sample_data.md).

---

## System overview

Local-first vehicle lookup: the app always queries the **local database** first (VIN, then plate, then chassis). A **17-character VIN** that is not local may fall back to **NHTSA vPIC** (labeled as external, no local event history).

```text
┌─────────────────────────────────────────────────────────┐
│              Next.js (Node 20+) — single deployable      │
│  Pages: /  /vehicles/[id]  /decoded  /admin  /ingest    │
│  API:   POST /api/v1/lookup   POST /api/admin/ingest   │
└────────────┬──────────────────────────────┬─────────────┘
             │                              │
             ▼                              ▼
      lib/lookup.ts                   lib/csv-ingest.ts
      lib/vehicle-intelligence.ts          │
             │                              │
             ▼                              ▼
      Prisma → SQLite (prisma/dev.db)  ← same DB
             │
             ▼ (if local miss + 17-char VIN)
      lib/nhtsa-vin.ts → vpic.nhtsa.dot.gov
```

---

## Application structure (current)

```text
ghanacarspecs/
├── app/
│   ├── page.tsx                    # Home + lookup
│   ├── layout.tsx, globals.css
│   ├── vehicles/[id]/page.tsx      # Local report
│   ├── decoded/page.tsx            # External decode (client)
│   ├── admin/
│   │   ├── page.tsx                # Dashboard
│   │   └── ingest/page.tsx         # CSV upload
│   └── api/
│       ├── v1/lookup/route.ts
│       └── admin/ingest/route.ts
├── components/
│   ├── LookupForm.tsx
│   ├── VehicleReport.tsx
│   ├── VehicleIntelligence.tsx
│   ├── EventTimeline.tsx
│   └── CsvUploadForm.tsx
├── lib/
│   ├── prisma.ts
│   ├── lookup.ts
│   ├── nhtsa-vin.ts
│   ├── csv-ingest.ts
│   ├── admin-dashboard.ts
│   ├── vehicle-intelligence.ts
│   └── record-source.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── docs/
```

---

## Data model

- **Vehicle** — unique `vin`, optional unique `chassisNumber`, optional `plateNumber`, specs, import metadata.  
- **VehicleEvent** — `eventType` enum, `eventDate`, optional `mileage`, `sourceSystem`, `rawPayload` JSON.

Database file: `prisma/dev.db` (gitignored). See `prisma/schema.prisma`.

---

## Lookup flow

1. Normalize input (VIN uppercase 17 chars; plate/chassis alphanumeric key).  
2. `findUnique` by VIN, else scan plates, else scan chassis numbers.  
3. If found → JSON with `recordSource: "local"` → UI navigates to `/vehicles/{cuid}`.  
4. If not found and input is 17-char VIN → NHTSA → `recordSource: "external"` → `/decoded` via `sessionStorage`.  
5. Otherwise → 404.

API contract: `POST /api/v1/lookup` with `{ "vinOrPlate": string }`.

---

## Admin flow

- **`middleware.ts`** — blocks `/admin/*` and `/api/admin/*` unless configured and authenticated.  
- **`/admin/login`** — browser sign-in; sets httpOnly `gcs_admin_session` cookie when `ADMIN_API_KEY` or `ADMIN_PASSWORD` matches.  
- **`/admin`** — aggregate stats and vehicle table (links to reports).  
- **`/admin/ingest`** — CSV upload → `POST /api/admin/ingest` (also accepts `Authorization: Bearer` or `X-Admin-Key`).

One shared deployment secret — no user accounts or OAuth (Phase 8).

---

## Explicitly not built

Azure hosting, auth, payments, partner portals, DVLA integrations, Kubernetes, background workers, and production-grade ingestion automation. Phase 7 covers **documentation and future** Azure deployment only.
