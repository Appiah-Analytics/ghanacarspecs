# Roadmap

Phases are numbered in **delivery order** (1 → 7). The engineering detail for each shipped phase is in [`build_log.md`](build_log.md). Canonical test VINs and plates are in [`sample_data.md`](sample_data.md).

| Phase | Theme | Status |
|-------|--------|--------|
| 1 | Local MVP (lookup, seed, report) | Done |
| 2 | External VIN decode (NHTSA) | Done |
| 3 | CSV ingestion | Done |
| 4 | Vehicle intelligence / risk flags | Done |
| 5 | Chassis number support | Done |
| 6 | Local admin dashboard | Done |
| 7 | Infrastructure & deployment | In progress (docs only) |

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
