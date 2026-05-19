# GhanaCarSpecs — Deployment readiness plan

**Status:** Documentation only — **do not deploy from this document alone.**  
**Last updated:** 2026-05-19 (stabilization pass)  
**Phase:** [Roadmap Phase 7](roadmap.md#phase-7--infrastructure--deployment)

Related: [`architecture.md`](architecture.md), [`roadmap.md`](roadmap.md), [`build_log.md`](build_log.md), [`sample_data.md`](sample_data.md), [`.env.example`](../.env.example).

---

## 1. Current architecture

Single **Next.js 15** app (App Router) + **SQLite** (`prisma/dev.db`) + outbound **NHTSA vPIC** for external 17-character VIN decode.

```text
User → Home → POST /api/v1/lookup → lib/lookup
              ├─ local (VIN / plate / chassis) → /vehicles/[id]
              ├─ external VIN → sessionStorage → /decoded
              └─ miss → 404

Admin → /admin → /vehicles/[id]
     → /admin/ingest → POST /api/admin/ingest → lib/csv-ingest
```

| Route | Purpose |
|-------|---------|
| `/`, `/vehicles/[id]`, `/decoded` | Public lookup and reports |
| `/admin`, `/admin/ingest` | Local admin (no auth) |
| `POST /api/v1/lookup` | Lookup API |
| `POST /api/admin/ingest` | CSV import |

Not built: auth, payments, Azure hosting, background jobs, `public/` static assets.

---

## 2. Environment variables

| Variable | Required today | Used in code? | Notes |
|----------|----------------|---------------|--------|
| `NODE_ENV` | Auto | Yes (`lib/prisma.ts`) | Logging and dev Prisma singleton |
| `DATABASE_URL` | No | No (hardcoded in schema) | Set before PostgreSQL migration |
| `PORT` | No | Next default | `next start` |
| `NEXT_PUBLIC_APP_URL` | No | No | Planned canonical URL |
| `ADMIN_API_KEY` | No | No | Planned ingest protection |
| `AUTH_SECRET` | No | No | Planned sessions |

Copy [`.env.example`](../.env.example) to `.env` for local overrides. Prisma currently uses `url = "file:./dev.db"` in `prisma/schema.prisma` (not `env("DATABASE_URL")`).

---

## 3. Local development flow

```bash
npm install
npm run db:setup    # prisma db push + seed
npm run dev         # http://localhost:3000
```

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run dev:webpack` | Dev server (Webpack fallback) |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | Typecheck (`tsc --noEmit`) |
| `npm run db:push` | Apply schema to SQLite |
| `npm run db:seed` | Reseed (clears vehicles/events in seed script) |
| `npm run db:setup` | `db:push` then `db:seed` |
| `npm run report:docx` | Regenerate Word report in `docs/` |

Verify with values in [`sample_data.md`](sample_data.md). Admin: `/admin`, ingest: `/admin/ingest`.

---

## 4. Recommended production stack (lightweight)

| Layer | Choice |
|-------|--------|
| Compute | **Azure App Service** (Linux, Node 20) |
| Database | **Azure Database for PostgreSQL** (Flexible Server) |
| Secrets | App Service settings or Key Vault |
| Monitoring | Application Insights |
| CI | GitHub Actions: `npm ci`, `lint`, `build`, deploy |

No Kubernetes or Terraform required for first production.

---

## 5. SQLite limitations

- Single writer; poor fit for multiple App Service instances  
- File on disk is lost on ephemeral containers without persistent storage  
- No managed backups or replication  
- Plate/chassis lookup scans all rows (OK for MVP scale only)

**Use SQLite for local development only.** Production should use PostgreSQL (§6).

---

## 6. Future PostgreSQL migration path

1. Set `provider = "postgresql"` and `url = env("DATABASE_URL")` in `prisma/schema.prisma`.  
2. Add `DATABASE_URL` to `.env` and Azure configuration.  
3. Introduce `prisma migrate` (replace `db push` for production).  
4. Migrate data (re-seed, CSV re-import, or export script).  
5. Deploy with `npx prisma migrate deploy` before `next start`.

---

## 7. Azure deployment considerations

- App Service + PostgreSQL in one region; firewall DB to App Service outbound IPs.  
- Allow HTTPS outbound to `vpic.nhtsa.dot.gov`.  
- Protect or disable `/admin` and `/api/admin/ingest` before go-live.  
- Staging and production: separate apps and databases.  
- Enable HTTPS-only and Application Insights.

Deferred: AKS, API Management, multi-region active-active.

---

## 8. Image and static asset strategy

- UI is **CSS-only** (`app/globals.css`); no `public/` folder or `next/image` today.  
- Use `next start` (not `output: 'export'`) — API routes and dynamic pages require a Node server.  
- Future logos/favicons: `public/` in git; large uploads: Azure Blob + CDN.

---

## 9. Backup strategy

| Environment | Approach |
|-------------|----------|
| Local SQLite | Stop app; copy `prisma/dev.db` |
| PostgreSQL (Azure) | Automated backups + PITR; optional weekly `pg_dump` |
| Operational | Retain source CSV files used for ingest |

Run a restore drill on staging before production cutover.

---

## 10. Security considerations

| Risk | Mitigation before production |
|------|------------------------------|
| Open admin routes | Auth, API key, or IP restriction |
| Public lookup API | Rate limiting |
| CSV upload size | Body size limits on route and host |
| Secrets in git | `.env` gitignored; platform secret store |
| Vehicle identifiers in DB | Retention policy; PostgreSQL encryption at rest |

---

## 11. Production readiness checklist

### Build and schema

- [ ] `npm run lint` and `npm run build` pass on CI  
- [ ] `DATABASE_URL` + PostgreSQL in Prisma schema  
- [ ] `prisma migrate deploy` in release process  
- [ ] `postinstall` → `prisma generate` on deploy host  

### Database and hosting

- [ ] Production PostgreSQL (not SQLite)  
- [ ] Backups and restore drill completed  
- [ ] App Service Node 20, `NODE_ENV=production`, TLS  

### Security and ops

- [ ] Admin routes protected or disabled  
- [ ] No secrets committed; `.env.example` documents names only  
- [ ] Application Insights and 5xx alerts  
- [ ] Smoke tests from [`sample_data.md`](sample_data.md) on staging  

### Deferred (OK later)

- [ ] Kubernetes / Terraform estates  
- [ ] Payments and partner API  

---

## 12. Suggested sequence (when approved)

1. PostgreSQL + `DATABASE_URL` on staging.  
2. Provision Azure (staging).  
3. Deploy, migrate, smoke test, protect admin.  
4. Production cutover and monitor 24–48 hours.

**Do not execute these steps until the checklist above is owned by the team.**
