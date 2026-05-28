# Admin record management (Phase 12)

How operators add **timeline events** and **visual evidence URLs** to existing vehicles after CSV ingestion or seed data.

**Related:** [`vercel_blob_setup.md`](vercel_blob_setup.md), [`evidence_confidence_and_provenance.md`](evidence_confidence_and_provenance.md), [`evidence_lifecycle_management.md`](evidence_lifecycle_management.md), [`debugging_neon_seed_photos.md`](debugging_neon_seed_photos.md), [`postgresql.md`](postgresql.md), [`sample_data.md`](sample_data.md)

---

## Access

1. Sign in at `/admin/login` with `ADMIN_API_KEY` or `ADMIN_PASSWORD`.
2. Open **Dashboard** (`/admin`) or **CSV ingestion** (`/admin/ingest`) from admin navigation.
3. From the vehicle table, choose **Manage** for a row (`/admin/vehicles/[id]`).

All admin routes and `/api/admin/*` mutation endpoints require the same session or API secret (middleware unchanged).

---

## Provenance rule

On the manage page:

> Only add information from sources you can explain. Do not enter police, insurer, DVLA, or private claim data unless GhanaCarSpecs has explicit authorization.

Public reports remain demo-safe; do not imply official Ghana records.

---

## Add visual evidence (upload or URL)

### Upload workflow (preferred)

1. On `/admin/vehicles/[id]`, choose **Upload file**.
2. Drag/drop or browse an image (JPEG, PNG, WebP, GIF, AVIF, HEIC — max 10 MB).
3. `POST /api/admin/uploads` stores the file in Vercel Blob and returns a public HTTPS URL (auto-fills **Stored URL**).
4. Set provenance, confidence, source type, caption, etc.
5. Click **Add visual evidence** → `POST /api/admin/vehicles/[id]/photos` creates the `VehiclePhoto` row.

Requires `BLOB_READ_WRITE_TOKEN` in `.env` (local) or Vercel project env. See [`vercel_blob_setup.md`](vercel_blob_setup.md).

### Manual URL fallback

Choose **Manual URL** and paste `/demo-photos/…`, `http://`, or `https://` (including Blob URLs from a previous upload).

**Form fields (save step):**

| Field | Required | Notes |
|--------|----------|--------|
| Photo URL | Yes | From upload or manual entry |
| Source type | Yes | `PhotoSourceType` enum |
| Provenance | Yes | `ProvenanceType` enum |
| Confidence | Yes | `ConfidenceLevel` enum |
| Caption | No | Defaults to a generic admin caption if empty |
| Source label | No | e.g. “Partner intake (sample)” |
| Taken at | No | Date picker |

**APIs:**

| Endpoint | Purpose |
|----------|---------|
| `POST /api/admin/uploads` | Multipart upload (`file`, `vehicleId`) → `{ url }` |
| `POST /api/admin/vehicles/[id]/photos` | JSON create `VehiclePhoto` (unchanged) |

After success, the page refreshes and shows a confirmation banner.

---

## Add timeline event

**Form fields:**

| Field | Required | Notes |
|--------|----------|--------|
| Event type | Yes | Matches `EventType` enum |
| Event date | Yes | Date picker |
| Source system | Yes | Who reported the event (free text) |
| Provenance | Yes | `ProvenanceType` enum |
| Confidence | Yes | `ConfidenceLevel` enum |
| Mileage | No | Whole km |
| Description | No | Stored in `rawPayload` with `addedFrom: "admin"` |

**API:** `POST /api/admin/vehicles/[id]/events` (JSON body, admin auth required).

---

## Edit and archive evidence (Phase 16)

On `/admin/vehicles/[id]`, each photo and event row now includes **Edit / archive** controls.

- **Edit photo:** caption, source label, provenance, confidence, taken-at, moderation status
- **Edit event:** event type/date, mileage, source system, description, provenance, confidence, moderation status
- **Archive photo/event:** soft delete only (`deletedAt`, `deletedBy`, status `ARCHIVED`)

APIs:

- `PATCH /api/admin/vehicles/[id]/photos/[photoId]`
- `DELETE /api/admin/vehicles/[id]/photos/[photoId]` (archive)
- `PATCH /api/admin/vehicles/[id]/events/[eventId]`
- `DELETE /api/admin/vehicles/[id]/events/[eventId]` (archive)

Public reports only show non-deleted `PUBLISHED` evidence; admin pages can still view archived rows.

---

## Verify on the public report

1. From the manage page, open **Public report** (`/vehicles/[id]`).
2. Confirm **Visual evidence** shows new photo cards with provenance and confidence badges (or empty state if none).
3. Confirm **Event history** lists the new event with badges (newest first).
4. Prefer a **fresh lookup** from `/` by VIN/plate/chassis rather than stale bookmarks.

---

## Production (Neon) reminder

- App and seed use `DATABASE_URL` when it starts with `postgresql://` or `postgres://`.
- Run migrations manually: `npm run db:migrate:postgres` (not during Vercel build).
- Seed demo data on Neon when needed: see [`debugging_neon_seed_photos.md`](debugging_neon_seed_photos.md).

```powershell
$env:DATABASE_URL="postgresql://..."
npm run db:generate:postgres
npm run db:migrate:postgres
npm run db:seed:postgres
```

Confirm `[seed] database: postgresql://…` (masked), not `file:…/dev.db`.

**SQL check (photo counts):**

```sql
SELECT v.vin, COUNT(vp.id) AS photo_count
FROM vehicles v
LEFT JOIN vehicle_photos vp ON vp."vehicleId" = v.id
GROUP BY v.vin
ORDER BY v.vin;
```

---

## What is not in scope

- File upload (URLs only)
- Public user submissions
- DVLA / police / insurer integrations
- Payments or dealer accounts
