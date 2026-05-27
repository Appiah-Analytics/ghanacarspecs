import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import {
  createAdminVehicleEvent,
  parseConfidenceLevel,
  parseEventType,
  parseOptionalMileage,
  parseProvenanceType,
  parseRequiredDate,
} from "@/lib/admin-record-mutations";
import { loggerForRequest } from "@/lib/logger";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const requestLogger = loggerForRequest(request, { route: "/api/admin/vehicles/[id]/events" });
  const unauthorized = await requireAdminApi(request);
  if (unauthorized) return unauthorized;

  const { id: vehicleId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    requestLogger.warn("event mutation rejected invalid json body");
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    requestLogger.warn("event mutation rejected non-object payload", { vehicleId });
    return NextResponse.json({ ok: false, error: "Expected JSON object." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const eventTypeRaw = typeof data.eventType === "string" ? data.eventType : "";
  const eventDateRaw = typeof data.eventDate === "string" ? data.eventDate : "";
  const sourceSystem = typeof data.sourceSystem === "string" ? data.sourceSystem : "";
  const mileageRaw = typeof data.mileage === "string" ? data.mileage : typeof data.mileage === "number" ? String(data.mileage) : "";

  const eventType = parseEventType(eventTypeRaw);
  if (typeof eventType !== "string") {
    requestLogger.warn("event mutation rejected invalid eventType", { vehicleId });
    return NextResponse.json(
      { ok: false, error: eventType.message, field: "eventType" },
      { status: 400 },
    );
  }

  const eventDate = parseRequiredDate(eventDateRaw, "eventDate");
  if (typeof eventDate === "object" && "message" in eventDate) {
    requestLogger.warn("event mutation rejected invalid eventDate", { vehicleId });
    return NextResponse.json(
      { ok: false, error: eventDate.message, field: eventDate.field },
      { status: 400 },
    );
  }

  const mileage = parseOptionalMileage(mileageRaw);
  if (mileage && typeof mileage === "object" && "message" in mileage) {
    requestLogger.warn("event mutation rejected invalid mileage", { vehicleId });
    return NextResponse.json({ ok: false, error: mileage.message, field: mileage.field }, { status: 400 });
  }

  const confidenceRaw = typeof data.confidenceLevel === "string" ? data.confidenceLevel : "";
  const confidenceLevel = parseConfidenceLevel(confidenceRaw);
  if (typeof confidenceLevel !== "string") {
    requestLogger.warn("event mutation rejected invalid confidenceLevel", { vehicleId });
    return NextResponse.json(
      { ok: false, error: confidenceLevel.message, field: "confidenceLevel" },
      { status: 400 },
    );
  }

  const provenanceRaw = typeof data.provenanceType === "string" ? data.provenanceType : "";
  const provenanceType = parseProvenanceType(provenanceRaw);
  if (typeof provenanceType !== "string") {
    requestLogger.warn("event mutation rejected invalid provenanceType", { vehicleId });
    return NextResponse.json(
      { ok: false, error: provenanceType.message, field: "provenanceType" },
      { status: 400 },
    );
  }

  const result = await createAdminVehicleEvent(vehicleId, {
    eventType,
    eventDate: eventDate as Date,
    mileage: mileage as number | null,
    sourceSystem,
    description: typeof data.description === "string" ? data.description : undefined,
    confidenceLevel,
    provenanceType,
  });

  if (!result.ok) {
    requestLogger.warn("event mutation failed", { vehicleId, error: result.error.message });
    return NextResponse.json(
      { ok: false, error: result.error.message, field: result.error.field },
      { status: result.error.message === "Vehicle not found." ? 404 : 400 },
    );
  }

  requestLogger.info("event mutation succeeded", { vehicleId, eventId: result.eventId });
  return NextResponse.json({ ok: true, eventId: result.eventId });
}
