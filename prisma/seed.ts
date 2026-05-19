import { PrismaClient, EventType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.vehicleEvent.deleteMany();
  await prisma.vehicle.deleteMany();

  const toyota = await prisma.vehicle.create({
    data: {
      vin: "4T1BE46K37U123456",
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
      events: {
        create: [
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
      },
    },
  });

  const vw = await prisma.vehicle.create({
    data: {
      vin: "WVWZZZ3CZWE123456",
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
      events: {
        create: [
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
      },
    },
  });

  const honda = await prisma.vehicle.create({
    data: {
      vin: "1HGBH41JXMN109186",
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
      events: {
        create: [
          {
            eventType: EventType.IMPORT,
            eventDate: new Date("2015-09-10"),
            mileage: 120000,
            sourceSystem: "Classic Imports Ltd",
            rawPayload: {},
          },
        ],
      },
    },
  });

  console.log("Seeded vehicles:", { toyota: toyota.id, vw: vw.id, honda: honda.id });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
