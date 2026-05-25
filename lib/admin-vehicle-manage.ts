import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const adminVehicleManageInclude = {
  events: { orderBy: { eventDate: "desc" as const } },
  photos: { orderBy: { createdAt: "desc" as const } },
} satisfies Prisma.VehicleInclude;

export type AdminVehicleManageData = Prisma.VehicleGetPayload<{ include: typeof adminVehicleManageInclude }>;

export async function getAdminVehicleManage(id: string): Promise<AdminVehicleManageData | null> {
  return prisma.vehicle.findUnique({
    where: { id },
    include: adminVehicleManageInclude,
  });
}
