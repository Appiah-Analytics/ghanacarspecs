# Data Acquisition and Import Quality

How GhanaCarSpecs ingests vehicle/event data today and how import quality is enforced before preview, duplicate reports, or scoring features.

Related: [`admin_record_management.md`](./admin_record_management.md), [`evidence_lifecycle_management.md`](./evidence_lifecycle_management.md), [`evidence_confidence_and_provenance.md`](./evidence_confidence_and_provenance.md).

---

## Acquisition paths

| Path | Entry | Write layer |
|------|--------|-------------|
| **CSV bulk import** | `POST /api/admin/ingest` → `ingestVehicleEventsCsv()` | `createVehicleEventRecord()` per row |
| **Admin UI (single event)** | `POST /api/admin/vehicles/[id]/events` → `createAdminVehicleEvent()` | `createVehicleEventRecord()` |
| **Seed / demo** | `prisma/seed.ts` | Direct Prisma (demo only) |

Phase 18 aligned CSV and admin event creation on **`lib/vehicle-event-write.ts`** so both paths share evidence defaults and audit logging.

---

## Shared event write helper

`createVehicleEventRecord(db, input)`:

- Sets `confidenceLevel`, `provenanceType`, `status` explicitly (or defaults).
- Builds `rawPayload` with `importedFrom: "admin" | "csv"` (admin also keeps `addedFrom: "admin"` for backward compatibility).
- Writes one **audit log entry per created event** (`action: create`).

### CSV defaults

| Field | Value |
|-------|--------|
| `confidenceLevel` | `LOW` |
| `provenanceType` | `OTHER` |
| `status` | `PUBLISHED` |
| `importedFrom` (payload) | `csv` |

Admin identifier for CSV rows comes from `getAdminIdentifierFromRequest()` on the ingest API (session, bearer, or `x-admin-key`).

---

## CSV validation

- Hard row errors still block import (all-or-nothing).
- Required columns: `vin`, `make`, `model`, `year`, `eventType`, `eventDate`.
- Optional: `plateNumber`, `chassisNumber`, `mileage`, `sourceSystem`, `description`.
- In-file VIN profile consistency (make/model/year/plate/chassis conflicts remain errors).
- Cross-VIN plate/chassis duplicates in-file or in DB are **warnings only** (import proceeds).

### API response (Phase 18.2)

Successful and failed ingest responses include:

- `report` — `{ rowsProcessed, imported, skipped, warnings[], errors[] }`
- `quality` — `{ score: 0–100, status: Excellent | Good | Needs Review | Poor }`
- `summary` — unchanged on success (`vehiclesCreated`, `vehiclesUpdated`, `eventsInserted`, `rowsProcessed`)

---

## Duplicate detection (`lib/duplicate-detection.ts`)

| Confidence | Rule |
|------------|------|
| **High** | VIN in upload already exists in database |
| **Possible** | Plate or chassis in upload matches a different VIN in DB |
| **Possible** | Same plate or chassis on different VINs within the upload file |

Imports are **not blocked** by duplicate warnings. No automatic merge or deduplication.

---

## Import quality score (`lib/import-quality-score.ts`)

Score starts at 100 and applies penalties (normalized per data row):

| Signal | Penalty weight |
|--------|----------------|
| Missing chassis (per row) | 3 |
| Missing make/model (per row) | 15 |
| Invalid/skipped row | 20 |
| High-confidence duplicate VIN (unique value) | 12 |
| Possible duplicate plate (unique value) | 6 |
| Possible duplicate chassis (unique value) | 6 |

| Score | Status |
|-------|--------|
| 90–100 | Excellent |
| 75–89 | Good |
| 50–74 | Needs Review |
| &lt; 50 | Poor |

---

## Import history (`lib/import-history.ts`)

- Stored at `prisma/data/import-history.json` (gitignored with `prisma/data/`).
- Appends on **successful** imports only; keeps last 50 entries, UI shows last 10.
- Fields: timestamp, filename, rowsProcessed, imported, skipped, warning count, qualityScore.

---

## Import quality principles

1. **Validate before write** — parsing and business rules run in `lib/csv-ingest.ts` before any transaction.
2. **Transactional vehicle upsert** — vehicles upserted once per VIN profile, then events created via shared helper inside the same transaction.
3. **Auditable creates** — each CSV event is individually logged (not a silent bulk insert).
4. **Explicit trust metadata** — CSV rows do not inherit ambiguous defaults without audit trail.
5. **Warn on duplicates** — operators see duplicate signals without blocking legitimate multi-event files.

---

## Event idempotency (Phase 19)

See [`event_idempotency_and_import_preview.md`](./event_idempotency_and_import_preview.md).

- Fingerprint: `vehicleId`, `eventType`, `eventDate`, `mileage`, `sourceSystem` (not `description`).
- Duplicate events skipped with warning `Duplicate event skipped`; no create audit for skips.
- Re-uploading the same CSV after commit does not insert duplicate event rows.

## Import preview (Phase 19)

- `POST /api/admin/ingest?mode=preview` or form field `mode=preview` — zero DB writes.
- `mode=commit` (default) applies vehicle upserts and idempotent event inserts.
- Admin UI: Preview import → review → Commit import (re-select same file).

## Not implemented yet (planned follow-ups)

- Server-side staged import token (avoid re-selecting file on commit)
- Optional CSV columns for `provenanceType` / `confidenceLevel`

---

## Operational commands

```bash
# After schema changes affecting events
npm run db:generate          # local SQLite
npm run db:generate:postgres # Neon / production client

# CSV ingest is via admin UI or API — no CLI ingest script
```

See [`debugging_runtime_and_environment.md`](./debugging_runtime_and_environment.md) for env and Prisma client mismatches.
