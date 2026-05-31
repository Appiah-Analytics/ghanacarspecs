import {
  ConfidenceLevel,
  EvidenceStatus,
  EventType,
  PhotoSourceType,
  ProvenanceType,
  type Prisma,
} from "@prisma/client";
import { pickEventAuditSnapshot, pickPhotoAuditSnapshot, writeAuditLog } from "@/lib/audit-log";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { createVehicleEventRecord } from "@/lib/vehicle-event-write";

export type AdminMutationError = { field?: string; message: string };

const ALLOWED_PHOTO_URL_PREFIXES = ["/demo-photos/", "http://", "https://"] as const;

export function validatePhotoUrl(url: string): AdminMutationError | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return { field: "url", message: "URL is required." };
  }
  const ok = ALLOWED_PHOTO_URL_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
  if (!ok) {
    return {
      field: "url",
      message: "URL must start with /demo-photos/, http://, or https://.",
    };
  }
  return null;
}

export function parsePhotoSourceType(value: string): PhotoSourceType | AdminMutationError {
  if (Object.values(PhotoSourceType).includes(value as PhotoSourceType)) {
    return value as PhotoSourceType;
  }
  return { message: "Invalid source type." };
}

export function parseEventType(value: string): EventType | AdminMutationError {
  if (Object.values(EventType).includes(value as EventType)) {
    return value as EventType;
  }
  return { message: "Invalid event type." };
}

export function parseConfidenceLevel(value: string): ConfidenceLevel | AdminMutationError {
  if (Object.values(ConfidenceLevel).includes(value as ConfidenceLevel)) {
    return value as ConfidenceLevel;
  }
  return { message: "Invalid confidence level." };
}

export function parseProvenanceType(value: string): ProvenanceType | AdminMutationError {
  if (Object.values(ProvenanceType).includes(value as ProvenanceType)) {
    return value as ProvenanceType;
  }
  return { message: "Invalid provenance type." };
}

export function parseEvidenceStatus(value: string): EvidenceStatus | AdminMutationError {
  if (Object.values(EvidenceStatus).includes(value as EvidenceStatus)) {
    return value as EvidenceStatus;
  }
  return { message: "Invalid evidence status." };
}

export function parseOptionalDate(value: string): Date | null | AdminMutationError {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return { field: "takenAt", message: "Invalid date." };
  }
  return date;
}

export function parseRequiredDate(value: string, field: string): Date | AdminMutationError {
  const trimmed = value.trim();
  if (!trimmed) {
    return { field, message: "Date is required." };
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return { field, message: "Invalid date." };
  }
  return date;
}

export function parseOptionalMileage(value: string): number | null | AdminMutationError {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const mileage = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(mileage) || mileage < 0) {
    return { field: "mileage", message: "Mileage must be a whole number ≥ 0." };
  }
  return mileage;
}

export type CreatePhotoInput = {
  url: string;
  caption?: string;
  sourceType: PhotoSourceType;
  sourceLabel?: string;
  takenAt?: Date | null;
  confidenceLevel: ConfidenceLevel;
  provenanceType: ProvenanceType;
  status?: EvidenceStatus;
  adminIdentifier?: string;
};

export async function createAdminVehiclePhoto(
  vehicleId: string,
  input: CreatePhotoInput,
): Promise<{ ok: true; photoId: string } | { ok: false; error: AdminMutationError }> {
  logger.debug("create admin vehicle photo invoked", { vehicleId });
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { id: true } });
  if (!vehicle) {
    logger.warn("create admin vehicle photo vehicle not found", { vehicleId });
    return { ok: false, error: { message: "Vehicle not found." } };
  }

  const urlError = validatePhotoUrl(input.url);
  if (urlError) return { ok: false, error: urlError };

  const photo = await prisma.vehiclePhoto.create({
    data: {
      vehicleId,
      url: input.url.trim(),
      caption: input.caption?.trim() || "Visual evidence (admin entry)",
      sourceType: input.sourceType,
      sourceLabel: input.sourceLabel?.trim() || null,
      takenAt: input.takenAt ?? null,
      confidenceLevel: input.confidenceLevel,
      provenanceType: input.provenanceType,
      status: input.status ?? EvidenceStatus.PUBLISHED,
    },
  });

  writeAuditLog({
    adminIdentifier: input.adminIdentifier ?? "admin:unknown",
    entityType: "vehicle_photo",
    entityId: photo.id,
    action: "create",
    after: pickPhotoAuditSnapshot(photo),
  });

  logger.info("create admin vehicle photo succeeded", { vehicleId, photoId: photo.id });
  return { ok: true, photoId: photo.id };
}

export type CreateEventInput = {
  eventType: EventType;
  eventDate: Date;
  mileage?: number | null;
  sourceSystem: string;
  description?: string;
  confidenceLevel: ConfidenceLevel;
  provenanceType: ProvenanceType;
  status?: EvidenceStatus;
  adminIdentifier?: string;
};

