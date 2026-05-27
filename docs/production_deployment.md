# Production Deployment Guide

This guide hardens GhanaCarSpecs deployment for repeatable production releases.

## 1) Local development workflow

1. Install dependencies: `npm install`
2. Create env file: `cp .env.example .env`
3. Set required variables:
   - `DATABASE_URL`
   - `ADMIN_API_KEY` or `ADMIN_PASSWORD`
4. Optional for uploads:
   - `BLOB_READ_WRITE_TOKEN`
5. Run typecheck: `npm run lint`
6. Run app: `npm run dev`
7. Verify health: `GET /api/health`

## 2) Neon production workflow

1. Provision Neon project and database.
2. Set `DATABASE_URL` to Neon connection string.
3. Generate PostgreSQL Prisma client:
   - `npm run db:generate:postgres`
4. Apply migrations:
   - `npm run db:migrate:postgres`
5. Optional demo seed:
   - `npm run db:seed:postgres`
6. Verify DB connectivity with `/api/health` (`database: "connected"`).

## 3) Vercel deployment steps

1. Connect repository in Vercel.
2. Configure project env vars:
   - `DATABASE_URL` (required)
   - `ADMIN_API_KEY` or `ADMIN_PASSWORD` (one required)
   - `BLOB_READ_WRITE_TOKEN` (optional, required for upload APIs)
3. Deploy with default build command (`npm run vercel-build` from `vercel.json`).
4. After deploy, run migration command from trusted CI/local environment:
   - `npm run db:migrate:postgres`
5. Validate `/api/health` and a public VIN lookup.

## 4) Required environment variables

- **Required**
  - `DATABASE_URL`
  - `ADMIN_API_KEY` or `ADMIN_PASSWORD`
- **Optional**
  - `BLOB_READ_WRITE_TOKEN` (admin uploads only)

If required variables are missing, startup fails with a clear error from `lib/env.ts`.

## 5) Blob setup

1. Create Blob store in Vercel.
2. Add `BLOB_READ_WRITE_TOKEN` in Vercel project settings.
3. Verify admin upload endpoint (`POST /api/admin/uploads`) with an image.
4. Confirm response returns `ok: true` and blob URL/path.

See also: [`docs/vercel_blob_setup.md`](./vercel_blob_setup.md).

## 6) Health check verification

Use:

```bash
curl -s http://localhost:3000/api/health
```

Expected shape:

- `ok: true`
- `environment: "development" | "production"`
- `database: "connected" | "error"`
- `blob: "configured" | "missing"`
- `timestamp` ISO string
- `version` app version

## 7) Troubleshooting

- **Startup fails on env validation**
  - Confirm required vars exist and are non-empty.
  - Restart server after env changes.
- **Health endpoint shows `database: "error"`**
  - Validate `DATABASE_URL`.
  - Check Neon status/network allow list.
  - Re-run migration.
- **Uploads fail with 503**
  - `BLOB_READ_WRITE_TOKEN` is missing.
- **Admin login fails**
  - Ensure `ADMIN_API_KEY` or `ADMIN_PASSWORD` matches the deployed environment.

## 8) Rollback guidance

1. Roll back Vercel deployment to last known good release.
2. If schema migration caused issues:
   - Stop traffic to write paths.
   - Restore database backup/snapshot in Neon.
3. Re-verify:
   - `/api/health`
   - Admin login
   - VIN lookup
   - Upload path (if Blob enabled)
