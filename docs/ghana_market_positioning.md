# Ghana Market Positioning (Phase 27)

Repositions GhanaCarSpecs public messaging as a **Ghana vehicle trust and verification platform** rather than a technical VIN lookup demo.

Related: ADR-014 in [`architecture_decisions.md`](./architecture_decisions.md).

---

## Purpose

Improve homepage and partner-facing copy so buyers, dealers, importers, and garages understand the product value before technical implementation details. No schema, workflow, form, or payment changes.

## Homepage changes

**Primary headline:** “Check a Ghana vehicle before you buy, sell, service, insure, or finance it.”

**Subheadline:** Search by plate, chassis, or VIN for specifications, history signals, mileage, service events, risk indicators, and evidence.

**Information architecture (top → bottom):**

1. Hero + lookup (user value)
2. Audience paths — Buyers, Dealers & Importers, Garages
3. Trust and transparency summary
4. Chassis / Japanese import guidance
5. How lookup works (technical)
6. Demo examples (technical)
7. Public demo disclaimer (unchanged)

## Audience paths

`components/AudiencePaths.tsx` — three informational cards:

| Audience | Title focus |
|----------|-------------|
| Buyers | Check before you buy |
| Dealers & Importers | Provide trusted vehicle information |
| Garages | Build digital vehicle history |

Dealer and garage cards link to `/partners`.

## Chassis guidance

`components/VinChassisGuidance.tsx` — clarifies that Japanese imports often use chassis/frame numbers; absence of a 17-character VIN does not mean a vehicle is invalid.

## Partners page

**Route:** `/partners`

Explains future participation for garages, dealers/importers, and fleet operators, plus a future ecosystem section (insurers, lenders, fleet, service providers).

**CTA:** “Partnership program coming soon” — no forms or lead capture.

## Intentionally not implemented

- Database schema changes
- Partner intake forms or lead capture
- Admin workflow changes
- Payments or partner dashboards

## Next step

- Partner intake when product and data partnerships are ready
- Ghana-specific SEO and landing pages per audience
