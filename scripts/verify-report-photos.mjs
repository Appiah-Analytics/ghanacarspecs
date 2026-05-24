import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const VINS = ["4T1BE46K37U123456", "WVWZZZ3CZWE123456", "1HGBH41JXMN109186"];

for (const vin of VINS) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { vin },
    include: { photos: { orderBy: { createdAt: "desc" } } },
  });
  console.log(
    vin,
    "report",
    vehicle ? `/vehicles/${vehicle.id}` : "MISSING",
    "photos",
    vehicle?.photos.length ?? 0,
  );
}

await prisma.$disconnect();
