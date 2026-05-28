import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Include for local vehicle report pages — relation name must match `Vehicle.photos` in schema. */
export const vehicleReportInclude = {
  events: {
    where: { deletedAt: null, status: "PUBLISHED" as const },
    orderBy: { eventDate: "desc" as const },
  },
  photos: {
    where: { deletedAt: null, status: "PUBLISHED" as const },
    orderBy: { createdAt: "desc" as const },
  },
} satisfies Prisma.VehicleInclude;

export type VehicleReportData = Prisma.VehicleGetPayload<{ include: typeof vehicleReportInclude }>;

function logVehicleReportLoad(
  id: string,
  vehicle: { vin: string; photos: { id: string; url: string }[] } | null,
): void {
  if (process.env.NODE_ENV !== "development") return;
  console.info("[vehicle-report]", {
    vehicleId: id,
    found: Boolean(vehicle),
    vin: vehicle?.vin ?? null,
    photoCount: vehicle?.photos.length ?? 0,
    photoUrls: vehicle?.photos.map((p) => p.url) ?? [],
  });
}

/** Load a vehicle with events and photos for `/vehicles/[id]`. */
export async function getVehicleForReport(id: string): Promise<VehicleReportData | null> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: vehicleReportInclude,
  });

  logVehicleReportLoad(id, vehicle);

  if (!vehicle) return null;

  const photos = Array.isArray(vehicle.photos) ? vehicle.photos : [];

  if (process.env.NODE_ENV === "development" && photos.length === 0) {
    const byVin = await prisma.vehicle.findFirst({
      where: { id },
      select: {
        vin: true,
        _count: { select: { photos: true } },
      },
    });
    console.warn("[vehicle-report] photos empty for id; DB counts:", byVin);
  }

  return { ...vehicle, photos };
}
