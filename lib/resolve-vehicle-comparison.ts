import { lookupByVinPlateOrChassis } from "@/lib/lookup";
import { getVehicleForReport } from "@/lib/vehicle-report";
import { buildVehicleReportBundle } from "@/lib/vehicle-report-bundle";
import {
  buildVehicleComparisonSnapshot,
  type VehicleComparisonSnapshot,
} from "@/lib/vehicle-comparison";

/** Resolve VIN, plate, or chassis to a comparison snapshot (published evidence rules). */
export async function resolveComparisonSnapshot(
  identifier: string,
): Promise<VehicleComparisonSnapshot | null> {
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  const local = await lookupByVinPlateOrChassis(trimmed);
  if (!local) return null;

  const vehicle = await getVehicleForReport(local.id);
  if (!vehicle) return null;

  return buildVehicleComparisonSnapshot(buildVehicleReportBundle(vehicle));
}

export type VehicleComparisonSide = {
  query: string;
  snapshot: VehicleComparisonSnapshot | null;
};

export async function resolveComparisonPair(
  queryA: string,
  queryB: string,
): Promise<{ sideA: VehicleComparisonSide; sideB: VehicleComparisonSide }> {
  const [snapshotA, snapshotB] = await Promise.all([
    queryA.trim() ? resolveComparisonSnapshot(queryA) : Promise.resolve(null),
    queryB.trim() ? resolveComparisonSnapshot(queryB) : Promise.resolve(null),
  ]);

  return {
    sideA: { query: queryA.trim(), snapshot: snapshotA },
    sideB: { query: queryB.trim(), snapshot: snapshotB },
  };
}
