# Admin record management (Phase 12)

How operators add **timeline events** and **visual evidence URLs** to existing vehicles after CSV ingestion or seed data.

**Related:** [`debugging_neon_seed_photos.md`](debugging_neon_seed_photos.md), [`postgresql.md`](postgresql.md), [`sample_data.md`](sample_data.md)

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

## Add visual evidence (photo URL)

**Form fields:**

| Field | Required | Notes |
|--------|----------|--------|
| Photo URL | Yes | Must start with `/demo-photos/`, `http://`, or `https://` |
| Source type | Yes | `PhotoSourceType` enum (import, inspection, accident/repair, auction, other) |
| Caption | No | Defaults to a generic admin caption if empty |
| Source label | No | e.g. “Partner intake (sample)” |
| Taken at | No | Date picker |

**Demo tip:** Use an existing asset, e.g. `/demo-photos/toyota-tema-port-import.svg`.

**API:** `POST /api/admin/vehicles/[id]/photos` (JSON body, admin auth required).

After success, the page refreshes and shows a confirmation banner.

---

## Add timeline event

**Form fields:**

| Field | Required | Notes |
|--------|----------|--------|
| Event type | Yes | Matches `EventType` enum |
| Event date | Yes | Date picker |
| Source system | Yes | Who reported the event (free text) |
| Mileage | No | Whole km |
| Description | No | Stored in `rawPayload` with `addedFrom: "admin"` |

**API:** `POST /api/admin/vehicles/[id]/events` (JSON body, admin auth required).

---

## Verify on the public report

1. From the manage page, open **Public report** (`/vehicles/[id]`).
2. Confirm **Visual evidence** shows new photo cards (or empty state if none).
3. Confirm **Event history** lists the new event (newest first).
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
npm run db:seed
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
