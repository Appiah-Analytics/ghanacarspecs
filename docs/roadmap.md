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
