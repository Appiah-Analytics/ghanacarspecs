import type { EvidenceStatus } from "@prisma/client";
import { logger } from "@/lib/logger";

type EntityType = "vehicle_photo" | "vehicle_event";
type ActionType = "create" | "edit" | "archive" | "status_change";

type Snapshot = Record<string, unknown>;

export type AuditEntry = {
  timestamp: string;
  adminIdentifier: string;
  entityType: EntityType;
  entityId: string;
  action: ActionType;
  before?: Snapshot;
  after?: Snapshot;
};

function redact(snapshot: Snapshot | undefined): Snapshot | undefined {
  if (!snapshot) return undefined;
  return Object.fromEntries(
    Object.entries(snapshot).map(([key, value]) => {
      if (/(token|password|secret|authorization|cookie)/i.test(key)) return [key, "[REDACTED]"];
      return [key, value];
    }),
  );
}

export function getAdminIdentifierFromRequest(request: Request): string {
  const explicit = request.headers.get("x-admin-actor")?.trim();
  if (explicit) return explicit;
  if (request.headers.get("authorization")) return "admin:bearer";
  if (request.headers.get("x-admin-key")) return "admin:x-admin-key";
  return "admin:session";
}

export function writeAuditLog(entry: Omit<AuditEntry, "timestamp">): void {
  const payload: AuditEntry = {
    timestamp: new Date().toISOString(),
    ...entry,
    before: redact(entry.before),
    after: redact(entry.after),
  };
  logger.info("audit_log", { audit: payload });
}

export function pickPhotoAuditSnapshot(photo: {
  status: EvidenceStatus;
  caption: string;
  sourceLabel: string | null;
  confidenceLevel: string;
  provenanceType: string;
  takenAt: Date | null;
  deletedAt: Date | null;
  deletedBy: string | null;
}): Snapshot {
  return {
    status: photo.status,
    caption: photo.caption,
    sourceLabel: photo.sourceLabel,
    confidenceLevel: photo.confidenceLevel,
    provenanceType: photo.provenanceType,
    takenAt: photo.takenAt?.toISOString() ?? null,
    deletedAt: photo.deletedAt?.toISOString() ?? null,
    deletedBy: photo.deletedBy,
  };
}

export function pickEventAuditSnapshot(event: {
  status: EvidenceStatus;
  eventType: string;
  eventDate: Date;
  mileage: number | null;
  sourceSystem: string | null;
  rawPayload: unknown;
  confidenceLevel: string;
  provenanceType: string;
  deletedAt: Date | null;
  deletedBy: string | null;
}): Snapshot {
  return {
    status: event.status,
    eventType: event.eventType,
    eventDate: event.eventDate.toISOString(),
    mileage: event.mileage,
    sourceSystem: event.sourceSystem,
    description:
      event.rawPayload && typeof event.rawPayload === "object" && "description" in (event.rawPayload as Record<string, unknown>)
        ? (event.rawPayload as Record<string, unknown>).description
        : null,
    confidenceLevel: event.confidenceLevel,
    provenanceType: event.provenanceType,
    deletedAt: event.deletedAt?.toISOString() ?? null,
    deletedBy: event.deletedBy,
  };
}
