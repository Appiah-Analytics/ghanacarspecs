# Vehicle Trust Score

Phase 20 adds an explainable **GhanaCarSpecs Trust Score** (0–100) to public vehicle reports and the admin vehicle management page.

Related: [`public_trust_and_transparency.md`](./public_trust_and_transparency.md), [`evidence_confidence_and_provenance.md`](./evidence_confidence_and_provenance.md).

---

## Philosophy

- Summarize **evidence completeness and traceability**, not legal truth.
- Use transparent, rule-based scoring — not AI or black-box models.
- Only **published, non-deleted** evidence counts positively.
- Always show cautions that the score is **not** government or insurer certification.

---

## Scoring inputs

Implemented in `lib/vehicle-trust-score.ts` (`SCORE_WEIGHTS`).

| Category | Inputs |
|----------|--------|
| **Base** | Starting points for having a local record |
| **Completeness** | VIN, plate, chassis, make/model/year |
| **Evidence volume** | Published event count (capped), published photo count (capped) |
| **Evidence quality** | Average confidence level across published evidence |
| **Provenance diversity** | Non-demo/non-other provenance types present |
| **Risk adjustments** | Accident, insurance claim, theft events; mileage inconsistencies (via `analyzeVehicleIntelligence`) |

Archived, draft, rejected, or soft-deleted evidence does **not** improve the score.

---

## Score bands

| Score | Band |
|-------|------|
| 80–100 | **Strong** |
| 60–79 | **Moderate** |
| 40–59 | **Limited** |
| 0–39 | **Weak** |

---

## Output shape

```ts
{
  score: number,
  band: "Strong" | "Moderate" | "Limited" | "Weak",
  reasons: string[],
  cautions: string[]
}
```

- **reasons** — positive explainers (identity fields, event/photo counts, provenance, confidence)
- **cautions** — standard integration limits + record-specific risks (accidents, claims, mileage gaps)

Standard disclaimer (always shown):

> GhanaCarSpecs Trust Score is an internal evidence completeness and traceability signal. It does not prove ownership, legal status, roadworthiness, or official government verification.

---

## Where it appears

| Surface | Component |
|---------|-----------|
| Public `/vehicles/[id]` | `VehicleTrustScorePanel` near top of `VehicleReport` |
| Admin `/admin/vehicles/[id]` | Same panel (`variant="admin"`) above vehicle identity |

---

## Limitations

- Not linked to DVLA, police, or insurer systems.
- Does not verify ownership or roadworthiness.
- Low confidence evidence can still contribute volume points.
- Risk events reduce score slightly but are primarily surfaced as cautions.
- Admin view scores **published** evidence only (same as public), even though admins see draft/archived items elsewhere on the page.

---

## Future roadmap

- Operator filters/sorting by trust band on admin dashboard
- Optional weighting when VERIFIED evidence ratio increases
- Per-market calibration once real integrations exist (without implying legal certification)
