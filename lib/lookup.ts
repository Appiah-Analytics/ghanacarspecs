import type { Prisma } from "@prisma/client";
import { normalizeChassisKey, normalizePlateKey, normalizeVin } from "@/lib/lookup-normalize";
import { prisma } from "@/lib/prisma";
import { decodeVinNhtsa, type ExternalVinSpecs } from "@/lib/nhtsa-vin";

export { normalizeChassisKey, normalizePlateKey, normalizeVin } from "@/lib/lookup-normalize";

const vehicleInclude = {
  events: { orderBy: { eventDate: "desc" as const } },
} satisfies Prisma.VehicleInclude;

export type VehicleWithEvents = Prisma.VehicleGetPayload<{ include: typeof vehicleInclude }>;

export type ResolveLookupOutcome =
  | { result: "local"; vehicle: VehicleWithEvents }
  | { result: "external"; vin: string; specs: ExternalVinSpecs; provider: string }
  | { result: "not_found" }
  | { result: "external_failed"; reason: string };

/**
 * Local lookup by VIN (17 chars), then plate, then chassis number.
 * API body field remains `vinOrPlate` for compatibility; value may be any of the three.
 */
export async function lookupByVinPlateOrChassis(query: string): Promise<VehicleWithEvents | null> {
  const raw = query.trim();
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
  if (plateKey) {
    const plateCandidates = await prisma.vehicle.findMany({
      where: { plateNumber: { not: null } },
      include: vehicleInclude,
    });
    const byPlate = plateCandidates.find(
      (v) => v.plateNumber && normalizePlateKey(v.plateNumber) === plateKey,
    );
    if (byPlate) return byPlate;
  }

  const chassisKey = normalizeChassisKey(raw);
  if (chassisKey) {
    const chassisCandidates = await prisma.vehicle.findMany({
      where: { chassisNumber: { not: null } },
      include: vehicleInclude,
    });
    const byChassis = chassisCandidates.find(
      (v) => v.chassisNumber && normalizeChassisKey(v.chassisNumber) === chassisKey,
    );
    if (byChassis) return byChassis;
  }

  return null;
}

/** @deprecated Use lookupByVinPlateOrChassis */
export const lookupByVinOrPlate = lookupByVinPlateOrChassis;

/**
 * Local DB first (VIN, plate, chassis). If no row and input is a 17-character VIN, try NHTSA vPIC.
 * Plate and chassis lookups never trigger the external API.
 */
export async function resolveLookupWithExternalVin(query: string): Promise<ResolveLookupOutcome> {
  const local = await lookupByVinPlateOrChassis(query);
  if (local) return { result: "local", vehicle: local };

  const asVin = normalizeVin(query);
  if (asVin.length !== 17) return { result: "not_found" };

  const decoded = await decodeVinNhtsa(asVin);
  if (!decoded.ok) return { result: "external_failed", reason: decoded.reason };

  return { result: "external", vin: decoded.vin, specs: decoded.specs, provider: decoded.provider };
}
