# Vercel Blob setup (admin image uploads)

GhanaCarSpecs stores admin-uploaded visual evidence in **Vercel Blob**. Public vehicle reports render those URLs like any other `VehiclePhoto.url` (HTTPS).

---

## Prerequisites

- Vercel project linked to this repo (or local dev with a Blob store token)
- Admin auth configured (`ADMIN_API_KEY` or `ADMIN_PASSWORD`)

---

## 1. Create a Blob store

1. Open the [Vercel dashboard](https://vercel.com) → your project → **Storage** → **Create Database / Store** → **Blob**.
2. Name the store (e.g. `ghanacarspecs-evidence`).
3. Connect it to the project. Vercel adds **`BLOB_READ_WRITE_TOKEN`** to project environment variables automatically.

For **local development**, copy the token into `.env` at the repo root:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

Restart `npm run dev` after adding the token.

---

## 2. Upload path layout

Files are stored at:

```text
vehicle-evidence/{vehicleId}/{timestamp}-{sanitized-filename}
```

Example:

```text
vehicle-evidence/clxyz123/1716123456789-port-inspection.jpg
```

Uploads are **public** (`access: 'public'`) so the vehicle report `<img>` can load them without signed URLs.

---

## 3. API

| Endpoint | Auth | Body |
|----------|------|------|
| `POST /api/admin/uploads` | Admin session or Bearer / `X-Admin-Key` | `multipart/form-data`: `file`, `vehicleId` |

**Validation:**

- Image MIME types only (JPEG, PNG, WebP, GIF, AVIF, HEIC)
- Max size **10 MB**
- Executable/script extensions rejected; filenames sanitized

**Success response:**

```json
{ "ok": true, "url": "https://….public.blob.vercel-storage.com/…", "pathname": "vehicle-evidence/…" }
```

**Errors:**

- `401` — not signed in as admin
- `503` — `BLOB_READ_WRITE_TOKEN` missing
- `400` — validation failed

---

## 4. Admin workflow

On `/admin/vehicles/[id]`:

1. Choose **Upload file** (drag/drop or browse) or **Manual URL** (demo paths / external HTTPS).
2. After upload, the **Stored URL** field is filled automatically; preview shows before save.
3. Set source type, provenance, confidence, caption, etc.
4. Click **Add visual evidence** → `POST /api/admin/vehicles/[id]/photos` (unchanged).

---

## 5. Production checklist

- [ ] Blob store connected to the Vercel project
- [ ] `BLOB_READ_WRITE_TOKEN` set in **Production** (and Preview if you test uploads there)
- [ ] `ADMIN_API_KEY` or `ADMIN_PASSWORD` set
- [ ] Upload a test image on `/admin/vehicles/[id]` and confirm it appears on the public report

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Blob storage is not configured` | Add `BLOB_READ_WRITE_TOKEN` to `.env` or Vercel env; restart dev server |
| `401` on upload | Sign in at `/admin/login` |
| `File exceeds 10 MB limit` | Compress or resize the image |
| `Only image files are allowed` | Use JPEG/PNG/WebP/GIF/AVIF/HEIC — not PDF or SVG uploads |
| Image missing on public report | Save the record after upload (upload alone does not create `VehiclePhoto`) |

---

## Related docs

- [`admin_record_management.md`](admin_record_management.md)
- [`evidence_confidence_and_provenance.md`](evidence_confidence_and_provenance.md)
- [`debugging_runtime_and_environment.md`](debugging_runtime_and_environment.md)
