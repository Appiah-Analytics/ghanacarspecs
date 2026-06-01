import { EventType, EvidenceStatus, type Prisma } from "@prisma/client";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { isPostgresDatabaseUrl } from "@/lib/prisma-datasource";

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

export type AdminDataHealth = {
  vehicles: number;
  events: number;
  photos: number;
  vehiclesWithVin: number;
  vehiclesWithPlateNumber: number;
  vehiclesWithChassisNumber: number;
  publishedEvidence: number;
  draftEvidence: number;
  archivedEvidence: number;
};

function buildPostgresVehicleSearchWhere(term: string): Prisma.VehicleWhereInput {
  const insensitiveContains = {
    contains: term,
    mode: "insensitive",
  } as Prisma.StringFilter;

  const insensitiveNullableContains = insensitiveContains as Prisma.StringNullableFilter;

  return {
    OR: [
      { vin: insensitiveContains },
      { plateNumber: insensitiveNullableContains },
      { chassisNumber: insensitiveNullableContains },
    ],
  };
}

async function findSqliteVehicleIdsBySearch(term: string): Promise<string[]> {
  const pattern = `%${term}%`;
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "vehicles"
    WHERE LOWER(vin) LIKE LOWER(${pattern})
       OR ("plateNumber" IS NOT NULL AND LOWER("plateNumber") LIKE LOWER(${pattern}))
       OR ("chassisNumber" IS NOT NULL AND LOWER("chassisNumber") LIKE LOWER(${pattern}))
  `;
  return rows.map((row) => row.id);
}

async function resolveVehicleSearchWhere(search: string | undefined): Promise<Prisma.VehicleWhereInput | undefined> {
  const term = search?.trim();
  if (!term) {
    return undefined;
  }

  if (isPostgresDatabaseUrl(env.DATABASE_URL)) {
    return buildPostgresVehicleSearchWhere(term);
  }

  const ids = await findSqliteVehicleIdsBySearch(term);
  return { id: { in: ids } };
}

async function countEvidenceByStatus(status: EvidenceStatus): Promise<number> {
  const [events, photos] = await Promise.all([
    prisma.vehicleEvent.count({ where: { status } }),
    prisma.vehiclePhoto.count({ where: { status } }),
  ]);
  return events + photos;
}

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

export async function getAdminDataHealth(): Promise<AdminDataHealth> {
  const [
    vehicles,
    events,
    photos,
    vehiclesWithPlateNumber,
    vehiclesWithChassisNumber,
    publishedEvidence,
    draftEvidence,
    archivedEvidence,
  ] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicleEvent.count(),
    prisma.vehiclePhoto.count(),
    prisma.vehicle.count({ where: { plateNumber: { not: null } } }),
    prisma.vehicle.count({ where: { chassisNumber: { not: null } } }),
    countEvidenceByStatus(EvidenceStatus.PUBLISHED),
    countEvidenceByStatus(EvidenceStatus.DRAFT),
    countEvidenceByStatus(EvidenceStatus.ARCHIVED),
  ]);

  return {
    vehicles,
    events,
    photos,
    vehiclesWithVin: vehicles,
    vehiclesWithPlateNumber,
    vehiclesWithChassisNumber,
    publishedEvidence,
    draftEvidence,
    archivedEvidence,
  };
}

export async function getAdminVehicleRows(search?: string): Promise<AdminVehicleRow[]> {
  const where = await resolveVehicleSearchWhere(search);

  const vehicles = await prisma.vehicle.findMany({
    where,
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
