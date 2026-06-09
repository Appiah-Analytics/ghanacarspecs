# GhanaCarSpecs — Engineering Build Log

Living record of major engineering work on [GhanaCarSpecs.com](https://github.com/Appiah-Analytics/ghanacarspecs).  
Update this file after every major feature or phase.

**Last updated:** 2026-06-07 (phase 26 share and reference foundation)  
**Current stack:** Next.js 15 (App Router), TypeScript, Prisma, SQLite (local default) / PostgreSQL (production-ready), NHTSA vPIC

**Phase numbering:** Matches [`roadmap.md`](roadmap.md) Phases 1–10. Sample VINs, plates, and chassis numbers are centralized in [`sample_data.md`](sample_data.md).

---

## How to use this log

When you ship a meaningful feature:

1. Add or extend a phase section below (or add **Phase N**).
2. Fill in all six subsections: goal, files, behavior, testing, limitations, next step.
3. Bump **Last updated** at the top.
4. Cross-check `docs/roadmap.md`, `README.md`, and `docs/sample_data.md` if test values changed.

---

---

## Phase 26 — Share & reference foundation

### Goal

Add deterministic report references and copy-link sharing across public report, print, PDF, and admin surfaces — no schema changes.

### Files added / changed

| Area | Paths |
|------|--------|
| Reference helper | `lib/report-reference.ts` |
| URL helpers | `lib/report-url.ts` |
| UI | `components/ReportReferenceBlock.tsx`, `components/CopyReportLinkButton.tsx` |
| Surfaces | `components/VehicleReport.tsx`, `components/PrintableVehicleReport.tsx`, `components/PrintReportActions.tsx`, `lib/generate-vehicle-report-pdf.ts`, `app/admin/vehicles/[id]/page.tsx` |
| Styles | `app/globals.css` |
| Docs | `docs/phase_26_share_and_reference_foundation.md`, ADR-013, roadmap, README, handoff |

### Behavior

- `buildReportReference()` returns `GCS-{normalized}` using VIN → chassis → plate → id priority.
- Same reference on public report, print view, PDF identity section, and admin manage hero.
- **Copy report link** copies `window.location.href` with copied/unavailable feedback.

### Testing

- `npm run lint`, `npm run build`
- Toyota seed: reference `GCS-4T1BE46K37U123456` on report, print, PDF, admin.
- Honda (no plate): reference uses VIN.

### Limitations

- No share tokens, short links, QR, or email share.
- Copy link shares full URL only (not reference lookup).
- Local records only.

### Next step

- Optional GCS reference lookup route.

Phase 26 share and reference foundation implemented.

---

## Post-Phase 25 stabilization

Small hardening before Phase 26:

- **Public lookup API:** Removed `rawPayload` from `POST /api/v1/lookup` event objects. Response now returns only `id`, `eventType`, `eventDate`, `mileage`, and `sourceSystem`. Public report pages unchanged (`/vehicles/[id]` still loads via `getVehicleForReport`).
- **PDF export:** `generateVehicleReportPdf()` builds `buildVehicleReportBundle()` once and passes the bundle into `renderPdfContent()` (no duplicate scoring work).

Verified: `npm run lint`, `npm run build`.

---

## Phase 25 — Server-side PDF export

### Goal

Add downloadable PDF export for local vehicle reports using the Phase 22 export summary pipeline — narrow scope, no schema changes.

### Files added / changed

| Area | Paths |
|------|--------|
| API route | `app/api/vehicles/[id]/export/pdf/route.ts` |
| PDF builder | `lib/generate-vehicle-report-pdf.ts` |
| URL helper | `lib/vehicle-pdf-export-url.ts` |
| Entry points | `components/VehicleReport.tsx`, `components/PrintReportActions.tsx`, `app/admin/vehicles/[id]/page.tsx` |
| Config | `next.config.ts` (`serverExternalPackages: ["pdfkit"]`) |
| Dependency | `pdfkit`, `@types/pdfkit` |
| Docs | `docs/pdf_export.md`, ADR-012, `README.md`, handoff, roadmap |

### Behavior

- `GET /api/vehicles/[id]/export/pdf` returns attachment PDF (`ghanacarspecs-{VIN}.pdf`).
- Content mirrors Phase 24 print sections: executive summary, scores, specs, events table, disclaimer.
- 404 for unknown vehicle; 500 on generation failure.
- Download PDF links on public report, print view, and admin manage.

### Testing

- `npm run lint`, `npm run build`
- Seeded Toyota: PDF downloads with identity, scores, event table.
- Invalid vehicle id: 404 JSON.

### Limitations

- Local records only (no NHTSA-only PDF).
- No embedded photo thumbnails.
- No public share links or payments.

### Next step

- Comparison PDF export bundle.

Phase 25 server-side PDF export implemented.

---

## Phase 24 — Report export readiness / print-friendly report

### Goal

Add a clean printable report page reusing Phase 22 export summary data — browser print/save-as-PDF before server-side PDF generation.

### Files added / changed

| Area | Paths |
|------|--------|
| Print page | `app/vehicles/[id]/print/page.tsx` |
| UI | `components/PrintableVehicleReport.tsx`, `components/PrintReportActions.tsx` |
| Entry points | `components/VehicleReport.tsx`, `app/admin/vehicles/[id]/page.tsx` |
| Styles | `app/globals.css` (print route, `@media print`) |
| Docs | `docs/report_export_print.md`, ADR-011, `README.md`, handoff, roadmap |

### Behavior

- `/vehicles/[id]/print` renders a document-style report from `buildReportExportSummary()`.
- Print button triggers browser print; site header/footer hidden on print route and in print media.
- Compact event table; photo count note (no embedded images).
- `robots: noindex` on print page metadata.

### Testing

- `npm run lint`, `npm run build`
- Seeded Toyota report: print preview shows executive summary, scores, specs, events.
- Print media hides actions and site chrome.

### Limitations

- No server-side PDF download.
- No embedded photos in print output.
- Local records only (same scope as public report).
- NHTSA-only decodes have no print route.

### Next step

- Server-side PDF export reusing `ReportExportSummary` structure.

Phase 24 print-friendly report implemented.

---

## Phase 23 — Vehicle comparison UI

### Goal

Add a buyer-friendly side-by-side comparison page using Phase 22 comparison snapshots — no duplicate scoring or lookup changes.

### Files added / changed

| Area | Paths |
|------|--------|
| Compare page | `app/compare/page.tsx` |
| UI | `components/VehicleComparison.tsx`, `components/VehicleComparisonForm.tsx` |
| Resolution | `lib/resolve-vehicle-comparison.ts`, `lib/vehicle-comparison-interpret.ts` |
| Entry points | `components/VehicleReport.tsx`, `app/admin/vehicles/[id]/page.tsx`, `app/page.tsx` |
| Styles | `app/globals.css` (compare grid, mobile stack) |
| Docs | `docs/vehicle_comparison_ui.md`, ADR-010, `README.md`, handoff, roadmap |

### Behavior

- `/compare?a=IDENTIFIER&b=IDENTIFIER` resolves both vehicles via existing lookup + report bundle.
- Side-by-side identity, scores, evidence counts, and intelligence signals.
- Missing vehicle messages when one or both identifiers fail lookup.
- Cautious interpretation summary when both vehicles are found.
- Mobile: columns stack at ≤720px.

### Testing

- `npm run lint`, `npm run build`
- Toyota vs VW: higher trust on Toyota, higher risk on VW, accident count visible on VW.
- Toyota vs Honda: identity/evidence differences visible.
- Valid + invalid identifier: not-found messages.
- Compare link from public report pre-fills Vehicle A.

### Limitations

- Local records only (no NHTSA-only decode comparison).
- No PDF, share links, or payment.
- Report “Compare this vehicle” pre-fills only Vehicle A.

### Next step

- Row-level delta highlighting or export bundle including comparison.

Phase 23 Vehicle Comparison UI implemented.

---

## Phase 22 — Report presentation and comparison foundation

### Goal

Improve report readability with an executive summary and reusable comparison/export structures without PDF or comparison UI.

### Files added / changed

| Area | Paths |
|------|--------|
| Report bundle | `lib/vehicle-report-bundle.ts` |
| Executive summary | `lib/vehicle-executive-summary.ts`, `components/VehicleExecutiveSummary.tsx` |
| Comparison foundation | `lib/vehicle-comparison.ts` |
| Export readiness | `lib/report-export-summary.ts` |
| Public report | `components/VehicleReport.tsx` (section order) |
| Admin manage | `app/admin/vehicles/[id]/page.tsx` |
| Styles | `app/globals.css` |
| Docs | `docs/report_presentation_and_comparison_foundation.md`, `docs/architecture_decisions.md` (ADR-009), `README.md`, `docs/project_handoff_master.md`, `docs/build_log.md`, `docs/roadmap.md` |

### Behavior implemented

- Executive summary near top of public and admin reports.
- Reordered public report sections (summary → trust → risk → specs → intelligence → evidence → timeline → trust blocks).
- `buildVehicleComparisonSnapshot()` and `buildReportExportSummary()` for future Phase 23+ features.

### How it was tested

- `npm run lint`, `npm run build`
- Seeded Toyota/VW executive summary spot checks

### Known limitations

- No PDF export, share links, or comparison UI.
- Executive summary uses published evidence only (matches public visibility).

### Next recommended step

- Phase 23 vehicle comparison UI using comparison snapshots.

---

Phase 22 Report Presentation and Comparison Foundation implemented.

---

## Phase 21 — Vehicle risk profile

### Goal

Add an explainable Vehicle Risk Profile (0–100, higher = more concern) separate from Trust Score to help buyers understand possible worry areas.

### Files added / changed

| Area | Paths |
|------|--------|
| Risk engine | `lib/vehicle-risk-profile.ts` |
| UI | `components/VehicleRiskProfile.tsx` |
| Public report | `components/VehicleReport.tsx` |
| Admin manage | `app/admin/vehicles/[id]/page.tsx` |
| Styles | `app/globals.css` |
| Docs | `docs/vehicle_risk_profile.md`, `docs/architecture_decisions.md` (ADR-008), `README.md`, `docs/project_handoff_master.md`, `docs/build_log.md`, `docs/roadmap.md`, `docs/public_trust_and_transparency.md` |

### Behavior implemented

- Rule-based risk factors (accident/claim/theft, mileage gaps, completeness, import context).
- Positive signals and recommendations with non-accusatory language.
- Trust vs risk separation copy on every panel.

### How it was tested

- `npm run lint`, `npm run build`
- Seeded Toyota/VW/Honda risk profile spot checks

### Known limitations

- No external verification integrations; sparse records may under-signal risk.
- Admin dashboard risk filtering not implemented.

### Next recommended step

- Admin dashboard sort/filter by risk level.

---

Phase 21 Vehicle Risk Profile implemented.

---

## Phase 20 — Vehicle trust score

### Goal

Add an explainable 0–100 Vehicle Trust Score to public reports and admin vehicle pages as a completeness/traceability signal.

### Files added / changed

| Area | Paths |
|------|--------|
| Scoring engine | `lib/vehicle-trust-score.ts` |
| UI | `components/VehicleTrustScore.tsx` |
| Public report | `components/VehicleReport.tsx` |
| Admin manage | `app/admin/vehicles/[id]/page.tsx` |
| Styles | `app/globals.css` |
| Docs | `docs/vehicle_trust_score.md`, `README.md`, `docs/project_handoff_master.md`, `docs/build_log.md`, `docs/roadmap.md`, `docs/public_trust_and_transparency.md` |

### Behavior implemented

- Rule-based score from published evidence volume/quality, record completeness, provenance diversity, and risk/mileage adjustments.
- Bands: Strong / Moderate / Limited / Weak with reasons and cautions.
- Standard non-certification disclaimer on every display.

### How it was tested

- `npm run lint`, `npm run build`
- Seeded Toyota, VW, and Honda trust score spot checks

### Known limitations

- No external registry integration; score is not legal proof.
- Admin dashboard list filtering by score not implemented.

### Next recommended step

- Admin dashboard sort/filter by trust band for records needing stronger evidence.

---

Phase 20 Vehicle Trust Score implemented.

---

## Phase 19 — Event idempotency and import preview

### Goal

Prevent duplicate event inserts on CSV re-import and add a preview-before-commit workflow for admins.

### Files added / changed

| Area | Paths |
|------|--------|
| Event idempotency | `lib/event-idempotency.ts` |
| Ingest | `lib/csv-ingest.ts` (`mode: preview \| commit`, idempotent event inserts) |
| Validation report | `lib/import-validation.ts` (events/vehicles breakdown) |
| Import history | `lib/import-history.ts` (eventsInserted, eventsSkipped, duplicateEventsSkipped) |
| API | `app/api/admin/ingest/route.ts` (`mode` form/query param) |
| UI | `components/CsvUploadForm.tsx`, `components/ImportHistoryPanel.tsx`, `app/admin/ingest/page.tsx` |
| Docs | `docs/event_idempotency_and_import_preview.md`, `README.md`, `docs/data_acquisition_and_import_quality.md`, `docs/project_handoff_master.md`, `docs/build_log.md`, `docs/roadmap.md` |

### Behavior implemented

- Event fingerprint: vehicleId + eventType + eventDate + mileage + sourceSystem.
- Duplicate events skipped (DB + in-file) with warnings; no create audit logs for skips.
- Preview mode performs zero DB writes; commit uses shared plan then upserts vehicles and inserts new events only.
- Import history records committed imports only.

### How it was tested

- `npm run lint`, `npm run build`
- Manual preview/commit and re-commit idempotency checks

### Known limitations

- Commit re-uploads file (no server-side preview cache).
- Description excluded from fingerprint.
- Import history remains local JSON.

### Next recommended step

- Optional server-side staged import token if operators need preview/commit without re-selecting file.

---

Phase 19 Event Idempotency and Import Preview implemented.

---

## Phase 18.2 — Import quality, duplicate detection, and import history

### Goal

Improve CSV import operational visibility with duplicate warnings, structured validation reports, quality scoring, and lightweight import history — without schema migrations or import preview.

### Files added / changed

| Area | Paths |
|------|--------|
| Duplicate detection | `lib/duplicate-detection.ts` |
| Validation report | `lib/import-validation.ts` |
| Quality score | `lib/import-quality-score.ts` |
| Import history | `lib/import-history.ts` (`prisma/data/import-history.json`) |
| Ingest | `lib/csv-ingest.ts`, `app/api/admin/ingest/route.ts` |
| UI | `components/CsvUploadForm.tsx`, `components/ImportHistoryPanel.tsx`, `app/admin/ingest/page.tsx`, `app/globals.css` |
| Docs | `README.md`, `docs/data_acquisition_and_import_quality.md`, `docs/project_handoff_master.md`, `docs/build_log.md`, `docs/roadmap.md` |

### Behavior implemented

- Pre-import duplicate scan (DB + in-file plate/chassis); warnings only, import proceeds.
- API returns `report` + `quality` on success and validation failure.
- Successful imports append to JSON import history (last 10 shown on ingest page).
- Cross-VIN chassis conflict downgraded from hard error to warning.

### How it was tested

- `npm run lint`, `npm run build`
- Manual CSV uploads (valid, duplicate VIN, duplicate plate/chassis)

### Known limitations

- No import preview / dry-run UI.
- Re-uploading the same CSV still inserts duplicate events.
- Import history is local JSON (not shared across serverless instances).

### Next recommended step

- Import preview (dry-run) before commit.

---

Phase 18.2: duplicate detection, import quality scoring, validation reporting, and import history implemented.

---

## Phase 18.1 — Admin search and data health

### Goal

Improve operator visibility and navigation of growing vehicle datasets with server-side search and a data health panel on the admin dashboard.

### Files added / changed

| Area | Paths |
|------|--------|
| Data layer | `lib/admin-dashboard.ts` (`getAdminDataHealth`, search filter on `getAdminVehicleRows`) |
| UI | `app/admin/page.tsx` (search form, data health section) |
| Styles | `app/globals.css` (admin search layout) |
| Docs | `README.md`, `docs/project_handoff_master.md`, `docs/build_log.md`, `docs/roadmap.md` |

### Behavior implemented

- GET search on `/admin?q=` filters vehicles by VIN, plate number, or chassis number (case-insensitive partial match).
- Data health panel shows totals for vehicles, events, photos; vehicles with VIN/plate/chassis; and published/draft/archived evidence counts (events + photos by `status`).
- No changes to lookup, trust center, moderation, auth, CSV import, or Prisma schema.

### How it was tested

- `npm run lint`, `npm run build`
- Manual search by VIN, plate, and chassis; count verification against database

### Known limitations

- Search does not normalize chassis spacing; matches stored values only.
- Evidence counts are by lifecycle `status`, not soft-delete (`deletedAt`).

### Next recommended step

- Import preview and duplicate detection for CSV ingestion (Phase 18 follow-on).

---

Phase 18.1 Admin Search and Data Health dashboard implemented.

---

## Phase 18 — Shared vehicle event write path (CSV + admin)

### Goal

Align CSV ingestion with Phase 16 evidence lifecycle and audit architecture using one shared event creation helper — before import preview, duplicate reports, or quality scoring.

### Files added / changed

| Area | Paths |
|------|--------|
| Shared write | `lib/vehicle-event-write.ts` |
| Admin events | `lib/admin-record-mutations.ts` (`createAdminVehicleEvent` delegates to helper) |
| CSV ingest | `lib/csv-ingest.ts` (per-row helper inside transaction; `adminIdentifier` parameter) |
| API | `app/api/admin/ingest/route.ts` (passes `getAdminIdentifierFromRequest`) |
| Docs | `docs/data_acquisition_and_import_quality.md`, `README.md`, `docs/project_handoff_master.md`, `docs/build_log.md`, `docs/roadmap.md` |

### Behavior implemented

- `createVehicleEventRecord()` supports `importedFrom: "admin" | "csv"`.
- CSV events: `LOW` / `OTHER` / `PUBLISHED` with row-level audit logs.
- Admin manual create: unchanged validation; still requires `sourceSystem`; keeps `addedFrom: "admin"` in payload.
- Replaced `vehicleEvent.createMany` with per-row helper calls in existing transaction.

### How it was tested

- `npm run lint`, `npm run build`

### Known limitations

- No import preview or duplicate detection yet.
- Re-uploading the same CSV still inserts duplicate events.

### Next recommended step

- Import preview (dry-run) and duplicate report before commit.

---

Phase 18 foundation: CSV ingestion aligned with shared evidence event write/audit path.

---

## Phase 17 — Public trust UX and transparency layer

### Goal

Improve public trust, clarity, and transparency on vehicle reports without changing evidence lifecycle logic, moderation workflow, audit logging, or database schema.

### Files added / changed

| Area | Paths |
|------|--------|
| Trust UI | `components/TrustCenter.tsx`, `components/ConfidenceHelp.tsx`, `components/ProvenanceHelp.tsx`, `components/VerificationStatus.tsx`, `components/TransparencyStatement.tsx` |
| Content | `lib/trust-content.ts` |
| Integration | `components/VehicleReport.tsx`, `components/EvidenceBadges.tsx`, `components/VehiclePhotos.tsx` |
| Styles | `app/globals.css` (badge help panels, trust center, verification lists, mobile tweaks) |
| Docs | `docs/public_trust_and_transparency.md`, `README.md`, `docs/roadmap.md`, `docs/project_handoff_master.md`, `docs/build_log.md` |

### Behavior implemented

- **Trust center** on public reports: confidence levels, provenance categories, visibility rules.
- **Expandable badges:** tap provenance/confidence on photos and events for plain-language help.
- **Verification status:** current capabilities vs not-yet-available integrations.
- **Transparency statement** at bottom of reports.
- **VERIFIED** explicitly documented as not legal/government certification.

### How it was tested

- `npm run lint`, `npm run build`
- Manual: vehicle report — trust center, badge help, verification section, transparency copy, mobile layout

### Known limitations

- Help uses native `<details>` (no hover tooltips on desktop).
- External NHTSA decode page does not include full trust center (local reports only).

### Next recommended step

- Optional link from homepage/demo disclaimer to trust documentation.
- Partner-specific provenance copy when official feeds are integrated.

---

Phase 17 Public Trust UX and Transparency Layer implemented.

---

## Phase 16 — Evidence lifecycle management and moderation controls

### Goal

Extend evidence handling from create-only into controlled lifecycle operations with moderation states, soft delete, and auditability while preserving public lookup behavior.

### Files added / changed

| Area | Paths |
|------|--------|
| Schema | `prisma/schema.prisma`, `prisma/schema.postgresql.prisma`, `prisma/migrations/20260528103000_evidence_lifecycle_management/` |
| API | `app/api/admin/vehicles/[id]/photos/[photoId]/route.ts`, `app/api/admin/vehicles/[id]/events/[eventId]/route.ts`, updates to existing create routes |
| Lib | `lib/admin-record-mutations.ts`, `lib/audit-log.ts`, `lib/vehicle-report.ts`, `lib/lookup.ts`, `lib/evidence-metadata.ts`, `lib/admin-form-options-client.ts` |
| Components/UI | `AdminEditPhotoForm.tsx`, `AdminEditEventForm.tsx`, `EvidenceStatusBadge.tsx`, `app/admin/vehicles/[id]/page.tsx`, `components/AdminAddPhotoForm.tsx`, `components/AdminAddEventForm.tsx`, `app/globals.css` |
| Docs | `docs/evidence_lifecycle_management.md`, `README.md`, `docs/admin_record_management.md`, `docs/roadmap.md`, `docs/project_handoff_master.md` |

### Behavior implemented

- Added `EvidenceStatus` enum and status fields on photos/events (`DRAFT`, `REVIEWED`, `PUBLISHED`, `REJECTED`, `ARCHIVED`) with create default `PUBLISHED`.
- Added soft delete metadata (`deletedAt`, `deletedBy`) and archive actions for photos/events.
- Added admin edit forms for photo/event metadata, confidence/provenance, and moderation status.
- Public report filtering now only renders non-deleted `PUBLISHED` evidence.
- Added append-only structured audit logging for create/edit/archive/status-change actions.

### How it was tested

- `npm run lint`, `npm run build`
- Manual flow: create photo/event, edit, archive, verify hidden from public report, verify admin status badges and activity feed.

### Known limitations

- Audit logs are structured runtime logs only (no DB audit table yet).
- Moderation workflow is stateful but still admin-driven (no queue/assignment workflow).
- Archive is soft-delete only; no permanent delete in this phase.

### Next recommended step

- Add persistent audit table + moderation queue UI (review assignment + publish approvals).

---

## Project handoff master documentation update

- Comprehensive project handoff and operational architecture documentation added.
- `docs/project_handoff_master.md` expanded as the primary operational memory reference for architecture, workflows, debugging, deployment, and recovery.

---

## Runtime/environment documentation update

- Runtime/environment debugging documentation added after Linux + Prisma + Neon + Blob validation.
- New runbook: [`debugging_runtime_and_environment.md`](debugging_runtime_and_environment.md).

---

## Phase 1 — Local MVP foundation

### Goal

Deliver a working **local-first** vehicle lookup app: user enters a VIN or plate, the app queries SQLite, and shows vehicle specs plus an event timeline. No cloud, auth, or payments.

### Files added / changed

| Area | Paths |
|------|--------|
| App shell | `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `app/not-found.tsx`, `next.config.ts`, `tsconfig.json`, `package.json` |
| API | `app/api/v1/lookup/route.ts` |
| Pages | `app/vehicles/[id]/page.tsx` |
| Components | `components/LookupForm.tsx`, `components/VehicleReport.tsx`, `components/EventTimeline.tsx` |
| Data | `prisma/schema.prisma`, `prisma/seed.ts`, `lib/prisma.ts`, `lib/lookup.ts` |
| Docs | `README.md`, `docs/product_vision.md`, `docs/project.md`, `docs/architecture.md`, `docs/roadmap.md` |
| Tooling | `.gitignore`, `CHANGELOG.md` |

### Behavior implemented

- **Prisma models:** `Vehicle` (unique VIN, optional plate, specs, import metadata) and `VehicleEvent` (`EventType` enum, date, mileage, source, `rawPayload` JSON).
- **Lookup:** `POST /api/v1/lookup` with `{ "vinOrPlate": string }`. VIN normalized (17 chars, uppercase). Plate matched by alphanumeric key so `GR-1234-21` and `gr 1234-21` align.
- **UI:** Home lookup form; success navigates to `/vehicles/[id]`; 404 shows “No record found” on the home page.
- **Report:** Spec grid + event timeline (newest first), last known mileage, placeholder CTA for future paid reports.
- **Seed:** Three sample vehicles (Toyota with plate, VW with plate, Honda VIN-only) with realistic events.

### How it was tested

- `npm install`, `npm run db:setup`, `npm run dev`
- Browser: seeded VINs and plates from `prisma/seed.ts`
- API: `curl` / `Invoke-RestMethod` against `POST /api/v1/lookup`
- `npm run lint` (`tsc --noEmit`), `npm run build`

**Sample values:** See [`sample_data.md`](sample_data.md). Seeded vehicles:

| Vehicle | VIN | Plate | Chassis |
|---------|-----|-------|---------|
| Toyota Camry 2007 | `4T1BE46K37U123456` | `GR-1234-21` | `BE46K37U123456` |
| Volkswagen Golf 2014 | `WVWZZZ3CZWE123456` | `GT 5678-22` | `ZZZ3CZWE123456` |
| Honda Accord 1991 | `1HGBH41JXMN109186` | *(none)* | `BH41JXMN109186` |

### Known limitations

- SQLite only; not suitable for multi-user production without migration.
- No auth; anyone with the URL can use the app locally.
- Plate lookup scans vehicles with non-null plates (fine for MVP scale).
- Marketing site (Squarespace) out of repo; lookup app is separate.
- Dev server can be slow on first boot under OneDrive (documented in README).

### Next recommended step

Add external VIN decode when local DB has no row (Phase 2), then CSV ingestion for real partner-style data (Phase 3).

---

## Phase 2 — External VIN decode fallback

### Goal

Keep **local database lookup first**. If a **17-character VIN** is not in SQLite, call a **free** external decoder and return specs with a clear label that the result is **not** a GhanaCarSpecs history record.

### Files added / changed

| Area | Paths |
|------|--------|
| External API client | `lib/nhtsa-vin.ts` |
| Lookup orchestration | `lib/lookup.ts` (`resolveLookupWithExternalVin`, `ResolveLookupOutcome`) |
| Labels / storage | `lib/record-source.ts`, `lib/lookup-storage.ts` |
| API | `app/api/v1/lookup/route.ts` (extended response shapes) |
| UI | `components/SourceBanner.tsx`, `components/ExternalVinReport.tsx`, `app/decoded/page.tsx` |
| UI updates | `components/LookupForm.tsx`, `components/VehicleReport.tsx`, `app/page.tsx`, `app/globals.css` |
| Docs | `README.md`, `docs/roadmap.md` |

### Behavior implemented

- **Provider:** [NHTSA vPIC](https://vpic.nhtsa.dot.gov/api/) `DecodeVinValues` — no API key, 15s timeout.
- **Flow:** Local lookup → if miss and input is 17-char VIN → NHTSA decode → else 404 (plates never trigger external).
- **API labels:** `recordSource` / `recordSourceLabel`: `local` = “Local GhanaCarSpecs record”, `external` = “External VIN decoded record”.
- **Local hit:** Unchanged navigation to `/vehicles/[id]` + green source banner.
- **External hit:** JSON stored in `sessionStorage`, redirect to `/decoded` + blue source banner; specs grid from decode; empty history note.
- **Failures:** HTTP 502 when NHTSA returns unusable data, with `detail` message.

### How it was tested

- Seeded VIN still resolves **local** (e.g. `4T1BE46K37U123456`).
- Non-seeded valid VIN (e.g. `1HGCM82633A004352`) → `/decoded` with external banner.
- Unknown plate → 404 on home (no external call).
- `npm run lint`, `npm run build`
- Git Bash / PowerShell `curl` against lookup API (use correct port if 3001).

### Known limitations

- External decode is **US-oriented** (NHTSA); Ghana-specific registry not integrated.
- No persistence of external decodes in DB.
- `sessionStorage` for `/decoded` is lost on new tab / clear storage; deep-link to decode result not supported.
- No intelligence/risk layer on external pages (no local events).
- Requires outbound HTTPS to `vpic.nhtsa.dot.gov`.

### Next recommended step

CSV ingestion so more vehicles exist locally before fallback (Phase 3).

---

## Phase 3 — CSV ingestion pipeline

### Goal

Allow **local admin** import of vehicle and event rows from CSV into SQLite: validate file, upsert vehicles by VIN, insert events, surface row-level errors. No auth, no Azure.

### Files added / changed

| Area | Paths |
|------|--------|
| Ingestion logic | `lib/csv-ingest.ts` |
| API | `app/api/admin/ingest/route.ts` |
| Admin UI | `app/admin/ingest/page.tsx`, `components/CsvUploadForm.tsx` |
| Styles | `app/globals.css` (admin cards, alerts, template block) |
| Docs | `README.md`, `docs/roadmap.md` |

### Behavior implemented

- **Page:** `/admin/ingest` — upload form, embedded CSV template, validation rules list.
- **Upload:** `POST /api/admin/ingest` (`multipart/form-data`, field `file`, `.csv` only).
- **Columns:** Required `vin`, `make`, `model`, `year`, `eventType`, `eventDate`; optional `plateNumber`, `chassisNumber`, `mileage`, `sourceSystem`, `description`.
- **Validation (all-or-nothing):** Header checks; VIN length 17; year range; enum event types; valid dates; integer mileage; **no conflicting VIN rows** (make/model/year/plate) within the same file.
- **Write:** Transaction — `vehicle.upsert` by VIN, `vehicleEvent.createMany`; `description` → `rawPayload.description` + `importedFrom: "csv"`.
- **UI feedback:** Success summary (created/updated vehicles, events inserted) or numbered row errors; nothing written on validation failure.

### How it was tested

- `npm run dev` → open `/admin/ingest` (or `:3001` if port busy).
- Upload README template (e.g. `JTDKN3DU0A0123456` / `GR-9000-24`).
- Lookup imported VIN and plate on home → local report with events.
- Upload conflict CSV (same VIN, different make on row 2) → errors, no DB change.
- `npm run lint`, `npm run build`
- Programmatic smoke via `ingestVehicleEventsCsv()` + `resolveLookupWithExternalVin()` (dev script, not committed).

### Known limitations

- **No authentication** — admin URL is open on localhost; not for public deployment as-is.
- Single-file, synchronous import; no queue or large-file streaming.
- Custom CSV parser (quoted fields); exotic Excel exports may need cleanup.
- Does not dedupe events (re-upload creates duplicate events).
- Plate assignment on update only fills empty plate; conflicts rejected at validation time.
- Lookup flow unchanged; no ingest audit log table.

### Next recommended step

Vehicle intelligence / risk signals on local reports (Phase 4), then production hardening (Azure, auth) when ready.

---

## Phase 4 — Vehicle intelligence / risk layer

### Goal

Add a **simple intelligence layer** on local records: mileage checks, accident flag, import indicator, service continuity score, timeline summary, and history confidence — without changing lookup routing or adding auth/Azure.

### Files added / changed

| Area | Paths |
|------|--------|
| Analysis | `lib/vehicle-intelligence.ts` |
| UI | `components/VehicleIntelligence.tsx` |
| Integration | `components/VehicleReport.tsx`, `app/api/v1/lookup/route.ts` |
| Styles | `app/globals.css` (intel grid/cards) |
| Docs | `README.md`, `docs/roadmap.md` |

### Behavior implemented

Computed in `analyzeVehicleIntelligence()` from vehicle + events:

| Signal | Logic (summary) |
|--------|------------------|
| **Mileage inconsistency** | Drops between dated readings; jumps &gt; ~80k km/year flagged. |
| **Accident risk flag** | Flagged if any `ACCIDENT` or `INSURANCE_CLAIM` events. |
| **Imported vehicle** | Import event, `importDate`, or non-Ghana `countryOfOrigin`. |
| **Service continuity** | Score 0–100 from service count vs. years of history; label Strong/Moderate/Limited/Unknown. |
| **Timeline summary** | Prose summary: event counts by type, span, accident note. |
| **History confidence** | Score 0–100 from event count, type diversity, mileage coverage, source diversity, service score; label High/Medium/Low. |

- **UI:** “Vehicle intelligence” section on `/vehicles/[id]` between specs and event history.
- **API:** Local lookup responses include `intelligence` object (same structure).
- **External decode:** Unchanged; no intelligence block (no local events).

### How it was tested

- **Toyota** `4T1BE46K37U123456` — import indicated, no accident flag, moderate/strong continuity.
- **Volkswagen** `WVWZZZ3CZWE123456` — accident risk **Flagged**, import indicated.
- API: local lookup JSON includes `intelligence`.
- `npm run lint`, `npm run build`

### Known limitations

- Heuristic rules only; not ML, not insurer-grade risk pricing.
- Ghana-specific rules minimal (import = non-Ghana origin or IMPORT event).
- No intelligence on external NHTSA-only decodes.
- Confidence score is transparent but subjective; not calibrated on real fleet data.
- Does not write flags back to DB (computed at read time).
- Mileage logic needs at least two mileage-bearing events to detect trends.

### Next recommended step

- Persist optional “risk snapshot” on report generation if API consumers need stable scores.
- Event deduplication on CSV re-import.
- Azure deployment + auth for admin/ingest (roadmap Phase 7).
- Partner API keys and paid report tiers (out of current scope).

---

## Phase 5 — Chassis number support

### Goal

Let users search and display **chassis numbers** alongside VIN and plate, without changing external VIN decode rules (17-character VIN only, after local miss).

### Files added / changed

| Area | Paths |
|------|--------|
| Schema | `prisma/schema.prisma` (`chassisNumber String? @unique`) |
| Seed | `prisma/seed.ts` (sample chassis per vehicle) |
| Lookup | `lib/lookup.ts` (`lookupByVinPlateOrChassis`, chassis normalization) |
| CSV | `lib/csv-ingest.ts` (optional `chassisNumber` column, conflict checks) |
| API | `app/api/v1/lookup/route.ts` (`chassisNumber` in vehicle payload, 404 message) |
| UI | `app/page.tsx`, `components/LookupForm.tsx`, `components/VehicleReport.tsx` |
| Admin | `app/admin/ingest/page.tsx` (template + validation copy) |
| Docs | `README.md`, `docs/roadmap.md`, `docs/build_log.md` |

### Behavior implemented

- **Database:** Optional unique `chassisNumber` on `Vehicle` (SQLite allows multiple nulls).
- **Lookup order:** VIN (if 17 chars) → plate (normalized) → chassis (normalized) → external NHTSA only if still missing and input is 17-char VIN.
- **CSV:** Optional `chassisNumber` column; same-VIN chassis conflicts rejected; duplicate chassis across different VINs in one file rejected; upsert sets chassis when provided.
- **Report:** Chassis shown in header identifiers and spec grid when present.
- **Backward compatibility:** API body field remains `vinOrPlate`; `lookupByVinOrPlate` aliases the new function.

### How it was tested

- `npm run db:push` and `npm run db:seed` after schema change.
- Lookup by seeded VIN, plate, and chassis (e.g. Toyota chassis `BE46K37U123456`).
- Confirm `1HGCM82633A004352` still uses external decode when not in DB.
- `npm run lint`, `npm run build`

### Known limitations

- Chassis lookup scans vehicles with non-null chassis (same pattern as plate; fine for local MVP scale).
- No separate chassis format validation (length/check digit); normalization is alphanumeric only.
- External decode never runs for chassis-only queries, even if chassis looks like 17 characters but is stored only as chassis.
- DB unique constraint on chassis will error on ingest if chassis already belongs to another vehicle (not pre-validated against DB before insert).

### Next recommended step

- Index or exact-match query for plate/chassis at scale.
- Optional chassis field on external decode page (display-only).
- Production migration path when moving off SQLite.

---

## Phase 6 — Local admin dashboard

### Goal

Provide a simple **local admin dashboard** at `/admin` to view GhanaCarSpecs SQLite records: aggregate counts and a vehicle table with links to existing report pages. No authentication, Azure, or payments.

### Files added / changed

| Area | Paths |
|------|--------|
| Admin UI | `app/admin/page.tsx` |
| Data | `lib/admin-dashboard.ts` |
| Admin ingest | `app/admin/ingest/page.tsx` (link back to `/admin`) |
| Styles | `app/globals.css` (admin stats, table, back-row) |
| Docs | `README.md`, `docs/roadmap.md`, `docs/build_log.md` |
| Rules | `.cursor/rules/project_rules.md` (removed deferred “advanced admin dashboard”) |

### Behavior implemented

- **`/admin`:** Server-rendered dashboard with five summary cards: total vehicles, total events, vehicles with accident or insurance-claim events, vehicles with a chassis number, and imported vehicles (import event, `importDate`, or non-Ghana `countryOfOrigin` — same rules as vehicle intelligence).
- **Vehicle table:** make, model, year, VIN, chassis, plate, event count, latest event date; each row links to `/vehicles/[id]` (existing report page).
- **Navigation:** `/admin` links to `/admin/ingest`; ingest page links back to `/admin` and home lookup.
- **`/admin/ingest`:** Unchanged CSV upload flow and API.

### How it was tested

- `npm run dev` → open `/admin` after `npm run db:setup`
- Confirm summary counts match seeded data (3 vehicles, multiple events)
- Click **View report** on a row → `/vehicles/[id]` loads full report
- Open `/admin/ingest` from dashboard; upload CSV still works; back link returns to `/admin`
- `npm run lint`, `npm run build`

### Known limitations

- No authentication — admin routes are open on localhost; not for public deployment as-is.
- Imported-vehicle count loads all vehicles for filtering (fine for local MVP scale).
- No search, pagination, or export on the vehicle table.
- Summary does not include external NHTSA decodes (local DB only).

### Next recommended step

- Auth for admin routes before any non-local deployment.
- Optional filters on the vehicle table (make, year, accident flag).
- Azure deployment and monitoring (roadmap Phase 7).

---

## Cross-phase architecture (current)

```text
User → Home (LookupForm)
         → POST /api/v1/lookup
              → lib/lookup.resolveLookupWithExternalVin
                   ├─ local hit (VIN / plate / chassis) → /vehicles/[id]
                   │     └─ VehicleReport + analyzeVehicleIntelligence
                   ├─ external VIN → sessionStorage → /decoded
                   └─ miss → 404

Admin → /admin/login (ADMIN_API_KEY or ADMIN_PASSWORD)
     → /admin (summary + vehicle table → /vehicles/[id])
     → /admin/ingest → POST /api/admin/ingest → lib/csv-ingest
```

**Database:** `prisma/dev.db` (SQLite) — `vehicles`, `vehicle_events`.

**Explicitly not built:** Azure, Terraform, payments, auth, dealer/partner portal, DVLA integrations.

---

## Changelog index (git milestones)

| Milestone | Summary |
|-----------|---------|
| Initial docs + SemVer | Product vision, roadmap, `v0.1.0` tag |
| Phase 1 MVP | Next.js + Prisma + lookup + seed + report UI |
| UX / seed fix | Report layout, ASCII seed strings, Word progress report |
| Phase 2–4 (branch) | NHTSA fallback, CSV ingest, intelligence layer |
| Phase 5 | Chassis number support |
| Phase 6 | Local admin dashboard |
| Phase 7 (docs) | Deployment readiness plan, `.env.example`, doc stabilization |
| Phase 8 | Basic admin protection (env secret + middleware) |
| Phase 9 | PostgreSQL readiness (dual schema + migrations) |
| Phase 10 | Public demo readiness (homepage, disclaimer, demo plan) |

For commit-level detail, use `git log` on the main feature branches for each phase.

---

## Phase 10 — Public demo readiness

### Goal

Prepare a **credible public demo** of GhanaCarSpecs as a vehicle intelligence and history platform for Ghana, with clear sample-data disclaimers and try-it examples — without deploying or adding payments, accounts, DVLA, or Azure.

### Files added / changed

| Area | Paths |
|------|--------|
| Homepage | `app/page.tsx`, `components/HowItWorks.tsx`, `components/DemoExamples.tsx`, `components/VinChassisGuidance.tsx`, `components/PublicDisclaimer.tsx` |
| Chrome | `components/SiteHeader.tsx`, `components/SiteFooter.tsx`, `app/layout.tsx` (metadata) |
| Lookup | `components/LookupForm.tsx` (fill-demo event, input id) |
| Styles | `app/globals.css` |
| Docs | `docs/public_demo_plan.md`, `README.md`, `docs/roadmap.md` |

### Behavior implemented

- Homepage positions **local GhanaCarSpecs records** + **NHTSA external decode** with Ghana-focused messaging.
- **Try the demo** section with one-click fill from [`sample_data.md`](sample_data.md) values.
- **VIN/chassis guidance** for Ghana users (where to find identifiers; what to enter; demo DB limitation).
- **Public demo notice** disclaimer: sample local data; external decode limitations.
- Site header/footer; **no admin link** on public homepage.
- Open Graph / title / description updated for demo sharing.
- Admin protection unchanged (Phase 8).

### How it was tested

- `npm run lint`, `npm run build`
- Manual: Try buttons fill lookup; local VIN, external VIN, not-found flows unchanged

### Known limitations

- Demo examples omit invalid-VIN error case on homepage (documented in `sample_data.md`).
- `AdminEnvDiagnostic` still on `/admin/login` (admin-only).
- Not deployed to Vercel/Neon yet — see `public_demo_plan.md` checklist.

### Next recommended step

- Optional public deploy to Vercel + Neon using `public_demo_plan.md` §6.
- Azure production path remains Phase 7 when ready.

---

## Phase 12 — Admin record management v1

### Goal

Make admin operational for growing records beyond seed/CSV: manage a vehicle, attach photo URLs and timeline events with clear provenance.

### Files added / changed

| Area | Paths |
|------|--------|
| Admin UI | `app/admin/page.tsx`, `app/admin/ingest/page.tsx`, `app/admin/vehicles/[id]/page.tsx` |
| Components | `AdminNav.tsx`, `AdminAddPhotoForm.tsx`, `AdminAddEventForm.tsx` |
| API | `app/api/admin/vehicles/[id]/photos/route.ts`, `app/api/admin/vehicles/[id]/events/route.ts` |
| Lib | `lib/admin-vehicle-manage.ts`, `lib/admin-record-mutations.ts`, `lib/admin-api.ts`, `lib/admin-form-options-client.ts` |
| Styles | `app/globals.css` |
| Docs | `docs/admin_record_management.md`, `README.md`, `docs/roadmap.md` |

### Behavior implemented

- Dashboard **Manage** + **View report** links; shared admin nav.
- Manage page: identity summary, current photos/events, provenance note.
- Photo URL validation (`/demo-photos/`, `http://`, `https://`); creates `VehiclePhoto`.
- Event form creates `VehicleEvent` with `sourceSystem`, optional mileage/description.
- Middleware protects new routes; public lookup unchanged.

### How it was tested

- `npm run lint`, `npm run build`
- Manual: login → manage → add photo URL + event → verify public report

### Known limitations

- URL-only evidence (no multipart upload).
- No edit/delete for photos or events in v1.

### Next recommended step

- Optional edit/delete admin actions; bulk photo import for partners.

---

## Phase 13 — Evidence confidence & provenance (presentation)

### Goal

Communicate trust level and origin for every visual evidence item and timeline event — data structure and UI only, no scoring algorithms or external APIs.

### Files added / changed

| Area | Paths |
|------|--------|
| Schema | `prisma/schema.prisma`, `prisma/schema.postgresql.prisma`, `prisma/migrations/20260520160000_evidence_confidence_provenance/` |
| Seed | `prisma/seed.ts` (Toyota importer/internal, VW other, Honda auction/importer; all LOW) |
| UI | `components/EvidenceBadges.tsx`, `components/VehiclePhotos.tsx`, `components/EventTimeline.tsx`, `components/AdminAddPhotoForm.tsx`, `components/AdminAddEventForm.tsx`, `app/admin/vehicles/[id]/page.tsx`, `app/globals.css` |
| Lib | `lib/evidence-metadata.ts`, `lib/admin-record-mutations.ts`, `lib/admin-form-options-client.ts` |
| API | `app/api/admin/vehicles/[id]/photos/route.ts`, `app/api/admin/vehicles/[id]/events/route.ts` |
| Docs | `docs/evidence_confidence_and_provenance.md`, `README.md`, `docs/roadmap.md` |

### Behavior implemented

- Enums `ConfidenceLevel` (LOW, MEDIUM, HIGH, VERIFIED) and `ProvenanceType` (DEMO, USER_SUBMITTED, DEALER, IMPORTER, AUCTION, INTERNAL, GOVERNMENT, INSURER, POLICE, OTHER) on photos and events; defaults LOW / OTHER.
- Public badges: provenance + confidence on each photo card and timeline event; color-coded confidence (gray / amber / blue / green).
- Trust explanation block under **Visual evidence** heading.
- Admin forms: required provenance and confidence dropdowns; existing URL/date validation unchanged.

### Database updates required

```bash
npm run db:generate
npm run db:push          # local SQLite
npm run db:seed

# Neon
DATABASE_URL="postgresql://..." npm run db:migrate:postgres
DATABASE_URL="postgresql://..." npm run db:seed
```

### How it was tested

- `npm run lint`, `npm run build`
- `npm run db:seed` — seeded vehicles show badges on public report

### Known limitations

- No automated confidence scoring or moderation.
- CSV ingest still uses schema defaults for new events (LOW / OTHER).
- Government/police/insurer provenance labels are informational until official integrations exist.

### Next recommended step

- Partner-specific default provenance on ingest; workflow to elevate confidence only after verification.

---

## Phase 14 — Admin image upload (Vercel Blob)

### Goal

Let admins upload visual evidence images directly instead of pasting URLs only, using Vercel Blob storage.

### Files added / changed

| Area | Paths |
|------|--------|
| Dependency | `@vercel/blob` |
| API | `app/api/admin/uploads/route.ts` |
| Lib | `lib/admin-upload.ts` |
| UI | `components/AdminAddPhotoForm.tsx`, `app/admin/vehicles/[id]/page.tsx`, `app/globals.css` |
| Env | `.env.example` (`BLOB_READ_WRITE_TOKEN`) |
| Docs | `docs/vercel_blob_setup.md`, `README.md`, `docs/roadmap.md`, `docs/admin_record_management.md` |

### Behavior implemented

- `POST /api/admin/uploads`: admin auth, image MIME only, 10 MB max, sanitized filenames, path `vehicle-evidence/{vehicleId}/{timestamp}-{name}`.
- Admin form: drag/drop, file picker, preview, auto-fill URL; **Manual URL** fallback for `/demo-photos/` and HTTPS.
- Save still uses `POST /api/admin/vehicles/[id]/photos` with provenance/confidence (no Prisma or public report UI changes).

### Configuration

- Local / Vercel: `BLOB_READ_WRITE_TOKEN` from Vercel Blob store (see `docs/vercel_blob_setup.md`).

### How it was tested

- `npm run lint`, `npm run build`

### Known limitations

- No virus scanning or moderation queue.
- Upload requires Blob token (503 without it).
- SVG uploads not accepted (security).

---

## Production Neon seed & VehiclePhoto debugging

### Goal

Document and fix empty **Visual evidence** on Vercel/Neon while local SQLite showed photos; make production seed reliable.

### Root issues

- Seed logged `file:…/dev.db` even when `DATABASE_URL` pointed at Neon.
- `vehicle_photos` empty on Neon (`photo_count = 0`); UI empty state was correct for data, not CSS.
- Seed briefly imported `lib/prisma.ts` → `server-only` failure under `tsx`.
- Vercel build ran `migrate deploy` → Neon P1002 advisory lock timeout.

### Fixes

- `lib/prisma-datasource.ts`: Postgres when `DATABASE_URL` uses `postgres://` / `postgresql://`; else SQLite.
- `prisma/seed.ts`: direct `PrismaClient`, VIN upserts, masked `[seed] database:` log.
- Vercel build: generate postgres client + `next build` only (manual migrate).
- Runbook: [`debugging_neon_seed_photos.md`](debugging_neon_seed_photos.md).

### Verification

- `[seed] database: postgresql://…` (masked) when seeding Neon.
- SQL: `photo_count = 2` per seed VIN; fresh homepage lookup.

---

## Phase 11 — Vehicle photos / visual evidence (foundation)

### Goal

Add database and UI foundation for vehicle photos (import condition, inspection, accident/repair evidence) based on early user feedback — without upload, accounts, payments, or official Ghana integrations.

### Files added / changed

| Area | Paths |
|------|--------|
| Schema | `prisma/schema.prisma`, `prisma/schema.postgresql.prisma`, `prisma/migrations/20260520140000_vehicle_photos/` |
| Seed | `prisma/seed.ts`, `public/demo-photos/*.svg` |
| UI | `components/VehiclePhotos.tsx`, `components/VehicleReport.tsx`, `components/ExternalVinReport.tsx`, `app/vehicles/[id]/page.tsx`, `app/globals.css` |
| Lib | `lib/vehicle-report.ts`, `lib/photo-source.ts` |
| Docs | `README.md`, `docs/roadmap.md`, `docs/build_log.md` |

### Behavior implemented

- **`VehiclePhoto`:** `url`, `caption`, `sourceType` (`PhotoSourceType` enum), optional `sourceLabel`, optional `takenAt`, cascade delete with vehicle.
- Local reports: **Visual evidence** grid with captions and source labels; empty state when no rows.
- External `/decoded`: short notice that no local GhanaCarSpecs photos exist (no gallery).
- Lookup API and admin protection unchanged. Photo upload documented as future work.

### Database updates required

```bash
# Local SQLite
npm run db:push && npm run db:seed

# Neon / Vercel production
DATABASE_URL="postgresql://..." npm run db:migrate:postgres
DATABASE_URL="postgresql://..." npm run db:seed
```

Run `db:migrate:postgres` manually against Neon when the schema changes (not during Vercel build); re-seed with `db:seed` if demo data is missing.

### How it was tested

- `npm run lint`, `npm run build`
- Manual: open seeded Toyota/VW reports for photo grid; `/decoded` shows no-local-photos notice

### Known limitations

- No admin or public upload; CSV ingest does not create photos.
- Placeholder SVGs only — not real vehicle imagery.

### Next recommended step

- Admin photo attach/upload API (behind existing admin auth).

---

## Lookup error UX (post–Phase 10)

### Goal

Replace generic **Something went wrong** / **Lookup failed** copy with clearer, trust-building messages for demo users — without changing lookup or database logic.

### Files added / changed

| Area | Paths |
|------|--------|
| Messages | `lib/lookup-messages.ts` (titles/bodies, plate/chassis heuristic for 404 copy) |
| API | `app/api/v1/lookup/route.ts` (500 returns `title` + `message`) |
| UI | `components/LookupForm.tsx` (structured fallbacks, 500 handling) |
| Docs | `README.md`, `docs/build_log.md` |

### Behavior implemented

- **404:** **No local GhanaCarSpecs record found yet** — generic or plate/chassis-specific body; no implication of official Ghana records.
- **502:** **VIN could not be decoded** — local miss + NHTSA failure; `detail` still in JSON for logs.
- **500 / network:** **Lookup temporarily unavailable** — professional retry guidance.
- Lookup routing and Prisma queries unchanged.

### How it was tested

- `npm run lint`, `npm run build`
- Manual: `GR-9999-99` (404), `00000000000000000` (502), seeded VIN (200)

### Next recommended step

- Optional deploy; monitor Vercel logs for 500s (often `DATABASE_URL` / Prisma on production).

---

## Phase 8 — Basic admin protection

### Goal

Protect admin UI and CSV ingest API before any public deployment using a single environment secret — no user accounts, OAuth, or database users.

### Files added / changed

| Area | Paths |
|------|--------|
| Auth | `lib/admin-auth.ts` |
| Middleware | `middleware.ts` |
| Login | `app/admin/login/page.tsx`, `app/api/admin/login/route.ts`, `app/api/admin/logout/route.ts`, `components/AdminLoginForm.tsx`, `components/AdminSignOut.tsx` |
| Ingest | `app/api/admin/ingest/route.ts`, `components/CsvUploadForm.tsx` |
| Admin UI | `app/admin/page.tsx`, `app/admin/ingest/page.tsx`, `app/globals.css` |
| Config / docs | `.env.example`, `README.md`, `docs/roadmap.md`, `docs/deployment_plan.md`, `docs/architecture.md` |

### Behavior implemented

- **`ADMIN_API_KEY`** (preferred) or **`ADMIN_PASSWORD`** must be set or admin routes return **503** with configuration guidance.
- **Middleware** guards `/admin`, `/admin/ingest`, and `/api/admin/*` except `/admin/login`, `/api/admin/login`, `/api/admin/logout`.
- **Browser:** sign-in at `/admin/login` → httpOnly session cookie (8 hours, `secure` in production).
- **API / scripts:** `Authorization: Bearer <secret>` or `X-Admin-Key: <secret>` on `POST /api/admin/ingest`.
- **Public lookup** (`/`, `/api/v1/lookup`, `/vehicles/[id]`, `/decoded`) unchanged.

### How it was tested

- Without `.env` secret → `/admin` redirects to login with not-configured message.
- With secret → login → dashboard and CSV upload succeed; sign out clears access.
- `POST /api/v1/lookup` without admin headers still works.
- `npm run lint`, `npm run build`

### Known limitations

- Single shared secret for all admins (no per-user audit trail).
- No rate limiting on login attempts.
- Session is a static HMAC-derived token (no server-side session store).

### Next recommended step

- Azure deployment (Phase 7) with secrets in App Service configuration.
- Optional rate limiting on `/api/admin/login` and lookup API.

---

## Phase 9 — PostgreSQL readiness

### Goal

Prepare for **PostgreSQL in production** while keeping **SQLite local development** unchanged. No Azure provisioning or deploy.

### Files added / changed

| Area | Paths |
|------|--------|
| PostgreSQL schema | `prisma/schema.postgresql.prisma` |
| Migrations | `prisma/migrations/20260520120000_init/`, `migration_lock.toml` |
| Data scripts | `scripts/export-sqlite-data.ts`, `scripts/import-postgres-data.ts` |
| Docs | `docs/postgresql.md`, `docs/deployment_plan.md` §6, `README.md`, `docs/roadmap.md`, `.env.example` |
| Scripts | `package.json` (`db:generate:postgres`, `db:migrate:postgres`, `db:setup:postgres`, export/import) |
| SQLite schema | `prisma/schema.prisma` (comment only — still default) |

### Behavior implemented

- **Dual-schema strategy:** Prisma cannot switch providers in one schema; SQLite stays in `schema.prisma`, PostgreSQL in `schema.postgresql.prisma` with `env("DATABASE_URL")`.
- **Migrations:** Initial PostgreSQL migration committed; SQLite continues `db push` locally.
- **Cutover paths documented:** re-seed (MVP), export/import scripts, CSV re-import.
- **Production sequence:** `db:generate:postgres` → `db:migrate:postgres` → `build` → `start`.

### How it was tested

- `npm run db:setup` (SQLite unchanged)
- `npm run db:export:sqlite` (exports seed vehicles)
- `npm run db:generate:postgres`
- `npm run lint`, `npm run build`

### Known limitations

- Two schema files must be kept in sync manually.
- `@prisma/client` reflects last `db:generate*` run — document switching.
- PostgreSQL migrate/import not exercised without a live Postgres instance.
- Azure PostgreSQL still Phase 7 (not provisioned).

### Next recommended step

- Add `db:generate:postgres` + `db:migrate:postgres` to CI/deploy pipeline when Azure staging exists.
- Optional: local Docker Postgres smoke test before first staging deploy.

---

## Stabilization pass — documentation alignment

### Goal

Align README, roadmap, architecture, deployment plan, and build log: consistent **phase numbering (1–7)**, verified **npm scripts**, canonical **sample VINs/plates/chassis**, and `.env.example` matching current and planned configuration. No product features; no deploy.

### Files added / changed

| Area | Paths |
|------|--------|
| Canonical test data | `docs/sample_data.md` |
| Phase roadmap | `docs/roadmap.md` (ordered Phases 1–7) |
| Architecture | `docs/architecture.md` (current tree and flows) |
| Deployment | `docs/deployment_plan.md`, `.env.example` |
| Cross-links | `README.md`, `docs/build_log.md` |

### Behavior implemented

- Roadmap Phases 3–4 split out from the old combined “Phase 2” bucket (CSV vs intelligence).
- Infrastructure and deployment docs are **Phase 7** (replacing the old “Phase 3 (infrastructure)” label).
- External-decode failure test documents `00000000000000000` instead of a vague invalid-VIN note only.
- `.env.example` states that `DATABASE_URL` is not wired in `schema.prisma` yet.

### How it was tested

- Compared all doc tables to `prisma/seed.ts` and `components/LookupForm.tsx` placeholder.
- Verified `package.json` scripts against README and `deployment_plan.md`.

### Known limitations

- `scripts/generate-progress-report.ts` may still describe older phase groupings until regenerated.
- `docs/product_vision.md` and `docs/project.md` use high-level phase wording only (not renumbered).

### Next recommended step

- Wire `env("DATABASE_URL")` when starting Phase 7 Azure work; follow `deployment_plan.md` checklist.

---

## Template for future phases

```markdown
## Phase N — [Title]

### Goal
...

### Files added / changed
...

### Behavior implemented
...

### How it was tested
...

### Known limitations
...

### Next recommended step
...
```
