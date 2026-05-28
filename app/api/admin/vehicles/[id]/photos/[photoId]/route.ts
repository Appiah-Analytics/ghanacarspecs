import { NextResponse } from "next/server";
import { getAdminIdentifierFromRequest } from "@/lib/audit-log";
import { requireAdminApi } from "@/lib/admin-api";
import {
  archiveAdminVehiclePhoto,
  parseConfidenceLevel,
  parseEvidenceStatus,
  parseOptionalDate,
  parseProvenanceType,
  updateAdminVehiclePhoto,
} from "@/lib/admin-record-mutations";

type RouteContext = { params: Promise<{ id: string; photoId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const unauthorized = await requireAdminApi(request);
  if (unauthorized) return unauthorized;

  const { id: vehicleId, photoId } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });

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
  const takenAt = parseOptionalDate(typeof body.takenAt === "string" ? body.takenAt : "");
  if (takenAt && typeof takenAt === "object" && "message" in takenAt) {
    return NextResponse.json({ ok: false, error: takenAt.message, field: takenAt.field }, { status: 400 });
  }

  const result = await updateAdminVehiclePhoto(vehicleId, photoId, {
    caption: typeof body.caption === "string" ? body.caption : "",
    sourceLabel: typeof body.sourceLabel === "string" ? body.sourceLabel : "",
    takenAt: takenAt as Date | null,
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
  const { id: vehicleId, photoId } = await context.params;
  const result = await archiveAdminVehiclePhoto(vehicleId, photoId, getAdminIdentifierFromRequest(request));
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
