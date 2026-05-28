import { NextResponse } from "next/server";
import { getAdminIdentifierFromRequest } from "@/lib/audit-log";
import { requireAdminApi } from "@/lib/admin-api";
import {
  archiveAdminVehicleEvent,
  parseConfidenceLevel,
  parseEvidenceStatus,
  parseEventType,
  parseOptionalMileage,
  parseProvenanceType,
  parseRequiredDate,
  updateAdminVehicleEvent,
} from "@/lib/admin-record-mutations";

type RouteContext = { params: Promise<{ id: string; eventId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const unauthorized = await requireAdminApi(request);
  if (unauthorized) return unauthorized;
  const { id: vehicleId, eventId } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });

  const eventType = parseEventType(typeof body.eventType === "string" ? body.eventType : "");
  if (typeof eventType !== "string") {
    return NextResponse.json({ ok: false, error: eventType.message, field: "eventType" }, { status: 400 });
  }
  const eventDate = parseRequiredDate(typeof body.eventDate === "string" ? body.eventDate : "", "eventDate");
  if (typeof eventDate === "object" && "message" in eventDate) {
    return NextResponse.json({ ok: false, error: eventDate.message, field: eventDate.field }, { status: 400 });
  }
  const mileage = parseOptionalMileage(typeof body.mileage === "string" ? body.mileage : "");
  if (mileage && typeof mileage === "object" && "message" in mileage) {
    return NextResponse.json({ ok: false, error: mileage.message, field: mileage.field }, { status: 400 });
  }
  const confidenceLevel = parseConfidenceLevel(typeof body.confidenceLevel === "string" ? body.confidenceLevel : "");
  if (typeof confidenceLevel !== "string") {
    return NextResponse.json({ ok: false, error: confidenceLevel.message, field: "confidenceLevel" }, { status: 400 });
  }
  const provenanceType = parseProvenanceType(typeof body.provenanceType === "string" ? body.provenanceType : "");
  if (typeof provenanceType !== "string") {
    return NextResponse.json({ ok: false, error: provenanceType.message, field: "provenanceType" }, { status: 400 });
  }
  const status = parseEvidenceStatus(typeof body.status === "string" ? body.status : "");
  if (typeof status !== "string") {
    return NextResponse.json({ ok: false, error: status.message, field: "status" }, { status: 400 });
  }

  const result = await updateAdminVehicleEvent(vehicleId, eventId, {
    eventType,
    eventDate: eventDate as Date,
    mileage: mileage as number | null,
    sourceSystem: typeof body.sourceSystem === "string" ? body.sourceSystem : "",
    description: typeof body.description === "string" ? body.description : "",
    confidenceLevel,
    provenanceType,
    status,
    adminIdentifier: getAdminIdentifierFromRequest(request),
  });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error.message, field: result.error.field }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, context: RouteContext) {
  const unauthorized = await requireAdminApi(request);
  if (unauthorized) return unauthorized;
  const { id: vehicleId, eventId } = await context.params;
  const result = await archiveAdminVehicleEvent(vehicleId, eventId, getAdminIdentifierFromRequest(request));
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
