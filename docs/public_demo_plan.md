# GhanaCarSpecs — Public demo plan

**Status:** Demo-ready in code — **not deployed** from this document.  
**Last updated:** 2026-05-20 (Phase 10)  
**Related:** [`sample_data.md`](sample_data.md), [`deployment_plan.md`](deployment_plan.md), [`postgresql.md`](postgresql.md)

---

## 1. Demo goal

Present GhanaCarSpecs to a public audience as a **credible vehicle intelligence and history platform for Ghana**, without over-promising production data coverage.

Success looks like:

- A visitor understands what the product does in under 30 seconds.
- They can try realistic lookups (local sample report, external VIN decode, not-found).
- They see clear labeling: **local sample data** vs **external decode**.
- Admin and ingestion tools stay protected and are not advertised on the homepage.

---

## 2. What works today (safe to demo)

| Capability | Demo behavior |
|------------|----------------|
| **Homepage lookup** | VIN, Ghana plate, or chassis search |
| **Local report** | Specs, event timeline, vehicle intelligence (mileage, accidents, import, service, confidence) |
| **External VIN decode** | NHTSA vPIC specs when VIN not in local DB (17 characters) |
| **Record source banners** | Green = local GhanaCarSpecs; blue = external decode |
| **Try-the-demo section** | One-click fill of sample values from [`sample_data.md`](sample_data.md) |
| **Public disclaimer** | Sample data + external decode limitations |

**Example flows** (also on homepage):

- `4T1BE46K37U123456` or `GR-1234-21` → local Toyota Camry report  
- `WVWZZZ3CZWE123456` → local VW with accident flag  
- `1HGCM82633A004352` → external NHTSA decode (no local history)  
- `GR-9999-99` or `XX-0000-00` → no local record (demo limitation explained)  

---

## 3. What is sample data

Everything returned as a **Local GhanaCarSpecs record** in the current demo build is **sample / development data**, including:

- The three seeded vehicles in `prisma/seed.ts` (Toyota, Volkswagen, Honda).
- Any vehicles added via local CSV ingest on a developer machine.
- Intelligence signals derived from those events (not verified against DVLA, insurers, or dealers).

**External VIN decoded record** results are real-time calls to **NHTSA vPIC** (US public API). They are manufacturer specifications only — not GhanaCarSpecs history.

---

## 4. What not to promise yet

Do **not** tell demo audiences that GhanaCarSpecs currently provides:

| Topic | Status |
|-------|--------|
| Official DVLA / Ghana government records | Not integrated |
| Nationwide coverage of registered vehicles | Not available |
| Verified accident or insurance claims from insurers | Sample flags only |
| Paid reports or subscriptions | Not built |
| User accounts or saved searches | Not built |
| Dealer / partner portals | Not built |
| Azure-hosted production environment | Documented, not deployed |
| Real-time data feeds from ports, workshops, or insurers | Not built |

Use language like **“demonstration”**, **“sample records”**, and **“platform preview”** until production data partnerships exist.

---

## 5. Public UX (Phase 10)

- Homepage positions GhanaCarSpecs as **vehicle intelligence & history for Ghana**.
- **How lookup works** explains local-first + NHTSA fallback.
- **Try the demo** uses canonical sample values.
- **Where do I find my VIN or chassis number?** — Ghana-relevant guidance (door frame, dashboard, documents; VIN, plate, or chassis).
- **Public demo notice** disclaimer on the homepage.
- Site header/footer branding; **no admin link** on the public homepage.
- Metadata title/description updated for sharing and search previews.

Admin routes (`/admin`, `/admin/ingest`) remain protected by Phase 8 env secret + middleware.

---

## 6. Deployment checklist (Vercel + Neon — later)

Use when the team chooses to host a public demo URL. **Not executed in Phase 10.**

### Prerequisites

- [ ] GitHub repo ready (no secrets committed)
- [ ] Neon (or other) PostgreSQL project created
- [ ] Vercel project linked to repo

### Database (Neon)

- [ ] Create database; copy `DATABASE_URL` (pooled connection string for serverless)
- [ ] Set `DATABASE_URL` in Vercel environment variables (Production + Preview)
- [ ] Deploy command includes:
  ```bash
  npm run db:generate:postgres
  npm run db:migrate:postgres
  ```
- [ ] Run seed once on empty DB: `npm run db:seed` (or re-seed via script in CI)
- [ ] Confirm sample vehicles exist in Neon after migrate + seed

### Application (Vercel)

- [ ] Set `ADMIN_API_KEY` in Vercel secrets (do not expose to client)
- [ ] `NODE_ENV=production` (automatic on Vercel)
- [ ] Build: `npm run vercel-build` (postgres `prisma generate` + `next build`; set `DATABASE_URL`)
- [ ] Migrations: `npm run db:migrate:postgres` manually against Neon when schema changes (not during Vercel build)
- [ ] Smoke test production URL:
  - [ ] Homepage loads; Try demo examples work
  - [ ] Local VIN lookup → report
  - [ ] External VIN → `/decoded`
  - [ ] `/admin` redirects to login (not publicly usable without secret)

### What we are not doing in this checklist

- Azure App Service (see [`deployment_plan.md`](deployment_plan.md) for Azure path)
- Custom domain / TLS beyond Vercel defaults (optional add-on)
- Payments, auth, DVLA APIs

### Post-deploy messaging

- [ ] Update homepage or footer with production demo URL if different from marketing site
- [ ] Keep disclaimer visible
- [ ] Monitor Vercel logs and Neon connection limits

---

## 7. Suggested demo script (5 minutes)

1. Open homepage — explain Ghana-focused intelligence + history vision.  
2. Try **Toyota VIN** — walk through local report, intelligence panel, timeline.  
3. Try **external VIN** (`1HGCM82633A004352`) — contrast: NHTSA specs only, labeled external.  
4. Try **realistic Ghana plate** (`GR-9999-99`) — show transparent no-local-record explanation.  
5. Point to disclaimer — sample data, not for purchase decisions.  

---

## 8. Maintenance

When sample data or flows change, update:

- [`sample_data.md`](sample_data.md)
- `components/DemoExamples.tsx` (homepage try list)
- `components/VinChassisGuidance.tsx` (where to find VIN/chassis/plate)
- This document if demo promises or deploy target changes
