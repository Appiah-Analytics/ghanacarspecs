/**
 * Generates a Word (.docx) progress report for GhanaCarSpecs.
 * Run: npx tsx scripts/generate-progress-report.ts
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

function p(text: string, opts?: { bold?: boolean; italic?: boolean; before?: number; after?: number }) {
  return new Paragraph({
    spacing: { before: opts?.before ?? 0, after: opts?.after ?? 160 },
    children: [new TextRun({ text, bold: opts?.bold, italics: opts?.italic })],
  });
}

function h1(text: string) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
  });
}

function h2(text: string) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
  });
}

function bullet(text: string) {
  return p(`- ${text}`);
}

async function main() {
  const generated = new Date().toLocaleString("en-GB", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const doc = new Document({
    creator: "GhanaCarSpecs engineering",
    title: "GhanaCarSpecs - Progress Report",
    description: "Summary of work completed through Phase 1 (local MVP).",
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "GhanaCarSpecs.com", bold: true, size: 32 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 400 },
            children: [new TextRun({ text: "Engineering Progress Report (Phase 1)", bold: true, size: 28 })],
          }),
          p(`Document generated: ${generated}`, { italic: true, after: 400 }),

          h1("1. Executive summary"),
          p(
            "This report describes work completed on the GhanaCarSpecs repository through Phase 1: a local-first minimum viable product (MVP) that lets a user look up a vehicle by VIN or plate number against a SQLite database and view a structured report (specifications and event history).",
          ),
          p(
            "The implementation follows internal documentation (product vision, project guide, architecture, roadmap) and deliberately excludes cloud deployment, payments, authentication, and partner or dealer portals.",
          ),

          h1("2. Product context"),
          h2("2.1 Vision (from documentation)"),
          p(
            "GhanaCarSpecs is intended as a Carfax-style vehicle history and specifications platform for Ghana, expanding later across Africa. The long-term product includes public lookup, B2B APIs and dashboards, and a central store of vehicle lifecycle events (import, registration, service, accidents, mileage, etc.).",
          ),
          h2("2.2 Phase 1 goal"),
          p(
            "Phase 1 focused exclusively on a working local application: Next.js + TypeScript + Prisma + SQLite, seed data, a lookup API, and a simple web UI with a clear vehicle report and a visible \"no record found\" path.",
          ),

          h1("3. Repository and engineering hygiene"),
          bullet("Git repository with documentation under docs/ (product vision, project guide, architecture, roadmap)."),
          bullet("Semantic versioning: root package.json version 0.1.0; CHANGELOG.md (Keep a Changelog); annotated tag v0.1.0."),
          bullet(".gitignore for Node, Next.js, Prisma local DB files, environment files, and TypeScript build info."),
          bullet("README.md with setup, database commands, dev server notes (including troubleshooting for slow startup on OneDrive paths), and API test examples."),
          bullet("Cursor project rules (.cursor/rules/project_rules.md) aligning AI-assisted development with documented scope."),

          h1("4. Technical stack (as implemented)"),
          bullet("Application framework: Next.js 15 (App Router) with React 19."),
          bullet("Language: TypeScript with strict compiler settings."),
          bullet("ORM and database: Prisma 6 with SQLite (file prisma/dev.db) for local development."),
          bullet("Development server: npm run dev uses Turbopack (next dev --turbopack); npm run dev:webpack available as fallback."),
          bullet("Quality gate: npm run lint runs tsc --noEmit; production builds verified with next build."),

          h1("5. Data model"),
          p(
            "Prisma schema defines two primary tables (mapped names: vehicles, vehicle_events) plus an EventType enum.",
          ),
          h2("5.1 Vehicle"),
          p(
            "Fields include: unique VIN, optional plate number, make, model, year, optional trim, engine type/size, fuel type, country of origin, import date, and standard created/updated timestamps.",
          ),
          h2("5.2 VehicleEvent"),
          p(
            "Each event references a vehicle, has an EventType (IMPORT, REGISTRATION, SERVICE, ACCIDENT, INSURANCE_CLAIM, MILEAGE_UPDATE, THEFT, OTHER), event date, optional mileage, optional source system label, optional raw_payload JSON for traceability, and created timestamp.",
          ),
          h2("5.3 Seed data"),
          p(
            "prisma/seed.ts loads three sample vehicles: a Toyota Camry (VIN and Ghana-style plate), a Volkswagen Golf (VIN and plate), and a Honda Accord (VIN only). Multiple realistic events are attached (import, registration, service, mileage update, accident sample).",
          ),
          p(
            "Seed text uses ASCII punctuation for Windows-friendly display (e.g. importer source uses a hyphen instead of a Unicode em dash) after an encoding/display issue was corrected.",
          ),

          h1("6. Backend and API"),
          h2("6.1 Lookup endpoint"),
          p("Route: POST /api/v1/lookup"),
          p("Request JSON body: { \"vinOrPlate\": string }"),
          p(
            "Behavior: trims input. If the normalized value has length 17, it is treated as a VIN (uppercase, spaces removed) and matched uniquely. Otherwise plate matching strips non-alphanumeric characters for comparison so users can enter plates with spaces or different hyphenation.",
          ),
          p(
            "Responses: HTTP 200 with found: true, a vehicle object, and an events array (newest-first in the payload) on success; HTTP 404 with found: false and a human-readable message when no vehicle matches; HTTP 400 for malformed JSON or missing vinOrPlate; HTTP 500 on unexpected server errors.",
          ),
          h2("6.2 Supporting libraries"),
          p("lib/prisma.ts: singleton Prisma client pattern suitable for Next.js hot reload in development."),
          p("lib/lookup.ts: shared lookup logic used by the API route."),

          h1("7. Frontend and user experience"),
          h2("7.1 Pages and navigation"),
          bullet("Home (app/page.tsx): hero copy and LookupForm for VIN or plate entry."),
          bullet("Vehicle report (app/vehicles/[id]/page.tsx): server-rendered page loading the vehicle and ordered events from the database by id."),
          bullet("Global not-found page for unknown vehicle ids."),
          h2("7.2 Components"),
          bullet("LookupForm (client): POSTs to the lookup API; navigates to /vehicles/{id} on success; shows structured \"No record found\" and error alerts on failure."),
          bullet("VehicleReport: sections for vehicle specifications (including last known mileage derived from events) and event history."),
          bullet("EventTimeline: per-event cards with type, date, labeled mileage and source system."),
          h2("7.3 Styling"),
          p("Global CSS (app/globals.css) provides layout, cards, alerts, monospace VIN/plate styling, and responsive grids without introducing a component framework."),

          h1("8. Roadmap status"),
          p("Phase 1 items in docs/roadmap.md are marked complete:"),
          bullet("Setup Next.js"),
          bullet("Setup Prisma"),
          bullet("Create lookup API"),
          bullet("Seed database"),
          bullet("Vehicle report page"),
          p("Phase 2 (not started in this scope): CSV ingestion, risk flags, admin upload. Phase 3 (deferred): Azure deployment and monitoring."),

          h1("9. Explicitly out of scope (to date)"),
          bullet("Azure / cloud hosting, Terraform, Application Insights."),
          bullet("Payments, subscriptions, paid reports, API billing."),
          bullet("Partner portal, dealer dashboard, complex authentication, mobile app."),
          bullet("DVLA, insurer, or bank integrations."),

          h1("10. How to run and test (summary)"),
          p("From repository root: npm install; npm run db:setup (or prisma db push and prisma db seed); npm run dev."),
          p("Sample VINs: 4T1BE46K37U123456 (Toyota), WVWZZZ3CZWE123456 (Volkswagen), 1HGBH41JXMN109186 (Honda). Sample plates: GR-1234-21, GT 5678-22."),
          p("If port 3000 is busy, Next.js may bind to 3001; use the URL shown in the terminal for browser and curl/Invoke-RestMethod tests."),

          h1("11. Operational notes"),
          p(
            "Repositories under OneDrive can experience very slow first dev server startup; Turbopack and/or moving the clone to a non-synced path are recommended. WATCHPACK_POLLING=1 can help file watchers in some environments.",
          ),

          h1("12. Recommended next steps"),
          bullet("Begin Phase 2: CSV ingestion pipeline, simple risk flags in the report DTO, and a minimal admin upload path as described in the roadmap."),
          bullet("Add automated tests (API contract and lookup edge cases) when the MVP stabilizes."),
          bullet("Plan production hosting and a managed database when Phase 3 is approved."),

          new Paragraph({
            spacing: { before: 400 },
            children: [
              new TextRun({
                text: "End of report.",
                italics: true,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const outDir = path.join(process.cwd(), "docs");
  const outPath = path.join(outDir, "GhanaCarSpecs_Progress_Report.docx");
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buffer);
  console.log("Wrote:", outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
