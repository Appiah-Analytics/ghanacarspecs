import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Include for local vehicle report pages — relation name must match `Vehicle.photos` in schema. */
export const vehicleReportInclude = {
  events: { orderBy: { eventDate: "desc" as const } },
  photos: { orderBy: { createdAt: "desc" as const } },
} satisfies Prisma.VehicleInclude;

export type VehicleReportData = Prisma.VehicleGetPayload<{ include: typeof vehicleReportInclude }>;

/** Load a vehicle with events and photos for `/vehicles/[id]`. */
export async function getVehicleForReport(id: string): Promise<VehicleReportData | null> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: vehicleReportInclude,
  });
  if (!vehicle) return null;
  return { ...vehicle, photos: vehicle.photos ?? [] };
}
