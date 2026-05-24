import { PrismaClient, EventType, PhotoSourceType, type Prisma } from "@prisma/client";
import { DEMO_PHOTO_URLS } from "../lib/demo-photo-urls";

const prisma = new PrismaClient();

const SEED_VINS = ["4T1BE46K37U123456", "WVWZZZ3CZWE123456", "1HGBH41JXMN109186"] as const;

type VehicleScalars = Omit<Prisma.VehicleCreateInput, "vin" | "events" | "photos">;
type EventInput = Omit<Prisma.VehicleEventCreateManyInput, "vehicleId">;
type PhotoInput = Omit<Prisma.VehiclePhotoCreateManyInput, "vehicleId">;

async function replaceVehicleHistory(
  vehicleId: string,
  events: EventInput[],
  photos: PhotoInput[],
): Promise<void> {
  await prisma.vehiclePhoto.deleteMany({ where: { vehicleId } });
  await prisma.vehicleEvent.deleteMany({ where: { vehicleId } });

  if (events.length > 0) {
    await prisma.vehicleEvent.createMany({
      data: events.map((event) => ({ ...event, vehicleId })),
    });
  }
  if (photos.length > 0) {
    await prisma.vehiclePhoto.createMany({
      data: photos.map((photo) => ({ ...photo, vehicleId })),
    });
  }
}

async function upsertSeedVehicle(
  vin: string,
  data: VehicleScalars,
  events: EventInput[],
  photos: PhotoInput[],
) {
  const vehicle = await prisma.vehicle.upsert({
    where: { vin },
    create: { vin, ...data },
    update: data,
  });
  await replaceVehicleHistory(vehicle.id, events, photos);
  return vehicle;
}

async function assertSeedPhotoCounts(): Promise<void> {
  const vehicles = await prisma.vehicle.findMany({
    where: { vin: { in: [...SEED_VINS] } },
    include: { photos: { select: { id: true, url: true } } },
  });

  if (vehicles.length !== SEED_VINS.length) {
    throw new Error(
      `Expected ${SEED_VINS.length} seed vehicles, found ${vehicles.length}. VINs: ${vehicles.map((v) => v.vin).join(", ")}`,
    );
  }

  for (const vehicle of vehicles) {
    if (vehicle.photos.length !== 2) {
      throw new Error(
        `${vehicle.make} ${vehicle.vin} (${vehicle.id}) has ${vehicle.photos.length} photos; expected 2.`,
      );
    }
  }
}

