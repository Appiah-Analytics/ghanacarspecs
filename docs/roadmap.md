# Roadmap

Phases are numbered in **delivery order** (1 → 10). The engineering detail for each shipped phase is in [`build_log.md`](build_log.md). Canonical test VINs and plates are in [`sample_data.md`](sample_data.md).

| Phase | Theme | Status |
|-------|--------|--------|
| 1 | Local MVP (lookup, seed, report) | Done |
| 2 | External VIN decode (NHTSA) | Done |
| 3 | CSV ingestion | Done |
| 4 | Vehicle intelligence / risk flags | Done |
| 5 | Chassis number support | Done |
| 6 | Local admin dashboard | Done |
| 7 | Infrastructure & deployment | In progress (docs only) |
| 8 | Basic admin protection | Done |
| 9 | PostgreSQL readiness | Done |
| 10 | Public demo readiness | Done |
| 11 | Vehicle photos / visual evidence (foundation) | Done |
| 12 | Admin record management v1 | Done |
| 13 | Evidence confidence/provenance presentation | Done |
| 14 | Admin image upload (Vercel Blob) | Done |
| 16 | Evidence lifecycle + moderation controls | Done |
| 17 | Public trust UX and transparency layer | Done |
| 18 | Shared vehicle event write path (CSV + admin audit alignment) | Done |
| 18.1 | Admin search and data health dashboard | Done |
| 18.2 | Import quality, duplicate detection, import history | Done |

---

## Phase 1 — Local MVP

- [x] Setup Next.js
- [x] Setup Prisma
- [x] Create lookup API
- [x] Seed database
- [x] Vehicle report page

## Phase 2 — External VIN decode

- [x] External VIN decode fallback (NHTSA vPIC when not in local DB)

## Phase 3 — CSV ingestion

- [x] CSV ingestion pipeline
- [x] Admin upload UI (`/admin/ingest`)

## Phase 4 — Vehicle intelligence

- [x] Risk flags and intelligence panel on local reports

## Phase 5 — Chassis support

- [x] Chassis number support (schema, lookup, CSV, report UI)

## Phase 6 — Admin dashboard

- [x] Local admin dashboard (`/admin`)
- [x] Summary cards (vehicles, events, accidents/claims, chassis, imports)
- [x] Vehicle table with links to `/vehicles/[id]`
- [x] Link from `/admin` to `/admin/ingest`

## Phase 7 — Infrastructure & deployment

- [x] Deployment readiness documentation (`docs/deployment_plan.md`, `.env.example`)
- [ ] Azure deployment (not started — see deployment plan)
- [ ] Monitoring

## Phase 8 — Basic admin protection

- [x] Protect `/admin` and `/admin/ingest` (middleware + API checks)
- [x] `ADMIN_API_KEY` or `ADMIN_PASSWORD` from environment
- [x] Browser sign-in at `/admin/login` (httpOnly session cookie)
- [x] CSV ingest API accepts `Authorization: Bearer` or `X-Admin-Key`
- [x] Public lookup unchanged (no admin secret required)

## Phase 9 — PostgreSQL readiness

- [x] Dual Prisma schema (`schema.prisma` SQLite + `schema.postgresql.prisma`)
- [x] Initial PostgreSQL migration (`prisma/migrations/20260520120000_init`)
- [x] npm scripts for postgres generate, migrate, setup, export/import
- [x] Documentation (`docs/postgresql.md`, deployment plan §6)
- [x] Local SQLite workflow unchanged (`npm run db:setup`)

## Phase 10 — Public demo readiness

- [x] Homepage messaging for Ghana vehicle intelligence & history
- [x] How lookup works (local records + NHTSA fallback)
- [x] Try-the-demo section (`docs/sample_data.md` values)
- [x] Public disclaimer (sample data vs external decode)
- [x] Site metadata and light public UX polish
- [x] No prominent admin link on homepage
- [x] `docs/public_demo_plan.md` (Vercel/Neon checklist for later)

