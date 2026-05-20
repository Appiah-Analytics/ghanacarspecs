/**
 * Export vehicles and events from the local SQLite database to JSON.
 * Default Prisma client (SQLite schema) must be generated: npm run db:generate
 *
 * Usage: npm run db:export:sqlite
 * Output: prisma/data/sqlite-export.json (gitignored)
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const OUT_DIR = path.join(process.cwd(), "prisma", "data");
const OUT_FILE = path.join(OUT_DIR, "sqlite-export.json");

async function main() {
  const prisma = new PrismaClient();
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: { events: true },
      orderBy: { createdAt: "asc" },
    });

    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(
      OUT_FILE,
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          vehicleCount: vehicles.length,
          eventCount: vehicles.reduce((n, v) => n + v.events.length, 0),
          vehicles,
        },
        null,
        2,
      ),
    );

    console.log(`Exported ${vehicles.length} vehicle(s) to ${OUT_FILE}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
