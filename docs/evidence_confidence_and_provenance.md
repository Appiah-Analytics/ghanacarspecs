# Evidence confidence and provenance

## Purpose

GhanaCarSpecs is a **trust and provenance** platform, not only a vehicle lookup tool. Every visual evidence item and timeline event carries metadata so users can see **where information came from** and **how reliable it is estimated to be** — before treating it like an official record.

This phase adds **data fields and UI badges** only. There is no automated scoring, moderation queue, or external API integration yet.

## Trust model

| Layer | What it means |
|-------|----------------|
| **Provenance** | Who or what kind of source produced the record (importer, auction, demo, etc.). |
| **Confidence** | Estimated reliability tier for that record on GhanaCarSpecs (not a legal certification). |

Demonstration placeholders, user-submitted URLs, and partner samples are **explicitly not** equivalent to DVLA, police, insurer, or government-sourced records unless provenance and confidence are set accordingly — and even then, GhanaCarSpecs does not claim official verification without a future integration.

## Confidence levels

| Value | Badge (UI) | Meaning |
|-------|------------|---------|
| `LOW` | LOW CONFIDENCE | Unverified or weakly supported; typical for demos and early samples. |
| `MEDIUM` | MEDIUM CONFIDENCE | Plausible source with limited corroboration. |
| `HIGH` | HIGH CONFIDENCE | Strong internal or partner attestation; still not a government stamp. |
| `VERIFIED` | VERIFIED | Highest tier on-platform; reserved for records GhanaCarSpecs has explicitly validated (future workflows). |

**Styling:** LOW = gray, MEDIUM = amber, HIGH = blue, VERIFIED = green.

## Provenance types

| Value | Meaning |
|-------|---------|
| `DEMO` | Sample / demonstration data (e.g. seeded SVG placeholders). |
| `USER_SUBMITTED` | Submitted by an end user (future flows). |
| `DEALER` | Dealer or showroom origin. |
| `IMPORTER` | Importer / port intake / shipping chain. |
| `AUCTION` | Pre-sale auction or lot listing. |
| `INTERNAL` | GhanaCarSpecs internal or curated partner sample. |
| `GOVERNMENT` | Government agency (e.g. DVLA) — **future official integration**. |
| `INSURER` | Insurer-reported material. |
| `POLICE` | Police-reported material. |
| `OTHER` | Unclassified; default for legacy or unknown source. |

Seeded demo data uses importer/auction/internal-style provenance with **LOW** confidence so reports stay honest about non-official status.

## Schema

On both `VehiclePhoto` and `VehicleEvent`:

- `confidenceLevel` — enum, default `LOW`
- `provenanceType` — enum, default `OTHER`

PostgreSQL migration: `prisma/migrations/20260520160000_evidence_confidence_provenance/`.

**Local SQLite:**

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

**Neon / PostgreSQL** (set `DATABASE_URL` first — do not use `npm run db:seed`):

```bash
npm run db:generate:postgres
npm run db:migrate:postgres
npm run db:seed:postgres
```

`db:seed` uses the SQLite Prisma schema only. After evidence/provenance migrations on Neon, re-seed with `db:seed:postgres` so demo photos and events include `confidenceLevel` and `provenanceType`.

## Admin

On `/admin/vehicles/[id]`, photo and event forms include **provenance** and **confidence** dropdowns. Existing URL and field validation is unchanged.

## Public report

- Each photo card and timeline event shows provenance + confidence badges.
- Below **Visual evidence**, a short explanation block describes the trust model.

## Future official integrations

Planned later (not in this phase):

- Authorized feeds from DVLA, police, insurers, or other government systems.
- Stricter defaults when `provenanceType` is `GOVERNMENT`, `POLICE`, or `INSURER`.
- Workflow to move confidence to `VERIFIED` only after integration rules pass.

Until then, treat all seeded and admin-entered records as **informational** unless your organization has separate legal verification.

## Related docs

- [`admin_record_management.md`](admin_record_management.md) — adding photos and events
- [`debugging_neon_seed_photos.md`](debugging_neon_seed_photos.md) — production seed runbook
- [`roadmap.md`](roadmap.md) — phase tracking
