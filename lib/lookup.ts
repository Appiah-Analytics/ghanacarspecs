import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const vehicleInclude = {
  events: { orderBy: { eventDate: "desc" as const } },
} satisfies Prisma.VehicleInclude;

export type VehicleWithEvents = Prisma.VehicleGetPayload<{ include: typeof vehicleInclude }>;

/** Normalize VIN: trim, uppercase, remove spaces. */
export function normalizeVin(input: string): string {
  return input.trim().replace(/\s+/g, "").toUpperCase();
}

/** Normalize plate for comparison: uppercase, keep only letters and digits. */
export function normalizePlateKey(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function lookupByVinOrPlate(vinOrPlate: string): Promise<VehicleWithEvents | null> {
  const raw = vinOrPlate.trim();
  if (!raw) return null;

  const asVin = normalizeVin(raw);
  if (asVin.length === 17) {
    const byVin = await prisma.vehicle.findUnique({
      where: { vin: asVin },
      include: vehicleInclude,
    });
    if (byVin) return byVin;
  }

  const plateKey = normalizePlateKey(raw);
  if (!plateKey) return null;

  const candidates = await prisma.vehicle.findMany({
    where: { plateNumber: { not: null } },
    include: vehicleInclude,
  });

  const match = candidates.find((v) => v.plateNumber && normalizePlateKey(v.plateNumber) === plateKey);
  return match ?? null;
}
