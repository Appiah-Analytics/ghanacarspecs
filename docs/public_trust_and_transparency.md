# Public Trust and Transparency

GhanaCarSpecs presents vehicle evidence with explicit uncertainty labels. This document explains the trust philosophy behind public reports.

Related: [`evidence_confidence_and_provenance.md`](./evidence_confidence_and_provenance.md), [`evidence_lifecycle_management.md`](./evidence_lifecycle_management.md).

---

## Trust philosophy

- Show what evidence exists, where it was attributed to come from, and how reliable it appears.
- Never imply legal certainty, government certification, or ownership verification unless a future integration explicitly provides it.
- Prefer clarity over marketing confidence.

---

## Confidence model

| Level | Meaning |
|-------|---------|
| **LOW** | Limited supporting evidence |
| **MEDIUM** | Multiple supporting signals |
| **HIGH** | Strong supporting evidence and traceability |
| **VERIFIED** | Reviewed within GhanaCarSpecs with strong traceability |

**Important:** `VERIFIED` is an internal review label. It does **not** mean DVLA validation, police confirmation, insurer adjudication, or legal certification.

Public UI: expandable badges on photos and events; full definitions in the **Trust center** on vehicle reports.

---

## Provenance model

Provenance categories describe **source type**, not automatic truth:

- **IMPORTER**, **DEALER**, **AUCTION**, **USER_SUBMITTED**
- **GOVERNMENT**, **INSURER**, **POLICE**
- **INTERNAL**, **OTHER**, **DEMO**

Each category has plain-language help text on public reports explaining what it means and what it does **not** guarantee.

---

## Transparency principles

1. Only **published** evidence appears on public reports.
2. Archived, rejected, and non-published items are hidden from public view.
3. Confidence and provenance are decision aids, not verdicts.
4. Sample/demo data is labeled and must not be mistaken for official Ghana records.

---

## Verification limitations (current)

**Available today**

- Vehicle specifications (local record or external NHTSA VIN decode)
- Evidence tracking (photos and timeline events)
- Provenance and confidence metadata
- Moderation review workflow

**Not yet available**

- DVLA integration
- Insurance claim integration
- Police incident integration
- Ownership verification
- Official government certification

---

## Future verification roadmap

| Area | Direction |
|------|-----------|
| Official registries | Partner or API integrations with clear legal scope |
| Insurers / police | Structured feeds with provenance upgrade paths |
| Ownership | Separate product decision — not implied by confidence badges |
| Audit persistence | Database audit table beyond structured runtime logs |

---

## UI components (Phase 17)

| Component | Purpose |
|-----------|---------|
| `TrustCenter` | Full confidence, provenance, and visibility reference on reports |
| `ConfidenceHelp` | Tap-to-expand confidence badge explanations |
| `ProvenanceHelp` | Tap-to-expand provenance explanations |
| `VerificationStatus` | What the platform can and cannot verify today |
| `TransparencyStatement` | Short professional disclaimer on each report |

See [`build_log.md`](./build_log.md) Phase 17 entry.
