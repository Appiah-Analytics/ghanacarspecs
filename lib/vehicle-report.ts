import type { Prisma } from "@prisma/client";

export const vehicleReportInclude = {
  events: { orderBy: { eventDate: "desc" as const } },
  photos: { orderBy: [{ takenAt: "desc" as const }, { createdAt: "desc" as const }] },
} satisfies Prisma.VehicleInclude;

export type VehicleReportData = Prisma.VehicleGetPayload<{ include: typeof vehicleReportInclude }>;
