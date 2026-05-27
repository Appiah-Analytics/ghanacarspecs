# Debugging Runtime and Environment

## 1. Summary

GhanaCarSpecs now operates across multiple environments and deployment targets:

- Local SQLite development
- Neon PostgreSQL production-style development
- Vercel production deployment
- Vercel Blob evidence uploads
- Pop!_OS/Linux and Windows developer machines

This runbook captures the key runtime/environment failures we hit, why they happened, and the fastest recovery paths for future operators and chats.

## 2. Major debugging lessons documented

### A. SQLite vs PostgreSQL Prisma schema mismatch

**Symptoms**

- Lookup temporarily unavailable
- `PrismaClientInitializationError`
- Error saying URL must start with protocol `file:`
- Runtime used `schema.prisma` while `DATABASE_URL` was `postgresql://...`

**Root cause**

- Prisma client was generated against SQLite schema
- App runtime was pointed to PostgreSQL `DATABASE_URL`
- Stale `.next` and `node_modules/.prisma` cache

**Fix**

```bash
# stop dev server first
rm -rf .next
rm -rf node_modules/.prisma
npm run db:generate:postgres
npm run dev
```

### B. Neon seeding confusion

**Symptoms**

- Vehicles existed but `photo_count` was `0`
- Production reports showed empty visual evidence
- `db:seed` used SQLite schema accidentally

**Root cause**

- `db:seed` targets local SQLite client
- Neon required `db:seed:postgres`

**Fix**

```bash
npm run db:generate:postgres
npm run db:migrate:postgres
npm run db:seed:postgres
```

### C. Vercel Blob not configured

**Symptoms**

- Image preview showed locally
- Warning: Blob storage is not configured. Set `BLOB_READ_WRITE_TOKEN`
- Upload did not persist

**Root cause**

- Browser preview succeeded client-side
- Server-side Blob upload token was missing

**Fix**

1. Create a public Vercel Blob store.
2. Add `BLOB_READ_WRITE_TOKEN` to local `.env`.
3. Add `BLOB_READ_WRITE_TOKEN` to Vercel environment variables.
4. Restart dev server.

### D. `type="url"` rejected demo paths

**Symptoms**

- `/demo-photos/...` path rejected
- Browser showed “Please enter a URL”

**Root cause**

- HTML input `type="url"` rejects relative paths

**Fix**

- Change photo URL input to `type="text"`
- Keep backend validation for `/demo-photos/`, `http://`, and `https://`

### E. Windows Prisma EPERM lock

**Symptoms**

- `EPERM: operation not permitted`
- `query_engine-windows.dll` rename failed

**Root cause**

- Active dev server/Node process locked Prisma DLL

**Fix**

```powershell
# stop dev server first
taskkill /F /IM node.exe
# then rerun generate command
npm run db:generate
```

### F. Linux `tsc` not found

**Symptoms**

- `npm run lint` failed with `tsc: not found`

**Root cause**

- Dependencies missing or incomplete `node_modules`

**Fix**

```bash
npm install
npm run lint
# if still missing
npm install -D typescript
```

### G. Node version warning

**Symptoms**

- `@vercel/blob` warning: Node `>=20` required
- Node 18 warning on system runtime

**Root cause**

- Pop!_OS system Node version was older

**Current status**

- Not always an immediate blocker
- Upgrade to Node 20+ is strongly recommended

## 3. Correct command workflows

### Local SQLite workflow

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

### Neon/PostgreSQL workflow

```bash
export DATABASE_URL="postgresql://..."
npm run db:generate:postgres
npm run db:migrate:postgres
npm run db:seed:postgres
npm run dev
```

### Clean stale Prisma/Next runtime

```bash
rm -rf .next
rm -rf node_modules/.prisma
npm run db:generate:postgres
npm run dev
```

### Health check

- URL: `http://localhost:3000/api/health`

Expected:

- `ok` = `true`
- `database` = `connected`
- `blob` = `configured` (or `missing` when uploads are intentionally not set up)

## 4. Environment variable rules

- `DATABASE_URL` uncommented and set to `postgresql://...` = PostgreSQL/Neon path
- `DATABASE_URL` commented out = local SQLite path (when local scripts are used)
- `BLOB_READ_WRITE_TOKEN` is required for persisted uploads
- `ADMIN_API_KEY` or `ADMIN_PASSWORD` is required for admin routes
- Never commit real `.env` secrets
- `.env.example` must contain placeholders only

## 5. Production deployment rules

- Vercel build must **not** run `prisma migrate deploy`
- Migrations are manual:

```bash
npm run db:migrate:postgres
```

- Seeding is manual:

```bash
npm run db:seed:postgres
```

- Production must define:
  - `DATABASE_URL`
  - `ADMIN_API_KEY` or `ADMIN_PASSWORD`
  - `BLOB_READ_WRITE_TOKEN`

## 6. Troubleshooting table

| Symptom | Likely cause | Fix | Command |
|---|---|---|---|
| Lookup temporarily unavailable | Prisma client/runtime mismatch or bad DB connection | Regenerate correct client and verify env | `npm run db:generate:postgres` |
| URL must start with `file:` | SQLite-generated client used with Postgres URL | Clear caches and regenerate Postgres client | `rm -rf .next node_modules/.prisma && npm run db:generate:postgres` |
| `photo_count` is 0 | Seed ran against SQLite instead of Neon | Run Postgres migration + Postgres seed | `npm run db:migrate:postgres && npm run db:seed:postgres` |
| Blob storage not configured | Missing Blob token | Add token to `.env` and Vercel env vars | `BLOB_READ_WRITE_TOKEN=...` |
| `tsc` not found | Missing dependencies | Reinstall deps / TypeScript | `npm install` |
| `EPERM query_engine-windows.dll` | Locked Prisma engine file on Windows | Kill node processes and regenerate | `taskkill /F /IM node.exe` |
| Vercel build fails | Missing env vars or wrong Prisma client target | Validate Vercel env and regenerate Postgres client in workflow | `npm run db:generate:postgres` |
| Admin upload preview works but does not persist | Preview is local; server upload failed due token/config | Configure Blob token and restart | `npm run dev` |
| Health endpoint `database: "error"` | Bad/missing `DATABASE_URL` or DB unavailable | Fix `DATABASE_URL`, run migrations, recheck | `npm run db:migrate:postgres` |
| Health endpoint `blob: "missing"` | Blob token not set | Set `BLOB_READ_WRITE_TOKEN` | `BLOB_READ_WRITE_TOKEN=...` |

## 7. Recovery checklist

When things break, run this in order:

1. Check `.env`
2. Check `npm install`
3. Check Prisma schema target
4. Clear `.next`
5. Clear `node_modules/.prisma`
6. Generate correct Prisma client
7. Run health endpoint
8. Test lookup
9. Test admin upload
10. Check Vercel env vars

## 8. Related docs

- [`README.md`](../README.md)
- [`postgresql.md`](./postgresql.md)
- [`production_deployment.md`](./production_deployment.md)
- [`production_checklist.md`](./production_checklist.md)
- [`vercel_blob_setup.md`](./vercel_blob_setup.md)
- [`build_log.md`](./build_log.md)
