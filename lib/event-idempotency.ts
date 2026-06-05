import type { EventType, PrismaClient } from "@prisma/client";
import type { ImportValidationIssue } from "@/lib/import-validation";

export type EventFingerprintInput = {
  vehicleId: string;
  eventType: EventType;
  eventDate: Date;
  mileage: number | null;
  sourceSystem: string | null;
};

export type CsvEventRowForIdempotency = {
  rowNumber: number;
  vin: string;
  eventType: EventType;
  eventDate: Date;
  mileage: number | null;
  sourceSystem: string | null;
  description: string | null;
};

export type EventIdempotencyPlan = {
  eventsToInsert: CsvEventRowForIdempotency[];
  eventsSkipped: number;
  duplicateEventsSkipped: number;
  warnings: ImportValidationIssue[];
};

type ExistingEventRecord = {
  vehicleId: string;
  eventType: EventType;
  eventDate: Date;
  mileage: number | null;
  sourceSystem: string | null;
};

/** Stable fingerprint for duplicate event detection (description excluded intentionally). */
export function buildEventFingerprint(input: EventFingerprintInput): string {
  const sourceKey = (input.sourceSystem ?? "").trim().toLowerCase();
  const mileageKey = input.mileage ?? "";
  const dateKey = input.eventDate.toISOString();
  return `${input.vehicleId}|${input.eventType}|${dateKey}|${mileageKey}|${sourceKey}`;
}

function fingerprintFromExisting(event: ExistingEventRecord): string {
  return buildEventFingerprint({
    vehicleId: event.vehicleId,
    eventType: event.eventType,
    eventDate: event.eventDate,
    mileage: event.mileage,
    sourceSystem: event.sourceSystem,
  });
}

async function loadExistingEventFingerprints(
  db: PrismaClient,
  vehicleIds: string[],
): Promise<Set<string>> {
  if (vehicleIds.length === 0) {
    return new Set();
  }

  const events = await db.vehicleEvent.findMany({
    where: { vehicleId: { in: vehicleIds } },
    select: {
      vehicleId: true,
      eventType: true,
      eventDate: true,
      mileage: true,
      sourceSystem: true,
    },
  });

  return new Set(events.map((event) => fingerprintFromExisting(event)));
}

/**
 * Classify CSV event rows into inserts vs skips using DB + in-file fingerprints.
 * `vehicleIdByVin` must include existing vehicle IDs; new VINs use `vin:${vin}` placeholder.
 */
export async function planEventIdempotency(
  rows: CsvEventRowForIdempotency[],
  vehicleIdByVin: Map<string, string>,
  db: PrismaClient,
): Promise<EventIdempotencyPlan> {
  const existingVehicleIds = [...vehicleIdByVin.values()].filter((id) => !id.startsWith("vin:"));
  const dbFingerprints = await loadExistingEventFingerprints(db, existingVehicleIds);

  const seenInUpload = new Set<string>();
  const eventsToInsert: CsvEventRowForIdempotency[] = [];
  const warnings: ImportValidationIssue[] = [];
  let eventsSkipped = 0;
  let duplicateEventsSkipped = 0;

  for (const row of rows) {
    const vehicleId = vehicleIdByVin.get(row.vin) ?? `vin:${row.vin}`;
    const fingerprint = buildEventFingerprint({
      vehicleId,
      eventType: row.eventType,
      eventDate: row.eventDate,
      mileage: row.mileage,
      sourceSystem: row.sourceSystem,
    });

    if (seenInUpload.has(fingerprint) || dbFingerprints.has(fingerprint)) {
      eventsSkipped += 1;
      duplicateEventsSkipped += 1;
      warnings.push({
        row: row.rowNumber,
        field: "event",
        message: "Duplicate event skipped",
      });
      continue;
    }

    seenInUpload.add(fingerprint);
    eventsToInsert.push(row);
  }

  return {
    eventsToInsert,
    eventsSkipped,
    duplicateEventsSkipped,
    warnings,
  };
}

/** Resolve vehicle IDs for preview/commit planning without creating vehicles. */
export async function resolveVehicleIdsByVin(
  db: PrismaClient,
  vins: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (vins.length === 0) {
    return map;
  }

  const vehicles = await db.vehicle.findMany({
    where: { vin: { in: vins } },
    select: { id: true, vin: true },
  });

  for (const vehicle of vehicles) {
    map.set(vehicle.vin, vehicle.id);
  }

  for (const vin of vins) {
    if (!map.has(vin)) {
      map.set(vin, `vin:${vin}`);
    }
  }

  return map;
}
