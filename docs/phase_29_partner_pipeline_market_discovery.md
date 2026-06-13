# Phase 29 — Partner Pipeline & Market Discovery

Extends the Phase 28 Partner Interest foundation into a **lightweight admin workflow** for tracking partner outreach and learning market demand — before building partner accounts, subscriptions, dealer dashboards, or payment features.

Related: [`partner_interest_foundation.md`](./partner_interest_foundation.md), [`ghana_market_positioning.md`](./ghana_market_positioning.md), ADR-016 in [`architecture_decisions.md`](./architecture_decisions.md).

**Status:** Implemented (Phase 29).

---

## Goal

Turn raw partner interest submissions into structured learning about Ghana's vehicle ecosystem. Operators should be able to track outreach status, capture conversation notes, and summarize what dealers, importers, garages, fleet operators, insurers, lenders, and buyers actually need — without shipping a full CRM or partner portal.

Phase 29 answers: *Who is interested, what did we learn from them, and what should we build next?*

---

## Problem Statement

Phase 28 captures partner interest but stops at a read-only table. Submissions sit as rows with no:

- Outreach or follow-up status
- Internal notes from calls or WhatsApp conversations
- Segmentation by partner type, city, or vehicle volume
- Structured record of market pain points and feature requests
- Link between interest signals and product priorities

Without this, GhanaCarSpecs risks building partner accounts, subscriptions, dashboards, or payments based on assumptions rather than validated demand from Ghana garages, dealers, importers, fleet operators, insurers, and buyers.

---

## Scope

Phase 29 is **admin-only** and **learning-oriented**:

1. **Pipeline status on partner interest** — lightweight states (e.g. new, contacted, qualified, not a fit, deferred) applied to existing `PartnerInterest` records.
2. **Internal outreach notes** — append-only or editable admin notes tied to a submission (not visible to the public).
3. **Market discovery tags** — optional categorization of what the partner cares about (e.g. service history, buyer reports, import documentation, fleet tracking).
4. **Admin list improvements** — filter/sort by type, city, status, and date on `/admin/partner-interest` (or a successor admin view).
5. **Discovery summary helpers** — simple counts or rollups (submissions by `PartnerType`, by city, by volume band) to inform product decisions.
6. **Documentation of learnings** — runbook or export-friendly summary for quarterly product review.

This phase learns from the market. It does not onboard partners into the product.

---

## Out of Scope

Explicitly **not** in Phase 29:

- Partner user accounts or login
- Dealer / garage / fleet dashboards
- Subscriptions, billing, or payments
- Email, SMS, or WhatsApp automation
- Full CRM (pipelines, deals, tasks, assignments across teams)
- Public partner portal or API keys for partners
- Buyer lead capture or sales workflows
- Changes to vehicle report scoring, evidence lifecycle, or lookup behavior
- NHTSA or external registry integrations

If a feature requires partners to log in, pay, or self-serve beyond submitting interest, it belongs in a later phase.

---

## Implemented (Phase 29)

### Database

Migration `prisma/migrations/20260607140000_partner_interest_pipeline/`:

| Field | Type |
|-------|------|
| `status` | `PartnerInterestStatus` — `NEW`, `CONTACTED`, `QUALIFIED`, `NOT_A_FIT`, `DEFERRED` |
| `internalNotes` | text (nullable, admin only) |
| `lastContactedAt` | datetime (nullable) |
| `nextFollowUpAt` | datetime (nullable) |
| `updatedAt` | datetime |

### Admin

| Route | Purpose |
|-------|---------|
| `/admin/partner-interest` | Summary cards, status filter, list with status column |
| `/admin/partner-interest/[id]` | Full submission + pipeline edit form |
| `PATCH /api/admin/partner-interest/[id]` | Save status, notes, contact dates |

### Libraries

- `lib/partner-interest-pipeline.ts` — list, summary, update, parse
- `components/AdminEditPartnerInterestForm.tsx`
- `components/PartnerInterestStatusBadge.tsx`

Discovery tags and city/type filters deferred.

---

## Original planning notes

### Database (planned → implemented as `status`, `internalNotes`, dates above)

---

## Market Discovery Framework

Use Phase 29 to learn consistently from each conversation. Suggested discovery dimensions:

### Partner segments (from Phase 28 `PartnerType`)

| Segment | Primary questions |
|---------|-------------------|
| **Garages** | Would digital service history help retention? Who enters data — front desk or technician? |
| **Dealers / importers** | What do buyers ask for before purchase? Would shareable reports reduce friction? |
| **Fleet operators** | How do they track maintenance today? Resale handover needs? |
| **Insurers / lenders** | What vehicle signals matter for underwriting? Official data gaps? |
| **Buyers** (via indirect signals) | What would make them trust a report? Price sensitivity? |

### Discovery themes (tag examples)

- Buyer trust / pre-purchase checks
- Service history digitization
- Import / customs documentation
- Mileage and accident signals
- Report sharing (print, PDF, link)
- Volume / pricing expectations
- Data partnership appetite
- DVLA / official integration interest

### Lightweight process

1. **Triage** — new submission → assign status within 7 days.
2. **Contact** — WhatsApp or call; record notes and tags.
3. **Qualify** — fit for future pilot vs. not now vs. not a fit.
4. **Synthesize** — monthly roll-up: top requests, blockers, willing-to-pay signals (qualitative only in Phase 29).

No scoring model or automated lead ranking in Phase 29.

---

## Success Criteria

Phase 29 documentation is satisfied when planning is clear. **Implementation** success criteria:

- [x] Admin can update pipeline status on a `PartnerInterest` record
- [x] Admin can save internal notes without exposing them publicly
- [x] Admin can filter submissions by status
- [x] Summary counts visible on admin partner interest page
- [ ] At least one documented market discovery synthesis (manual / quarterly review)
- [x] `npm run lint` and `npm run build` pass after schema + admin changes
- [x] No partner accounts, payments, or notifications introduced

---

## Future Implications

Validated learnings from Phase 29 should inform — not automatically trigger — later work:

| If market says… | Possible future phase |
|-----------------|----------------------|
| Dealers want shareable buyer reports | Enhanced share links, branded PDF, dealer CTA on reports |
| Garages want to log service | Partner-submitted events with provenance workflow |
| High volume importers need bulk tools | CSV/API ingestion partnerships |
| Insurers want risk signals | Separate insurer-facing summary (legal review required) |
| Willingness to pay emerges | Subscriptions / invoicing (major scope) |

**ADR-016 principle:** Do not build partner platform expansion until pipeline data and discovery notes show repeated, specific demand.

Phase 29 is the bridge between Phase 28 (capture) and a hypothetical Phase 30+ (partner platform). Keep it small, admin-local, and honest about demo limitations.

---

## Next step

- Discovery tags or city/type filters (optional)
- Manual market discovery synthesis from pipeline notes
- Partner platform expansion only after validated demand (ADR-016)