## Phase 11 — Vehicle photos / visual evidence (foundation)

- [x] `VehiclePhoto` model (SQLite + PostgreSQL schemas)
- [x] Seed sample photos (placeholder assets under `public/demo-photos/`)
- [x] **Visual evidence** section on local vehicle reports (`VehiclePhotos`)
- [x] External decode page: labeled “no local photos” notice (not a gallery)
- [ ] Admin photo file upload (future — URLs only in v1)
- [ ] Public user upload (out of scope)

## Phase 12 — Admin record management v1

- [x] Admin navigation (dashboard, CSV ingestion, public lookup)
- [x] `/admin/vehicles/[id]` manage page (identity, events, photos)
- [x] Add visual evidence URL form (`VehiclePhoto`)
- [x] Add timeline event form (`VehicleEvent`)
- [x] Provenance notice on admin manage page
- [x] Protected APIs: `POST /api/admin/vehicles/[id]/photos|events`
- [x] `docs/admin_record_management.md`

## Phase 13 — Evidence confidence & provenance (presentation)

- [x] `confidenceLevel` + `provenanceType` on `VehiclePhoto` and `VehicleEvent`
- [x] PostgreSQL migration + SQLite schema parity
- [x] Seed demo provenance (Toyota importer/internal, VW other, Honda auction/importer) — all LOW confidence
- [x] Admin photo/event forms: provenance + confidence dropdowns
- [x] Public report badges on photos and timeline events
- [x] Visual evidence trust explanation block
- [x] `docs/evidence_confidence_and_provenance.md`
- [ ] Automated confidence scoring (out of scope)
- [ ] Official DVLA/police/insurer API integration (future)

## Phase 14 — Admin image upload (Vercel Blob)

- [x] `@vercel/blob` storage under `vehicle-evidence/{vehicleId}/…`
- [x] `POST /api/admin/uploads` (admin auth, image MIME, 10 MB max, sanitized filenames)
- [x] Admin form: drag/drop, file picker, preview, manual URL fallback
- [x] Auto-fill photo URL → existing `VehiclePhoto` create flow (provenance/confidence unchanged)
- [x] `docs/vercel_blob_setup.md`
- [ ] Image moderation / virus scanning (future)

## Phase 16 — Evidence lifecycle management and moderation controls

- [x] `EvidenceStatus` on `VehiclePhoto` + `VehicleEvent`
- [x] Soft delete fields (`deletedAt`, `deletedBy`) on photos/events
- [x] Admin edit flows for photos/events
- [x] Admin archive (soft delete) actions for photos/events
- [x] Admin moderation status badges
- [x] Public filter: only non-deleted `PUBLISHED` evidence
- [x] Structured audit logging (`lib/audit-log.ts`)
- [x] Admin recent activity section on vehicle manage page
- [x] Moderation guidance copy on admin page
- [x] `docs/evidence_lifecycle_management.md`

## Phase 17 — Public trust UX and transparency layer

- [x] `TrustCenter` on public vehicle reports (confidence, provenance, visibility rules)
- [x] Expandable `ConfidenceHelp` and `ProvenanceHelp` on evidence badges
- [x] `VerificationStatus` and `TransparencyStatement` on reports
- [x] Badge consistency and mobile-friendly layout adjustments
- [x] `docs/public_trust_and_transparency.md`
- [ ] Official registry integrations (future — unchanged scope)

## Phase 18 — Shared vehicle event write path

- [x] `lib/vehicle-event-write.ts` — shared `createVehicleEventRecord()`
- [x] Admin event create uses shared helper (audit preserved)
- [x] CSV ingest uses shared helper per row (LOW / OTHER / PUBLISHED, audit per event)
- [x] Ingest API passes admin identifier into CSV pipeline
- [x] `docs/data_acquisition_and_import_quality.md`
- [ ] Import preview / duplicate detection (Phase 19+)
