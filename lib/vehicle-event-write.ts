import "server-only";

import {
  ConfidenceLevel,
  EvidenceStatus,
  EventType,
  ProvenanceType,
  type Prisma,
  type VehicleEvent,
} from "@prisma/client";
import { pickEventAuditSnapshot, writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";

export type VehicleEventWriteSource = "admin" | "csv";

type DbClient = Prisma.TransactionClient | typeof prisma;

export type CreateVehicleEventRecordInput = {
  vehicleId: string;
  eventType: EventType;
  eventDate: Date;
  mileage?: number | null;
  sourceSystem: string | null;
  description?: string | null;
  confidenceLevel?: ConfidenceLevel;
  provenanceType?: ProvenanceType;
  status?: EvidenceStatus;
  importedFrom: VehicleEventWriteSource;
  adminIdentifier: string;
};

function buildEventRawPayload(
  importedFrom: VehicleEventWriteSource,
  description?: string | null,
): Prisma.InputJsonValue {
  const trimmedDescription = description?.trim();

  if (importedFrom === "admin") {
    return {
      addedFrom: "admin",
      importedFrom: "admin",
      ...(trimmedDescription ? { description: trimmedDescription } : {}),
    };
  }

  return trimmedDescription
    ? { importedFrom: "csv", description: trimmedDescription }
    : { importedFrom: "csv" };
}

export async function createVehicleEventRecord(
  db: DbClient,
  input: CreateVehicleEventRecordInput,
): Promise<VehicleEvent> {
  const event = await db.vehicleEvent.create({
    data: {
      vehicleId: input.vehicleId,
      eventType: input.eventType,
      eventDate: input.eventDate,
      mileage: input.mileage ?? null,
      sourceSystem: input.sourceSystem,
      rawPayload: buildEventRawPayload(input.importedFrom, input.description),
      confidenceLevel: input.confidenceLevel ?? ConfidenceLevel.LOW,
      provenanceType: input.provenanceType ?? ProvenanceType.OTHER,
      status: input.status ?? EvidenceStatus.PUBLISHED,
    },
  });

  writeAuditLog({
    adminIdentifier: input.adminIdentifier,
    entityType: "vehicle_event",
    entityId: event.id,
    action: "create",
    after: pickEventAuditSnapshot(event),
  });

  return event;
}
