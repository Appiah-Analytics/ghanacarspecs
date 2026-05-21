import { EventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const GHANA_ALIASES = new Set(["GHANA", "GH", "REPUBLIC OF GHANA"]);

function isGhanaOrigin(country: string | null): boolean {
  if (!country) return false;
  return GHANA_ALIASES.has(country.trim().toUpperCase());
}

type ImportCheckVehicle = {
  importDate: Date | null;
  countryOfOrigin: string | null;
  events: { eventType: EventType }[];
};

export function isImportedVehicle(vehicle: ImportCheckVehicle): boolean {
  if (vehicle.events.some((e) => e.eventType === EventType.IMPORT)) return true;
  if (vehicle.importDate) return true;
  if (vehicle.countryOfOrigin && !isGhanaOrigin(vehicle.countryOfOrigin)) return true;
  return false;
}

export type AdminDashboardSummary = {
  totalVehicles: number;
  totalEvents: number;
  vehiclesWithAccidentsOrClaims: number;
  vehiclesWithChassis: number;
  importedVehicles: number;
};

export type AdminVehicleRow = {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  chassisNumber: string | null;
  plateNumber: string | null;
  eventCount: number;
  latestEventDate: Date | null;
};

export async function getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  const [totalVehicles, totalEvents, vehiclesWithAccidentsOrClaims, vehiclesWithChassis, importCandidates] =
    await Promise.all([
      prisma.vehicle.count(),
      prisma.vehicleEvent.count(),
      prisma.vehicle.count({
        where: {
          events: {
            some: {
              eventType: { in: [EventType.ACCIDENT, EventType.INSURANCE_CLAIM] },
            },
          },
        },
      }),
      prisma.vehicle.count({
        where: { chassisNumber: { not: null } },
      }),
      prisma.vehicle.findMany({
        select: {
          importDate: true,
          countryOfOrigin: true,
          events: { select: { eventType: true } },
        },
      }),
    ]);

  const importedVehicles = importCandidates.filter(isImportedVehicle).length;

  return {
    totalVehicles,
    totalEvents,
    vehiclesWithAccidentsOrClaims,
    vehiclesWithChassis,
    importedVehicles,
  };
}

export async function getAdminVehicleRows(): Promise<AdminVehicleRow[]> {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      events: {
        select: { eventDate: true },
        orderBy: { eventDate: "desc" },
      },
    },
    orderBy: [{ year: "desc" }, { make: "asc" }, { model: "asc" }],
  });

  return vehicles.map((vehicle) => ({
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    vin: vehicle.vin,
    chassisNumber: vehicle.chassisNumber,
    plateNumber: vehicle.plateNumber,
    eventCount: vehicle.events.length,
    latestEventDate: vehicle.events[0]?.eventDate ?? null,
  }));
}
