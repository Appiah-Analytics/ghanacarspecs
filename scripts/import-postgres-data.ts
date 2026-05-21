/**
 * Import prisma/data/sqlite-export.json into PostgreSQL.
 *
 * Prerequisites:
 *   1. DATABASE_URL points at an empty or target PostgreSQL database
 *   2. npm run db:generate:postgres
 *   3. npm run db:migrate:postgres   (applies prisma/migrations)
 *   4. npm run db:export:sqlite      (optional source data)
 *
 * Usage: npm run db:import:postgres
 *
 * After import, run npm run db:generate to restore the SQLite Prisma client for local dev.
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const IN_FILE = path.join(process.cwd(), "prisma", "data", "sqlite-export.json");

type ExportPayload = {
  vehicles: Array<{
    id: string;
    vin: string;
    chassisNumber: string | null;
    plateNumber: string | null;
    make: string;
    model: string;
    year: number;
    trim: string | null;
    engineType: string | null;
    engineSize: string | null;
    fuelType: string | null;
    countryOfOrigin: string | null;
    importDate: string | null;
    createdAt: string;
    updatedAt: string;
    events: Array<{
      id: string;
      vehicleId: string;
      eventType: string;
      eventDate: string;
      mileage: number | null;
      sourceSystem: string | null;
      rawPayload: unknown;
      createdAt: string;
    }>;
  }>;
};

async function main() {
  const dbUrl = process.env.DATABASE_URL ?? "";
  if (!dbUrl.startsWith("postgres")) {
    console.error("DATABASE_URL must be a PostgreSQL connection string for db:import:postgres.");
    process.exit(1);
  }

  if (!fs.existsSync(IN_FILE)) {
    console.error(`Missing ${IN_FILE}. Run npm run db:export:sqlite first.`);
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(IN_FILE, "utf8")) as ExportPayload;
  const prisma = new PrismaClient();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.vehicleEvent.deleteMany();
      await tx.vehicle.deleteMany();

      for (const vehicle of payload.vehicles) {
        await tx.vehicle.create({
          data: {
            id: vehicle.id,
            vin: vehicle.vin,
            chassisNumber: vehicle.chassisNumber,
            plateNumber: vehicle.plateNumber,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            trim: vehicle.trim,
            engineType: vehicle.engineType,
            engineSize: vehicle.engineSize,
            fuelType: vehicle.fuelType,
            countryOfOrigin: vehicle.countryOfOrigin,
            importDate: vehicle.importDate ? new Date(vehicle.importDate) : null,
            createdAt: new Date(vehicle.createdAt),
            updatedAt: new Date(vehicle.updatedAt),
            events: {
              create: vehicle.events.map((event) => ({
                id: event.id,
                eventType: event.eventType as never,
                eventDate: new Date(event.eventDate),
                mileage: event.mileage,
                sourceSystem: event.sourceSystem,
                rawPayload: event.rawPayload as never,
                createdAt: new Date(event.createdAt),
              })),
            },
          },
        });
      }
    });

    console.log(`Imported ${payload.vehicles.length} vehicle(s) into PostgreSQL.`);
    console.log("Run npm run db:generate to switch the Prisma client back to SQLite for local dev.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
