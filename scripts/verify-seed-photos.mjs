import { PrismaClient } from "@prisma/client";

const VINS = {
  toyota: "4T1BE46K37U123456",
  vw: "WVWZZZ3CZWE123456",
  honda: "1HGBH41JXMN109186",
};

const prisma = new PrismaClient();

const vehicles = await prisma.vehicle.findMany({
  where: { vin: { in: Object.values(VINS) } },
  include: { photos: true },
});

for (const v of vehicles) {
  console.log(`${v.make} ${v.vin} id=${v.id} photos=${v.photos.length}`);
  for (const p of v.photos) console.log(`  - ${p.url}`);
}

const orphanPhotos = await prisma.vehiclePhoto.count({
  where: { vehicle: { vin: { notIn: Object.values(VINS) } } },
});
console.log("orphan photos on other vehicles:", orphanPhotos);
console.log("total photos:", await prisma.vehiclePhoto.count());

await prisma.$disconnect();
