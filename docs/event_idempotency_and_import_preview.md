# Event Idempotency and Import Preview

Phase 19 adds duplicate-event skipping and a preview-before-commit workflow for CSV ingestion.

Related: [`data_acquisition_and_import_quality.md`](./data_acquisition_and_import_quality.md), [`admin_record_management.md`](./admin_record_management.md).

---

## Event fingerprint

Duplicate events are detected with `buildEventFingerprint()` in `lib/event-idempotency.ts`.

| Field | Included |
|-------|----------|
| `vehicleId` | Yes |
| `eventType` | Yes |
| `eventDate` | Yes (ISO timestamp) |
| `mileage` | Yes (`null` normalized) |
| `sourceSystem` | Yes (trimmed, lowercased) |
| `description` | **No** (intentionally excluded to avoid brittle matching) |

---

## Idempotency rules

1. **Database:** If an existing `VehicleEvent` for the same vehicle matches the fingerprint, the CSV row is skipped.
2. **Same upload:** If the fingerprint was already seen earlier in the file, later rows are skipped.
3. **Warnings only:** Skipped rows add `{ row, field: "event", message: "Duplicate event skipped" }`.
4. **No deletes/merges:** Existing events are never modified or removed.
5. **Audit:** `createVehicleEventRecord()` runs only for rows that are actually inserted (committed imports only).

Re-uploading the same CSV after a successful commit inserts **zero** new duplicate events (vehicles may still update).

---

## Preview vs commit

| Mode | API | DB writes | Import history |
|------|-----|-----------|----------------|
| **Preview** | `POST /api/admin/ingest` with `mode=preview` (form field or `?mode=preview`) | **None** | Not recorded |
| **Commit** | `POST /api/admin/ingest` with `mode=commit` (default) | Vehicles upserted + new events inserted | Appended to `prisma/data/import-history.json` |

Preview and commit share the same parse, validation, duplicate vehicle warnings, quality score, and event idempotency planning logic in `lib/csv-ingest.ts`.

### Preview report fields

- Rows processed
- Vehicles to create / update
- Events to insert / skip
- Duplicate events skipped
- Warnings and errors
- Quality score

### Admin UI (`/admin/ingest`)

1. Choose CSV → **Preview import**
2. Review preview (no writes)
3. Re-select the same file if the browser cleared the input → **Commit import**

Commit is enabled only after a successful preview with no fatal validation errors.

---

## Import history (committed only)

Stored at `prisma/data/import-history.json` (gitignored). Each committed import records:

- `filename`, `timestamp`, `rowsProcessed`, `qualityScore`, `warnings` (count)
- `eventsInserted`, `eventsSkipped`, `duplicateEventsSkipped`
- Legacy fields `imported`, `skipped` retained for compatibility

Preview runs are **not** written to history.

---

## Limitations

- No import preview caching on the server — commit re-parses the uploaded file.
- Fingerprint ignores `description`; two events differing only by description are treated as duplicates.
- Idempotency is per-server database state; serverless instances do not share import history JSON.
- No automatic record merging or event updates.

---

## Operational commands

```bash
npm run lint
npm run build
```

Preview via API:

```bash
curl -s -X POST "http://localhost:3000/api/admin/ingest?mode=preview" \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -F "file=@sample.csv"
```

Commit:

```bash
curl -s -X POST "http://localhost:3000/api/admin/ingest?mode=commit" \
  -H "Authorization: Bearer $ADMIN_API_KEY" \
  -F "file=@sample.csv"
```