export async function createAdminVehicleEvent(
  vehicleId: string,
  input: CreateEventInput,
): Promise<{ ok: true; eventId: string } | { ok: false; error: AdminMutationError }> {
  logger.debug("create admin vehicle event invoked", { vehicleId });
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { id: true } });
  if (!vehicle) {
    logger.warn("create admin vehicle event vehicle not found", { vehicleId });
    return { ok: false, error: { message: "Vehicle not found." } };
  }

  const sourceSystem = input.sourceSystem.trim();
  if (!sourceSystem) {
    logger.warn("create admin vehicle event rejected blank sourceSystem", { vehicleId });
    return { ok: false, error: { field: "sourceSystem", message: "Source system is required." } };
  }

  const event = await createVehicleEventRecord(prisma, {
    vehicleId,
    eventType: input.eventType,
    eventDate: input.eventDate,
    mileage: input.mileage ?? null,
    sourceSystem,
    description: input.description,
    confidenceLevel: input.confidenceLevel,
    provenanceType: input.provenanceType,
    status: input.status ?? EvidenceStatus.PUBLISHED,
    importedFrom: "admin",
    adminIdentifier: input.adminIdentifier ?? "admin:unknown",
  });

  logger.info("create admin vehicle event succeeded", { vehicleId, eventId: event.id });
  return { ok: true, eventId: event.id };
}

export type UpdatePhotoInput = {
  caption: string;
  sourceLabel?: string;
  takenAt?: Date | null;
  confidenceLevel: ConfidenceLevel;
  provenanceType: ProvenanceType;
  status: EvidenceStatus;
  adminIdentifier: string;
};

export async function updateAdminVehiclePhoto(
  vehicleId: string,
  photoId: string,
  input: UpdatePhotoInput,
): Promise<{ ok: true } | { ok: false; error: AdminMutationError }> {
  const before = await prisma.vehiclePhoto.findFirst({
    where: { id: photoId, vehicleId },
  });
  if (!before) return { ok: false, error: { message: "Photo not found." } };

  const updated = await prisma.vehiclePhoto.update({
    where: { id: photoId },
    data: {
      caption: input.caption.trim() || before.caption,
      sourceLabel: input.sourceLabel?.trim() || null,
      takenAt: input.takenAt ?? null,
      confidenceLevel: input.confidenceLevel,
      provenanceType: input.provenanceType,
      status: input.status,
    },
  });

  writeAuditLog({
    adminIdentifier: input.adminIdentifier,
    entityType: "vehicle_photo",
    entityId: updated.id,
    action: before.status === updated.status ? "edit" : "status_change",
    before: pickPhotoAuditSnapshot(before),
    after: pickPhotoAuditSnapshot(updated),
  });
  return { ok: true };
}

export async function archiveAdminVehiclePhoto(
  vehicleId: string,
  photoId: string,
  adminIdentifier: string,
): Promise<{ ok: true } | { ok: false; error: AdminMutationError }> {
  const before = await prisma.vehiclePhoto.findFirst({
    where: { id: photoId, vehicleId },
  });
  if (!before) return { ok: false, error: { message: "Photo not found." } };

  const updated = await prisma.vehiclePhoto.update({
    where: { id: photoId },
    data: {
      status: EvidenceStatus.ARCHIVED,
      deletedAt: new Date(),
      deletedBy: adminIdentifier,
    },
  });

  writeAuditLog({
    adminIdentifier,
    entityType: "vehicle_photo",
    entityId: updated.id,
    action: "archive",
    before: pickPhotoAuditSnapshot(before),
    after: pickPhotoAuditSnapshot(updated),
  });
  return { ok: true };
}

export type UpdateEventInput = {
  eventType: EventType;
  eventDate: Date;
  mileage?: number | null;
  sourceSystem: string;
  description?: string;
  confidenceLevel: ConfidenceLevel;
  provenanceType: ProvenanceType;
  status: EvidenceStatus;
  adminIdentifier: string;
};

export async function updateAdminVehicleEvent(
  vehicleId: string,
  eventId: string,
  input: UpdateEventInput,
): Promise<{ ok: true } | { ok: false; error: AdminMutationError }> {
  const before = await prisma.vehicleEvent.findFirst({
    where: { id: eventId, vehicleId },
  });
  if (!before) return { ok: false, error: { message: "Event not found." } };

  const sourceSystem = input.sourceSystem.trim();
  if (!sourceSystem) {
    return { ok: false, error: { field: "sourceSystem", message: "Source system is required." } };
  }

  const rawPayload: Prisma.InputJsonValue = {
    addedFrom: "admin",
    ...(input.description?.trim() ? { description: input.description.trim() } : {}),
  };

  const updated = await prisma.vehicleEvent.update({
    where: { id: eventId },
    data: {
      eventType: input.eventType,
      eventDate: input.eventDate,
      mileage: input.mileage ?? null,
      sourceSystem,
      rawPayload,
      confidenceLevel: input.confidenceLevel,
      provenanceType: input.provenanceType,
      status: input.status,
    },
  });

  writeAuditLog({
    adminIdentifier: input.adminIdentifier,
    entityType: "vehicle_event",
    entityId: updated.id,
    action: before.status === updated.status ? "edit" : "status_change",
    before: pickEventAuditSnapshot(before),
    after: pickEventAuditSnapshot(updated),
  });
  return { ok: true };
}

export async function archiveAdminVehicleEvent(
  vehicleId: string,
  eventId: string,
  adminIdentifier: string,
): Promise<{ ok: true } | { ok: false; error: AdminMutationError }> {
  const before = await prisma.vehicleEvent.findFirst({
    where: { id: eventId, vehicleId },
  });
  if (!before) return { ok: false, error: { message: "Event not found." } };

  const updated = await prisma.vehicleEvent.update({
    where: { id: eventId },
    data: {
      status: EvidenceStatus.ARCHIVED,
      deletedAt: new Date(),
      deletedBy: adminIdentifier,
    },
  });

  writeAuditLog({
    adminIdentifier,
    entityType: "vehicle_event",
    entityId: updated.id,
    action: "archive",
    before: pickEventAuditSnapshot(before),
    after: pickEventAuditSnapshot(updated),
  });
  return { ok: true };
}
