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

## CSV validation (unchanged contract)

- All-or-nothing: any row error → no database writes.
- Required columns: `vin`, `make`, `model`, `year`, `eventType`, `eventDate`.
- Optional: `plateNumber`, `chassisNumber`, `mileage`, `sourceSystem`, `description`.
- In-file VIN profile consistency and duplicate chassis checks within the upload file.

Upload UI and JSON response shape are unchanged.

---

## Import quality principles

1. **Validate before write** — parsing and business rules run in `lib/csv-ingest.ts` before any transaction.
2. **Transactional vehicle upsert** — vehicles upserted once per VIN profile, then events created via shared helper inside the same transaction.
3. **Auditable creates** — each CSV event is individually logged (not a silent bulk insert).
4. **Explicit trust metadata** — CSV rows do not inherit ambiguous defaults without audit trail.

---

## Not implemented yet (planned follow-ups)

- Import preview (dry-run UI before commit)
- Duplicate detection / idempotent re-import
- Import quality scoring or row-level warnings report
- Optional CSV columns for `provenanceType` / `confidenceLevel`
- Pre-flight DB chassis/plate conflict checks before transaction

---

## Operational commands

```bash
# After schema changes affecting events
npm run db:generate          # local SQLite
npm run db:generate:postgres # Neon / production client

# CSV ingest is via admin UI or API — no CLI ingest script
```

See [`debugging_runtime_and_environment.md`](./debugging_runtime_and_environment.md) for env and Prisma client mismatches.
