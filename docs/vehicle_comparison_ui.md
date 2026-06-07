# Vehicle Comparison UI (Phase 23)

Buyer-friendly side-by-side comparison of two **local GhanaCarSpecs** vehicle records.

## Purpose

Help users compare trust score, risk profile, evidence counts, and intelligence signals before a purchase decision. Comparison uses the same published-evidence rules as public vehicle reports — not a separate scoring path.

## Route

- **Page:** `/compare`
- **Query params:** `a` and `b` — each accepts a VIN, Ghana plate number, or chassis number
- **Example:** `/compare?a=4T1BE46K37U123456&b=WVWZZZ3CZWE123456`

The form pre-fills from URL params so links can be shared or bookmarked.

## Supported identifiers

| Type | Notes |
|------|--------|
| VIN | 17-character VIN (case-insensitive) |
| Plate | Ghana plate formats; spacing/case normalized by existing lookup |
| Chassis | Partial or full chassis; normalized by existing lookup |

**Not supported:** External NHTSA-only decodes (vehicles not in the local database). Comparison requires two local records.

## Comparison fields

Each column shows a `VehicleComparisonSnapshot` from `buildVehicleComparisonSnapshot()`:

**Identity:** label, VIN, plate, chassis

**Scores:** trust score + band, risk score + level

**Evidence:** event count, photo count, accident count, insurance claim count, theft count

**Signals:** imported vehicle, mileage issue, service continuity score, history confidence score

A **Comparison summary** section adds cautious interpretation (record completeness, risk indicators, limited evidence). Language is non-accusatory and includes an independent-inspection reminder.

## Entry points

| Location | Link |
|----------|------|
| Public report (`/vehicles/[id]`) | “Compare this vehicle” → `/compare?a=<vin>` |
| Admin manage (`/admin/vehicles/[id]`) | “Compare vehicle” in back row |
| Homepage | “Compare two vehicles side by side” → `/compare` |

## Implementation

| File | Role |
|------|------|
| `app/compare/page.tsx` | Server page; resolves `a` / `b` via lookup + report bundle |
| `components/VehicleComparisonForm.tsx` | Client form; navigates to query URL |
| `components/VehicleComparison.tsx` | Side-by-side columns + interpretation |
| `lib/resolve-vehicle-comparison.ts` | Identifier → snapshot |
| `lib/vehicle-comparison-interpret.ts` | Cautious summary lines |
| `lib/vehicle-comparison.ts` | Snapshot builder (Phase 22 foundation) |

Resolution path: `lookupByVinPlateOrChassis` → `getVehicleForReport` → `buildVehicleReportBundle` → `buildVehicleComparisonSnapshot`.

## Mobile layout

On viewports ≤720px, Vehicle A and Vehicle B stack vertically. Row labels and values stack within each column to avoid horizontal scrolling.

## Limitations

- Local database records only (no external decode comparison).
- Published evidence only — draft/archived items excluded (same as public reports).
- No PDF export, share links, or payment in this phase.
- Interpretation is indicative; not legal verification or official registry confirmation.
- Pre-filling Vehicle B from a report link requires the user to enter the second identifier manually (Vehicle A only is pre-filled from report links).

## Future roadmap

- Pre-select Vehicle B from a second report link (`/compare?a=…&b=…` already supported when both known).
- Highlight row-level deltas (e.g. trust score winner).
- Saved comparison sessions (authenticated buyers).
- PDF/export bundle including comparison summary.
- Optional comparison against external decode when only one local record exists (clearly labeled).

See also: [`report_presentation_and_comparison_foundation.md`](report_presentation_and_comparison_foundation.md), ADR-010 in [`architecture_decisions.md`](architecture_decisions.md).
