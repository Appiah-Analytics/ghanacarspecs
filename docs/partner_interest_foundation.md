# Partner Interest Foundation (Phase 28)

Captures interest from garages, dealers, importers, fleet operators, insurers, and other ecosystem participants — without accounts, workflows, payments, or notifications.

Related: [`ghana_market_positioning.md`](./ghana_market_positioning.md), ADR-015 in [`architecture_decisions.md`](./architecture_decisions.md).

---

## Purpose

Store lightweight partner interest submissions in the database and let admins review them in a simple table. Public users submit via `/partners/apply`; no partner portal or onboarding workflow in this phase.

## Data model

`PartnerInterest` (`partner_interests` table):

| Field | Type | Required |
|-------|------|----------|
| `partnerType` | `PartnerType` enum | Yes |
| `businessName` | string | Yes |
| `contactPerson` | string | Yes |
| `whatsappNumber` | string | Yes |
| `email` | string | No |
| `city` | string | Yes |
| `monthlyVehicleVolume` | string | No |
| `notes` | string | No |
| `status` | `PartnerInterestStatus` | Auto (`NEW`) — Phase 29 |
| `internalNotes` | string | No (admin only) — Phase 29 |
| `lastContactedAt` | datetime | No — Phase 29 |
| `nextFollowUpAt` | datetime | No — Phase 29 |
| `createdAt` | datetime | Auto |
| `updatedAt` | datetime | Auto — Phase 29 |

**PartnerType values:** `GARAGE`, `DEALER`, `IMPORTER`, `FLEET_OPERATOR`, `INSURER`, `LENDER`, `SERVICE_PROVIDER`, `OTHER`

PostgreSQL migration: `prisma/migrations/20260607120000_partner_interest/`

## Public routes

| Route | Purpose |
|-------|---------|
| `/partners/apply` | Partner interest form |
| `POST /api/partners/interest` | Create submission (public, validated JSON) |

CTA on `/partners` links to `/partners/apply`.

## Admin routes

| Route | Purpose |
|-------|---------|
| `/admin/partner-interest` | Pipeline summary, status filter, submission list |
| `/admin/partner-interest/[id]` | Detail view + pipeline edit (Phase 29) |

Linked from `AdminNav`. Updates via `PATCH /api/admin/partner-interest/[id]`.

## Implementation

| Piece | Path |
|-------|------|
| Schema | `prisma/schema.prisma`, `prisma/schema.postgresql.prisma` |
| Validation | `lib/partner-interest.ts` |
| Form options | `lib/partner-interest-options.ts` |
| Form UI | `components/PartnerInterestForm.tsx` |
| API | `app/api/partners/interest/route.ts` |
| Admin page | `app/admin/partner-interest/page.tsx` |

## Intentionally not implemented

- User accounts or partner dashboards
- Email/WhatsApp notifications
- Approval workflows or payments
- Lead scoring or CRM integration

## Next step

- Phase 29: partner pipeline status, admin notes, and market discovery (see [`phase_29_partner_pipeline_market_discovery.md`](./phase_29_partner_pipeline_market_discovery.md))
- Rate limiting on public POST; full partner onboarding when ready
