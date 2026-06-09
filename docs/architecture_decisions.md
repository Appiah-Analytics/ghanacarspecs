# Architecture Decision Records (ADR)

Lightweight decision history for GhanaCarSpecs. Each record captures **what** was decided, **why**, and how it was verified — so future work can build on intentional design rather than reverse-engineering the codebase.

Related: [`architecture.md`](architecture.md), [`build_log.md`](build_log.md), [`project_handoff_master.md`](project_handoff_master.md).

---

## ADR-001 — Shared Event Write Path

**Date:** 2026-05-29

**Decision:** CSV ingestion and admin event creation use the same event-write helper (`createVehicleEventRecord()` in `lib/vehicle-event-write.ts`).

**Reason:** Prevent divergence between evidence lifecycle, defaults, provenance, confidence, status handling, and audit logging across acquisition paths.

**Alternatives Considered:** Separate CSV write path with bulk `createMany` and different defaults.

**Tradeoffs:** Slightly more coupling between admin UI and CSV ingest, but consistent evidence behavior and per-row audit logs.

**Verification:** Phase 18 foundation CSV tests passed (`npm run lint`, `npm run build`, manual CSV upload).

---

## ADR-002 — Evidence Lifecycle Management

**Date:** 2026-05-28

**Decision:** Evidence uses `DRAFT`, `REVIEWED`, `PUBLISHED`, `REJECTED`, and `ARCHIVED` statuses with soft-delete fields.

**Reason:** Allow moderation and public visibility control without hard-deleting operational history.

**Alternatives Considered:** Published-only model (no draft/moderation states).

**Tradeoffs:** More operational complexity for admins, but stronger governance and clearer public vs internal visibility.

**Verification:** Phase 16 lifecycle tests passed; public reports filter to `PUBLISHED` + `deletedAt: null`.

---

## ADR-003 — Trust Score Philosophy

**Date:** 2026-05-29

**Decision:** Vehicle Trust Score is rule-based and explainable (`calculateVehicleTrustScore()` in `lib/vehicle-trust-score.ts`).

**Reason:** Avoid black-box scoring and maintain user trust; operators and the public can read reasons and cautions.

**Alternatives Considered:** AI-generated or opaque composite trust scoring.

**Tradeoffs:** Less sophisticated than ML models, but transparent, auditable, and aligned with conservative trust messaging.

**Verification:** Phase 20 implementation (`npm run lint`, `npm run build`, seeded Toyota/VW/Honda spot checks).

---

## ADR-004 — Duplicate Event Handling

**Date:** 2026-05-29

**Decision:** Duplicate events are skipped rather than inserted (event fingerprint idempotency in `lib/event-idempotency.ts`).

**Reason:** Prevent repeated CSV uploads from inflating vehicle histories with identical timeline rows.

**Alternatives Considered:** Allow duplicates on every upload; auto-merge or update existing events.

**Tradeoffs:** Possible edge cases if two legitimately distinct events share identical fingerprint fields, but greatly improves data quality for bulk re-import.

**Verification:** Phase 19 idempotency tests passed (DB + in-file duplicate skip, re-commit produces zero new events).

---

## ADR-005 — Duplicate Vehicle Handling

**Date:** 2026-05-29

**Decision:** Duplicate VIN, plate, or chassis signals generate **warnings** rather than blocking imports.

**Reason:** Allow operators to review potentially valid records (e.g. multi-event files, plate transfers) without stopping ingestion entirely.

**Alternatives Considered:** Hard-stop imports on any duplicate VIN/plate/chassis match.

**Tradeoffs:** Requires operator judgment; duplicate VIN in DB still allows new events on commit (with warnings).

**Verification:** Phase 18.2 duplicate detection tests passed (high-confidence VIN, possible plate/chassis warnings).

---

## ADR-006 — Import History Storage

**Date:** 2026-05-29

**Decision:** Import history stored in JSON file (`prisma/data/import-history.json`) rather than a database table.

**Reason:** Avoid schema migrations and keep operational overhead low at current scale.

**Alternatives Considered:** Prisma `ImportBatch` table with relational queries and cross-instance sharing.

**Tradeoffs:** Less queryable across serverless instances; file is gitignored and local to each deployment host.

**Verification:** Phase 18.2 import history implementation; committed imports only (preview excluded).

---

## ADR-007 — Trust and Transparency Policy

**Date:** 2026-05-29

**Decision:** GhanaCarSpecs explicitly states that trust scores, provenance labels, and confidence levels are **not** legal certification or government verification.

**Reason:** Prevent overclaiming and maintain credibility in a fraud-sensitive vehicle market.

