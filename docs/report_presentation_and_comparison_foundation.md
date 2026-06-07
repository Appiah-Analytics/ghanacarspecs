# Report Presentation and Comparison Foundation

Phase 22 improves how vehicle intelligence is presented on public reports and prepares reusable structures for future comparison and export features.

Related: [`vehicle_trust_score.md`](./vehicle_trust_score.md), [`vehicle_risk_profile.md`](./vehicle_risk_profile.md), [`public_trust_and_transparency.md`](./public_trust_and_transparency.md).

---

## Executive summary

`VehicleExecutiveSummaryPanel` gives a one-glance interpretation built from existing trust, risk, and intelligence data — **without changing** trust or risk formulas.

Includes:

- Overall assessment (trust band + risk level wording)
- Trust band, risk level, import / accident-claim / mileage status
- Key signals (identity, evidence counts, import, mileage)
- Recommended next step (cautious, non-legal language)

Built by `buildVehicleExecutiveSummary()` in `lib/vehicle-executive-summary.ts` from `buildVehicleReportBundle()`.

---

## Public report section order

1. Report header / identity  
2. **Executive Summary**  
3. Trust Score  
4. Risk Profile  
5. Vehicle specifications  
6. Vehicle intelligence  
7. Visual evidence  
8. Event timeline  
9. Trust Center  
10. Verification Status  
11. Transparency Statement  

No full redesign — section order and summary panel only.

---

## Shared report bundle

`buildVehicleReportBundle()` in `lib/vehicle-report-bundle.ts` centralizes:

- Published-only evidence filtering for scoring
- Trust Score, Risk Profile, Vehicle Intelligence derivations

Used by public report, admin manage page, executive summary, comparison snapshot, and export summary.

---

## Comparison snapshot (foundation only)

`buildVehicleComparisonSnapshot(report)` in `lib/vehicle-comparison.ts` returns:

| Field | Description |
|-------|-------------|
| `vehicleId`, `label`, `vin`, `plateNumber`, `chassisNumber` | Identity |
| `trustScore`, `trustBand` | Trust Score output |
| `riskScore`, `riskLevel` | Risk Profile output |
| `eventCount`, `photoCount` | Published evidence counts |
| `accidentCount`, `insuranceClaimCount`, `theftCount` | Timeline risk counts |
| `importedVehicle` | Import indicator |
| `mileageIssue` | Mileage inconsistency flag |
| `serviceContinuityScore` | From vehicle intelligence |
| `historyConfidenceScore` | From vehicle intelligence |

**No comparison UI in Phase 22.** Prepared for Phase 23 side-by-side vehicle comparison.

---

## Export readiness (no PDF yet)

`buildReportExportSummary(report)` in `lib/report-export-summary.ts` produces a plain JSON-friendly object:

- Vehicle identity + timestamps
- Full executive summary
- Comparison snapshot fields
- Trust/risk scores
- Export disclaimer

**No PDF libraries.** Future print/PDF export should reuse this structure.

---

## Intentionally not implemented

- PDF generation or download
- Public share links
- Side-by-side comparison UI
- Payment or dealer portals
- External registry integrations
- Changes to trust score, risk profile, lookup, or evidence lifecycle

---

## Where it appears

| Surface | Components / libs |
|---------|-------------------|
| Public `/vehicles/[id]` | `VehicleExecutiveSummaryPanel` + reordered sections |
| Admin `/admin/vehicles/[id]` | Same executive summary (published-evidence basis) |
| Future comparison/export | `lib/vehicle-comparison.ts`, `lib/report-export-summary.ts` |