async function main() {
  // Clear all demo photos/events so nothing is orphaned on stale vehicle IDs.
  await prisma.vehiclePhoto.deleteMany();
  await prisma.vehicleEvent.deleteMany();

  const toyota = await upsertSeedVehicle(
    "4T1BE46K37U123456",
    {
      chassisNumber: "BE46K37U123456",
      plateNumber: "GR-1234-21",
      make: "Toyota",
      model: "Camry",
      year: 2007,
      trim: "LE",
      engineType: "Inline-4",
      engineSize: "2.4L",
      fuelType: "Petrol",
      countryOfOrigin: "Japan",
      importDate: new Date("2019-03-15"),
    },
    [
      {
        eventType: EventType.IMPORT,
        eventDate: new Date("2019-03-15"),
        mileage: 45000,
        sourceSystem: "Tema Port - Importer Alpha",
        rawPayload: { note: "Cleared customs" },
      },
      {
        eventType: EventType.REGISTRATION,
        eventDate: new Date("2019-04-02"),
        mileage: 45120,
        sourceSystem: "DVLA (sample)",
        rawPayload: { plate: "GR-1234-21" },
      },
      {
        eventType: EventType.SERVICE,
        eventDate: new Date("2020-08-10"),
        mileage: 62000,
        sourceSystem: "Accra Auto Care",
        rawPayload: { service: "Oil change, brakes inspected" },
      },
      {
        eventType: EventType.MILEAGE_UPDATE,
        eventDate: new Date("2022-01-20"),
        mileage: 78000,
        sourceSystem: "Insurer renewal (sample)",
        rawPayload: {},
      },
    ],
    [
      {
        url: DEMO_PHOTO_URLS.toyotaPortImport,
        caption:
          "Toyota Camry — sample Tema Port arrival condition after shipping (demo placeholder; not customs or DVLA proof)",
        sourceType: PhotoSourceType.IMPORT_CONDITION,
        sourceLabel: "Tema Port intake — demo importer only",
        takenAt: new Date("2019-03-14"),
      },
      {
        url: DEMO_PHOTO_URLS.toyotaInspection,
        caption:
          "Toyota Camry — sample independent pre-registration walkaround and checklist (demo placeholder; not dealer-certified)",
        sourceType: PhotoSourceType.INSPECTION,
        sourceLabel: "Inspection partner (sample) — not police or insurer",
        takenAt: new Date("2019-03-28"),
      },
    ],
  );

  const vw = await upsertSeedVehicle(
    "WVWZZZ3CZWE123456",
    {
      chassisNumber: "ZZZ3CZWE123456",
      plateNumber: "GT 5678-22",
      make: "Volkswagen",
      model: "Golf",
      year: 2014,
      trim: "Comfortline",
      engineType: "Turbocharged I4",
      engineSize: "1.4L TSI",
      fuelType: "Petrol",
      countryOfOrigin: "Germany",
      importDate: new Date("2021-07-01"),
    },
    [
      {
        eventType: EventType.IMPORT,
        eventDate: new Date("2021-07-01"),
        mileage: 88000,
        sourceSystem: "Importer Beta",
        rawPayload: {},
      },
      {
        eventType: EventType.ACCIDENT,
        eventDate: new Date("2023-11-05"),
        mileage: 102400,
        sourceSystem: "Insurer Gamma (sample)",
        rawPayload: { severity: "minor", location: "Kumasi" },
      },
    ],
    [
      {
        url: DEMO_PHOTO_URLS.vwAccident,
        caption:
          "VW Golf — sample accident panel damage at Kumasi (demo placeholder; not insurer claim file or police report)",
        sourceType: PhotoSourceType.ACCIDENT_REPAIR,
        sourceLabel: "Insurer Gamma (sample narrative only)",
        takenAt: new Date("2023-11-05"),
      },
      {
        url: DEMO_PHOTO_URLS.vwRepair,
        caption:
          "VW Golf — sample body-shop repair estimate after minor accident (demo placeholder; not authorized dealer work order)",
        sourceType: PhotoSourceType.ACCIDENT_REPAIR,
        sourceLabel: "Body shop estimate (sample)",
        takenAt: new Date("2023-11-12"),
      },
    ],
  );

  const honda = await upsertSeedVehicle(
    "1HGBH41JXMN109186",
    {
      chassisNumber: "BH41JXMN109186",
      plateNumber: null,
      make: "Honda",
      model: "Accord",
      year: 1991,
      trim: "EX",
      engineType: "Inline-4",
      engineSize: "2.2L",
      fuelType: "Petrol",
      countryOfOrigin: "USA",
      importDate: new Date("2015-09-10"),
    },
    [
      {
        eventType: EventType.IMPORT,
        eventDate: new Date("2015-09-10"),
        mileage: 120000,
        sourceSystem: "Classic Imports Ltd",
        rawPayload: {},
      },
    ],
    [
      {
        url: DEMO_PHOTO_URLS.hondaAuction,
        caption:
          "Honda Accord — sample US auction lot listing before export (demo placeholder; not dealer inventory or title record)",
        sourceType: PhotoSourceType.AUCTION,
        sourceLabel: "US auction lot #A-4192 (sample)",
        takenAt: new Date("2015-07-20"),
      },
      {
        url: DEMO_PHOTO_URLS.hondaImportSource,
        caption:
          "Honda Accord — sample export-to-Ghana import source trail (demo placeholder; not customs or DVLA documentation)",
        sourceType: PhotoSourceType.IMPORT_CONDITION,
        sourceLabel: "Classic Imports Ltd — demo intake",
        takenAt: new Date("2015-09-08"),
      },
    ],
  );

  await assertSeedPhotoCounts();

  const withPhotos = await prisma.vehicle.findMany({
    where: { vin: { in: [...SEED_VINS] } },
    include: { _count: { select: { photos: true } } },
  });

  console.log("Seed OK — vehicles and photo counts:");
  for (const row of withPhotos) {
    console.log(`  ${row.make} ${row.vin} id=${row.id} photos=${row._count.photos}`);
  }
  console.log("Report paths:", {
    toyota: `/vehicles/${toyota.id}`,
    vw: `/vehicles/${vw.id}`,
    honda: `/vehicles/${honda.id}`,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