**Alternatives Considered:** Marketing-oriented language implying official or government-backed validation.

**Tradeoffs:** More conservative public messaging; may appear less “authoritative” than competitors who overstate certainty.

**Verification:** Phase 17 Trust Center implementation; disclaimer copy on trust score, confidence help, and transparency blocks.

---

## ADR-008 — Vehicle Risk Profile

**Date:** 2026-05-29

**Decision:** Risk Profile is rule-based, explainable, and separate from Trust Score.

**Reason:** Trust Score measures evidence completeness; Risk Profile highlights concern areas. Keeping them separate prevents confusing “well documented” with “safe.”

**Alternatives Considered:** Single combined trust/risk score.

**Tradeoffs:** More UI explanation required, but clearer product semantics.

**Verification:** Phase 21 implementation and seeded vehicle report checks.

---

## ADR-009 — Report Presentation Before Export

**Date:** 2026-05-29

**Decision:** Phase 22 improves report structure and comparison/export foundations before adding PDF generation or public share links.

**Reason:** A clear, reusable report structure should exist before export formats are added.

**Alternatives Considered:** Add PDF export immediately.

**Tradeoffs:** Less flashy short-term, but safer and more maintainable.

**Verification:** Phase 22 report rendering and build checks.

---

## ADR-010 — Comparison UI Uses Existing Report Snapshots

**Date:** 2026-05-29

**Decision:** Vehicle comparison uses report-derived snapshot objects instead of querying independent comparison-specific models.

**Reason:** Keeps comparison consistent with public reports, trust score, risk profile, and evidence visibility rules.

**Alternatives Considered:** Build a separate comparison query/data model.

**Tradeoffs:** Slightly more dependency on report structure, but avoids duplicate scoring logic.

**Verification:** Phase 23 comparison checks.

---

## ADR-011 — Print View Before PDF Export

**Date:** 2026-06-07

**Decision:** Phase 24 adds a dedicated print-friendly report page (`/vehicles/[id]/print`) that reuses `buildReportExportSummary()` and browser print — no PDF library yet.

**Reason:** Validate report layout and content for export on paper/PDF before committing to server-side PDF generation.

**Alternatives Considered:** Add `@react-pdf/renderer` or similar immediately; print styles on the existing report page only.

**Tradeoffs:** Users must use browser print/save-as-PDF; no branded PDF download button yet. Separate route keeps the interactive report UX unchanged.

**Verification:** Phase 24 print page checks (`npm run lint`, `npm run build`, seeded vehicle print preview).

---

## ADR-012 — PDFKit Server Export Reusing Export Summary

**Date:** 2026-06-07

**Decision:** Phase 25 adds `GET /api/vehicles/[id]/export/pdf` using `pdfkit` on the Node.js runtime. PDF content is built from `buildVehicleReportBundle()` and `buildReportExportSummary()` — same pipeline as the print view.

**Reason:** Deliver downloadable PDFs without React-PDF complexity or client-side generation; keep export logic aligned with print and future formats.

**Alternatives Considered:** `@react-pdf/renderer`, browser-only save-as-PDF, Puppeteer HTML-to-PDF.

**Tradeoffs:** `pdfkit` is marked `serverExternalPackages`; layout is code-driven rather than HTML/CSS. No embedded photos in v1.

**Verification:** Phase 25 PDF export checks (`npm run lint`, `npm run build`, seeded vehicle PDF download).

---

## ADR-013 — Report Reference and Sharing Foundation

**Date:** 2026-06-07

**Decision:** Phase 26 adds a deterministic `GCS-` report reference derived from vehicle identity (VIN → chassis → plate → id) at render time, plus a client-side copy-link button. No schema changes or share tokens.

**Reason:** Make reports identifiable and shareable across online, print, and PDF surfaces before adding short URLs or tokenized sharing.

**Alternatives Considered:** Database-stored share codes, QR codes, email share, public short-link service.

**Tradeoffs:** Reference is not yet a lookup key; copy link shares the full page URL only. Simple and auditable.

**Verification:** Phase 26 reference and copy-link checks (`npm run lint`, `npm run build`, seeded Toyota reference consistency).

---

## How to add a new ADR

1. Copy the template below the next sequential number (`ADR-010`, etc.).
2. Link the verification field to a phase in [`build_log.md`](build_log.md) or a specific test run.
3. Cross-reference affected runbooks if the decision changes operator workflow.

```markdown
## ADR-00N — Title

**Date:** YYYY-MM-DD

**Decision:**

**Reason:**

**Alternatives Considered:**

**Tradeoffs:**

**Verification:**
```
