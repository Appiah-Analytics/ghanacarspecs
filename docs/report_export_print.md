# Report Export and Print View (Phase 24)

Print-friendly vehicle report page before PDF generation. Reuses Phase 22 export summary structures — no new scoring logic or schema changes.

Related: [`report_presentation_and_comparison_foundation.md`](./report_presentation_and_comparison_foundation.md), ADR-011 in [`architecture_decisions.md`](./architecture_decisions.md).

---

## Purpose

Give buyers and operators a clean, printable document from existing report data. Users can print to paper or save as PDF via the browser print dialog. No server-side PDF libraries in this phase.

## Route

- **Page:** `/vehicles/[id]/print`
- **Example:** `/vehicles/clxyz123/print` (vehicle internal ID from lookup redirect)
- **Metadata:** `robots: noindex` — print view is a utility page, not a separate SEO surface

## Content sections

The `PrintableVehicleReport` component renders:

1. Document header (GhanaCarSpecs branding, generated timestamp)
2. Vehicle identity (year/make/model, VIN, plate, chassis, report ID)
3. Executive summary (from `buildReportExportSummary()`)
4. Trust score and risk profile (scores, reasons, factors, recommendations)
5. Vehicle specifications
6. Intelligence signals (comparison snapshot + intelligence scores)
7. Published event history (compact table)
8. Visual evidence count note (photos not embedded — view full report online)
9. Export disclaimer

Data flows through `buildVehicleReportBundle()` → `buildReportExportSummary()` so print output stays aligned with public reports and future PDF export.

## Print actions

`PrintReportActions` (client component) provides:

- **Print report** — triggers `window.print()`
- **View full report** — link back to `/vehicles/[id]`

On screen, the print route hides site header and footer. `@media print` rules hide navigation, actions, and site chrome.

## Entry points

| Location | Link |
|----------|------|
| Public report (`/vehicles/[id]`) | “Print report” next to “Compare this vehicle” |
| Admin manage (`/admin/vehicles/[id]`) | “Print report” in back row |

## Implementation

| Piece | Path |
|-------|------|
| Print page | `app/vehicles/[id]/print/page.tsx` |
| Printable layout | `components/PrintableVehicleReport.tsx` |
| Print button | `components/PrintReportActions.tsx` |
| Export data | `lib/report-export-summary.ts` (Phase 22) |
| Styles | `app/globals.css` (`.print-report`, `@media print`) |

## Intentionally not implemented

- Server-side PDF generation or download endpoint
- Embedded photo thumbnails in print output
- Public share links for print view
- NHTSA-only external decode print reports
- Payment or branded dealer letterhead

## Next step

- PDF export endpoint reusing `buildReportExportSummary()` structure
- Optional print stylesheet for comparison export bundle
