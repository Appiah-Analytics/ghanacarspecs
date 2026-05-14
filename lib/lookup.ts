import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decodeVinNhtsa, type ExternalVinSpecs } from "@/lib/nhtsa-vin";

const vehicleInclude = {
  events: { orderBy: { eventDate: "desc" as const } },
} satisfies Prisma.VehicleInclude;

export type VehicleWithEvents = Prisma.VehicleGetPayload<{ include: typeof vehicleInclude }>;

export type ResolveLookupOutcome =
  | { result: "local"; vehicle: VehicleWithEvents }
  | { result: "external"; vin: string; specs: ExternalVinSpecs; provider: string }
  | { result: "not_found" }
  | { result: "external_failed"; reason: string };

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

/**
 * Local DB first. If no row and input is a 17-character VIN, try NHTSA vPIC decode.
 * Plate-only lookups never hit the external API.
 */
export async function resolveLookupWithExternalVin(vinOrPlate: string): Promise<ResolveLookupOutcome> {
  const local = await lookupByVinOrPlate(vinOrPlate);
  if (local) return { result: "local", vehicle: local };

  const asVin = normalizeVin(vinOrPlate);
  if (asVin.length !== 17) return { result: "not_found" };

  const decoded = await decodeVinNhtsa(asVin);
  if (!decoded.ok) return { result: "external_failed", reason: decoded.reason };

  return { result: "external", vin: decoded.vin, specs: decoded.specs, provider: decoded.provider };
}
