# GhanaCarSpecs (Phase 1 — local MVP)

Next.js app with **Prisma** and **SQLite** for local vehicle lookup by **VIN** or **plate number**.

## Prerequisites

- [Node.js](https://nodejs.org/) **20+** (LTS recommended)
- npm (bundled with Node)

## Setup (first run)

From the repository root:

```bash
npm install
npm run db:setup
```

`db:setup` runs `prisma db push` (creates/updates `prisma/dev.db`) and `prisma db seed` (sample vehicles and events).

## Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Enter a sample VIN or plate from the list below, then **Look up**. You should be taken to a vehicle report with specs and a timeline.

`npm run dev` uses **Turbopack** for a faster cold start. The first line is often `Starting...`; wait until you see **`Ready in …ms`**, then open the site.

### Dev server stuck on `Starting...`

That message appears **before** Next finishes compiling. On a slow disk, antivirus scan, or **OneDrive** (your repo path is under OneDrive), the first boot can take **several minutes**.

1. **Wait** at least 5–10 minutes on the first run and watch Task Manager: if `node.exe` is using CPU, it is still working.
2. **Clear the cache** and retry: delete the `.next` folder in the project root, then run `npm run dev` again.
3. **Try the classic dev bundler** (sometimes behaves better on Windows): `npm run dev:webpack`
4. **Reduce file-watcher issues** (OneDrive / network drives). In the same PowerShell session before `npm run dev`:

   ```powershell
   $env:WATCHPACK_POLLING="1"
   npm run dev
   ```

5. **Best fix long-term:** clone or copy the project to a **local non-OneDrive folder** (for example `C:\dev\ghanacarspecs`) and run `npm install` + `npm run db:setup` there.

Until you see `Ready`, `Invoke-RestMethod` to `http://localhost:3000` will fail with “Unable to connect to the remote server” because nothing is listening yet.

## Test the lookup API directly

```bash
curl -s -X POST http://localhost:3000/api/v1/lookup ^
  -H "Content-Type: application/json" ^
  -d "{\"vinOrPlate\":\"4T1BE46K37U123456\"}"
```

On macOS/Linux, use `\` line continuation and single-quote the JSON if you prefer.

## Scripts

| Command            | Description                                      |
| ------------------ | ------------------------------------------------ |
| `npm run dev`      | Start Next.js dev server (**Turbopack**)         |
| `npm run dev:webpack` | Same, using the Webpack dev bundler (fallback) |
| `npm run build`    | Production build                                 |
| `npm run start`    | Start production server (after `npm run build`) |
| `npm run lint`     | Typecheck (`tsc --noEmit`)                       |
| `npm run db:push`  | Sync Prisma schema to SQLite                     |
| `npm run db:seed`  | Reseed sample data                               |
| `npm run db:setup` | `db:push` then `db:seed`                         |

## Project layout (Phase 1)

- `app/page.tsx` — Home + lookup form  
- `app/vehicles/[id]/page.tsx` — Vehicle report  
- `app/api/v1/lookup/route.ts` — `POST` JSON `{ "vinOrPlate": "..." }`  
- `lib/lookup.ts` — VIN/plate resolution  
- `prisma/schema.prisma` — `Vehicle`, `VehicleEvent`  
- `prisma/seed.ts` — Sample data  

See `docs/project.md` and `docs/architecture.md` for scope and structure.
