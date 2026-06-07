# Vehicle Risk Profile

Phase 21 adds an explainable **Vehicle Risk Profile** (0–100, higher = more concern) to help Ghana buyers ask: *“Should I worry about this vehicle?”*

Related: [`vehicle_trust_score.md`](./vehicle_trust_score.md), [`public_trust_and_transparency.md`](./public_trust_and_transparency.md).

---

## Philosophy

- Highlight **possible concern areas** from published evidence — not legal conclusions or accusations.
- Use cautious language: *possible concern*, *evidence indicates*, *request independent inspection*.
- Rule-based and transparent (`lib/vehicle-risk-profile.ts`); no AI/ML.
- Only **published, non-deleted** evidence is evaluated (same visibility rules as public reports).

---

## Trust Score ≠ Risk Profile

| Signal | Measures |
|--------|----------|
| **Trust Score** | Evidence completeness and traceability |
| **Risk Profile** | Possible concern areas in the timeline and record gaps |

Examples:

- **High trust + elevated risk** — well-documented record that includes an accident event.
- **Low trust + low visible risk** — little evidence available, so fewer concern signals appear (but uncertainty remains).

Both panels appear on public reports and admin manage pages with explicit separation copy.

---

## Risk inputs

| Category | Effect |
|----------|--------|
| **Accident events** | Increases risk; adds review recommendation |
| **Insurance claim events** | Increases risk |
| **Theft events** | Strong risk increase |
| **Mileage inconsistency** | Increases risk (via `analyzeVehicleIntelligence`) |
| **Missing plate / chassis** | Increases risk |
| **No published events / photos** | Increases risk |
| **Import context** | Minor increase + provenance review recommendation (import alone is not “bad”) |
| **Low-confidence-only evidence** | Caution (does not erase other risk signals) |
| **Complete identity / richer evidence** | Positive signals; modest score reduction |

Strong provenance improves traceability messaging but does **not** remove accident/claim/theft factors.

---

## Risk bands (score 0–100, higher = more risk)

| Score | Level |
|-------|--------|
| 0–24 | **Low** |
| 25–44 | **Moderate** |
| 45–64 | **Elevated** |
| 65–100 | **High** |

---

## Output shape

```ts
{
  level: "Low" | "Moderate" | "Elevated" | "High",
  score: number,
  riskFactors: string[],
  positiveSignals: string[],
  recommendations: string[],
  cautions: string[]
}
```

Standard disclaimer:

> GhanaCarSpecs Risk Profile highlights possible concern areas from available evidence. It is not a legal finding, ownership verdict, or official government check.

---

## Non-accusatory language rules

- Prefer *evidence indicates* over definitive blame.
- Never state fraud, criminal guilt, or official clearance.
- Always note missing DVLA/police/insurer integrations where relevant.
- Recommend independent inspection instead of telling the user to “avoid” a vehicle.

---

## Where it appears

| Surface | Component |
|---------|-----------|
| Public `/vehicles/[id]` | `VehicleRiskProfilePanel` (below Trust Score) |
| Admin `/admin/vehicles/[id]` | Same panel (`variant="admin"`) |

---

## Limitations

- No external registry, police, or insurer verification.
- Sparse records may show lower *visible* risk while still being incomplete.
- Does not modify Trust Score formula or evidence lifecycle behavior.
- Admin dashboard filtering/sorting by risk not implemented.

---

## Future roadmap

- Admin dashboard filter by risk level
- Optional buyer checklist export
- Calibrated weights once real-world Ghana feedback is available (without legal overclaiming)
