# Production Readiness Checklist

Run this checklist before each production release.

## Environment variables

- [ ] `DATABASE_URL` is set and valid.
- [ ] One admin secret is configured: `ADMIN_API_KEY` or `ADMIN_PASSWORD`.
- [ ] `BLOB_READ_WRITE_TOKEN` is set if admin uploads are required.

## Database migrations and seed

- [ ] `npm run db:generate:postgres` completed.
- [ ] `npm run db:migrate:postgres` completed with no errors.
- [ ] Optional seed completed if demo data is expected (`npm run db:seed:postgres`).

## Seed verification

- [ ] At least one known VIN is queryable from the deployed DB.
- [ ] Vehicle timeline and photos load for seeded records (if seeded).

## Blob verification

- [ ] Blob token present in deployment environment.
- [ ] `POST /api/admin/uploads` accepts an image and returns blob URL.

## Admin flow checks

- [ ] `/admin/login` accepts configured admin secret.
- [ ] Session persists and protected admin pages open.
- [ ] Admin event/photo mutations succeed from manage vehicle page.

## Public flow checks

- [ ] VIN lookup returns expected local or external response.
- [ ] Upload test image appears in the related vehicle report.
- [ ] Mobile viewport check passes on home, lookup result, and admin login pages.

## Error and health checks

- [ ] `GET /api/health` returns `ok: true`.
- [ ] `/api/health` reports `database: "connected"`.
- [ ] Structured logs show no secret leakage.
- [ ] Recent logs contain no unexplained server errors.

## Release sign-off

- [ ] Rollback path is identified (previous Vercel deploy + Neon backup).
- [ ] Stakeholder approval recorded.
