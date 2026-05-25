import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import {
  createAdminVehiclePhoto,
  parseOptionalDate,
  parsePhotoSourceType,
  validatePhotoUrl,
} from "@/lib/admin-record-mutations";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const unauthorized = await requireAdminApi(request);
  if (unauthorized) return unauthorized;

  const { id: vehicleId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "Expected JSON object." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const url = typeof data.url === "string" ? data.url : "";
  const sourceTypeRaw = typeof data.sourceType === "string" ? data.sourceType : "";

  const urlError = validatePhotoUrl(url);
  if (urlError) {
    return NextResponse.json({ ok: false, error: urlError.message, field: urlError.field }, { status: 400 });
  }

  const sourceType = parsePhotoSourceType(sourceTypeRaw);
  if (typeof sourceType !== "string") {
    return NextResponse.json(
      { ok: false, error: sourceType.message, field: "sourceType" },
      { status: 400 },
    );
  }

  const takenAtRaw = typeof data.takenAt === "string" ? data.takenAt : "";
  const takenAt = parseOptionalDate(takenAtRaw);
  if (takenAt && typeof takenAt === "object" && "message" in takenAt) {
    return NextResponse.json({ ok: false, error: takenAt.message, field: takenAt.field }, { status: 400 });
  }

  const result = await createAdminVehiclePhoto(vehicleId, {
    url,
    caption: typeof data.caption === "string" ? data.caption : undefined,
    sourceType,
    sourceLabel: typeof data.sourceLabel === "string" ? data.sourceLabel : undefined,
    takenAt: takenAt as Date | null,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error.message, field: result.error.field },
      { status: result.error.message === "Vehicle not found." ? 404 : 400 },
    );
  }

  return NextResponse.json({ ok: true, photoId: result.photoId });
}
