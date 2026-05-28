# Evidence lifecycle management (Phase 16)

Phase 16 moves GhanaCarSpecs from simple evidence creation to controlled evidence lifecycle operations while preserving existing lookup behavior.

## Moderation philosophy

Evidence should be publishable only when reasonably attributable and operationally defensible. Lifecycle metadata exists to reduce accidental trust inflation and keep visibility rules explicit.

Core reminders:

- Confidence reflects evidence quality, not legal certainty.
- Provenance describes source class, not guaranteed truth.
- Avoid defamatory or speculative descriptions.

## Lifecycle states

`EvidenceStatus` is shared by `VehiclePhoto` and `VehicleEvent`:

- `DRAFT`
- `REVIEWED`
- `PUBLISHED`
- `REJECTED`
- `ARCHIVED`

Current default behavior:

- Admin-created records default to `PUBLISHED` for operational continuity.
- Model supports future moderation expansion without schema redesign.

## Soft delete philosophy

Both evidence tables now support:

- `deletedAt DateTime?`
- `deletedBy String?`

Archive actions are soft-delete operations:

- set `deletedAt`
- set `deletedBy`
- set `status = ARCHIVED`

No hard delete endpoint exists in this phase.

## Public visibility rules

Public vehicle reports render only evidence that is:

1. `status = PUBLISHED`
2. `deletedAt IS NULL`

Admin pages can see all lifecycle states, including archived records.

## Audit logging approach

`lib/audit-log.ts` provides append-only structured audit entries via structured logs.

Logged actions:

- create
- edit
- archive
- status changes

Each entry includes:

- timestamp
- admin identifier
- entity type (`vehicle_photo` / `vehicle_event`)
- entity id
- action
- before snapshot (partial)
- after snapshot (partial)

Current storage strategy:

- structured console logging (JSON) via existing logger
- no DB audit table yet

## Operational recommendations

1. Keep `PUBLISHED` default for speed, but require status review in edit flows.
2. Use archived state instead of destructive deletion.
3. Review evidence text for accusatory language before publish.
4. Treat moderation metadata as production-critical operational data.

## Future moderation roadmap

Recommended next steps:

1. Add dedicated review queue (`DRAFT` / `REVIEWED` focus)
2. Add actor-aware admin identity (per-user accounts)
3. Add persistent audit storage (DB table or secure log sink)
4. Add reason codes for rejection/archival
5. Add optional two-step publish confirmation for sensitive evidence
