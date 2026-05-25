import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import {
  createAdminVehicleEvent,
  parseEventType,
  parseOptionalMileage,
  parseRequiredDate,
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
  const eventTypeRaw = typeof data.eventType === "string" ? data.eventType : "";
  const eventDateRaw = typeof data.eventDate === "string" ? data.eventDate : "";
  const sourceSystem = typeof data.sourceSystem === "string" ? data.sourceSystem : "";
  const mileageRaw = typeof data.mileage === "string" ? data.mileage : typeof data.mileage === "number" ? String(data.mileage) : "";

  const eventType = parseEventType(eventTypeRaw);
  if (typeof eventType !== "string") {
    return NextResponse.json(
      { ok: false, error: eventType.message, field: "eventType" },
      { status: 400 },
    );
  }

  const eventDate = parseRequiredDate(eventDateRaw, "eventDate");
  if (typeof eventDate === "object" && "message" in eventDate) {
    return NextResponse.json(
      { ok: false, error: eventDate.message, field: eventDate.field },
      { status: 400 },
    );
  }

  const mileage = parseOptionalMileage(mileageRaw);
  if (mileage && typeof mileage === "object" && "message" in mileage) {
    return NextResponse.json({ ok: false, error: mileage.message, field: mileage.field }, { status: 400 });
  }

  const result = await createAdminVehicleEvent(vehicleId, {
    eventType,
    eventDate: eventDate as Date,
    mileage: mileage as number | null,
    sourceSystem,
    description: typeof data.description === "string" ? data.description : undefined,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error.message, field: result.error.field },
      { status: result.error.message === "Vehicle not found." ? 404 : 400 },
    );
  }

  return NextResponse.json({ ok: true, eventId: result.eventId });
}
