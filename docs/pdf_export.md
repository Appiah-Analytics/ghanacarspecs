# Server-side PDF Export (Phase 25)

Downloadable vehicle report PDF for local GhanaCarSpecs records. Reuses Phase 22 export summary and Phase 24 print content — no new scoring logic or schema changes.

Related: [`report_export_print.md`](./report_export_print.md), [`report_presentation_and_comparison_foundation.md`](./report_presentation_and_comparison_foundation.md), ADR-012 in [`architecture_decisions.md`](./architecture_decisions.md).

---

## Purpose

Provide a one-click PDF download from existing report data. Complements the Phase 24 browser print view with a server-generated file suitable for saving or sharing offline (subject to disclaimer).

## API route

- **Endpoint:** `GET /api/vehicles/[id]/export/pdf`
- **Runtime:** Node.js (`serverExternalPackages: ["pdfkit"]`)
- **Response:** `application/pdf` with `Content-Disposition: attachment`
- **Filename:** `ghanacarspecs-{VIN}.pdf` (sanitized)
- **Errors:** `404` if vehicle not found; `500` if PDF generation fails

## Data pipeline

```text
getVehicleForReport(id)
  -> buildVehicleReportBundle()
  -> buildReportExportSummary()
  -> generateVehicleReportPdf()  (pdfkit)
```

Only published, non-deleted evidence is included — same rules as public reports.

## PDF sections

1. GhanaCarSpecs header + generated timestamp
2. Vehicle identity (year/make/model, VIN, plate, chassis, report ID)
3. Executive summary
4. Trust score and risk profile summaries
5. Vehicle specifications
6. Intelligence signals
7. Published event history table
8. Visual evidence count note (no embedded thumbnails)
9. Export disclaimer

## Download entry points

| Location | Control |
|----------|---------|
| Public report (`/vehicles/[id]`) | **Download PDF** in action links |
| Print view (`/vehicles/[id]/print`) | **Download PDF** in print actions |
| Admin manage (`/admin/vehicles/[id]`) | **Download PDF** in back row |

Helper: `vehiclePdfExportUrl(vehicleId)` in `lib/vehicle-pdf-export-url.ts`.

## Implementation

| Piece | Path |
|-------|------|
| API route | `app/api/vehicles/[id]/export/pdf/route.ts` |
| PDF builder | `lib/generate-vehicle-report-pdf.ts` |
| Export URL helper | `lib/vehicle-pdf-export-url.ts` |
| Library | `pdfkit` (Node.js server route) |

## Intentionally not implemented

- NHTSA-only external decode PDFs
- Embedded photo thumbnails
- Public share links or signed URLs
- Payment-gated downloads
- Comparison PDF export
- Schema changes

## Next step

- Comparison PDF bundle
- Optional branded letterhead or watermark
