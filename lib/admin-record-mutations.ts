import { EventType, PhotoSourceType, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
};

export async function createAdminVehiclePhoto(
  vehicleId: string,
  input: CreatePhotoInput,
): Promise<{ ok: true; photoId: string } | { ok: false; error: AdminMutationError }> {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { id: true } });
  if (!vehicle) {
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
    },
  });

  return { ok: true, photoId: photo.id };
}

export type CreateEventInput = {
  eventType: EventType;
  eventDate: Date;
  mileage?: number | null;
  sourceSystem: string;
  description?: string;
};

export async function createAdminVehicleEvent(
  vehicleId: string,
  input: CreateEventInput,
): Promise<{ ok: true; eventId: string } | { ok: false; error: AdminMutationError }> {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId }, select: { id: true } });
  if (!vehicle) {
    return { ok: false, error: { message: "Vehicle not found." } };
  }

  const sourceSystem = input.sourceSystem.trim();
  if (!sourceSystem) {
    return { ok: false, error: { field: "sourceSystem", message: "Source system is required." } };
  }

  const rawPayload: Prisma.InputJsonValue = {
    addedFrom: "admin",
    ...(input.description?.trim() ? { description: input.description.trim() } : {}),
  };

  const event = await prisma.vehicleEvent.create({
    data: {
      vehicleId,
      eventType: input.eventType,
      eventDate: input.eventDate,
      mileage: input.mileage ?? null,
      sourceSystem,
      rawPayload,
    },
  });

  return { ok: true, eventId: event.id };
}
