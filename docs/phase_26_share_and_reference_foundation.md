# Phase 26 — Share & Reference Foundation

Deterministic report references and copy-link actions for local vehicle reports — no schema changes, tokens, or short URLs.

Related: [`report_export_print.md`](./report_export_print.md), [`pdf_export.md`](./pdf_export.md), ADR-013 in [`architecture_decisions.md`](./architecture_decisions.md).

---

## Purpose

Give every local GhanaCarSpecs report a stable, human-readable reference that appears consistently on the online report, print view, PDF export, and admin manage page. Add a simple “copy report link” action for sharing the current page URL.

## Report reference

`buildReportReference(vehicle)` in `lib/report-reference.ts` returns a deterministic code:

| Priority | Source field |
|----------|----------------|
| 1 | VIN |
| 2 | Chassis number |
| 3 | Plate number |
| 4 | Internal vehicle id |

The chosen value is normalized to uppercase alphanumeric and prefixed with `GCS-`.

**Example:** Toyota seed VIN → `GCS-4T1BE46K37U123456`

No database column or share token is stored. The reference is derived at render/export time.

## Surfaces

| Surface | Display | Share action |
|---------|---------|--------------|
| Public `/vehicles/[id]` | `ReportReferenceBlock` below identity | **Copy report link** |
| Print `/vehicles/[id]/print` | Identity grid + **Copy report link** in actions | Copies current print URL |
| PDF export | Identity key-value row | — |
| Admin `/admin/vehicles/[id]` | Below manage hero | — |

## Helpers

| Helper | Path | Role |
|--------|------|------|
| `buildReportReference()` | `lib/report-reference.ts` | Deterministic GCS code |
| `vehicleReportPath()` | `lib/report-url.ts` | `/vehicles/{id}` |
| `vehiclePrintReportPath()` | `lib/report-url.ts` | `/vehicles/{id}/print` |
| `CopyReportLinkButton` | `components/CopyReportLinkButton.tsx` | Clipboard copy with graceful fallback |

## Intentionally not implemented

- Database schema changes or stored share tokens
- QR codes, email sharing, public short links
- Payments, user accounts, dealer portal
- NHTSA-only external report sharing

## Next step

- Reference lookup by GCS code (optional future route)
- Branded share card or Open Graph metadata using report reference
