import { NextResponse } from "next/server";
import { lookupByVinOrPlate } from "@/lib/lookup";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Expected JSON object" }, { status: 400 });
  }

  const vinOrPlate = (body as { vinOrPlate?: unknown }).vinOrPlate;
  if (typeof vinOrPlate !== "string") {
    return NextResponse.json({ error: "Missing or invalid vinOrPlate" }, { status: 400 });
  }

  try {
    const vehicle = await lookupByVinOrPlate(vinOrPlate);
    if (!vehicle) {
      return NextResponse.json(
        { found: false, message: "No record found for that VIN or plate." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      found: true,
      vehicle: {
        id: vehicle.id,
        vin: vehicle.vin,
        plateNumber: vehicle.plateNumber,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        trim: vehicle.trim,
        engineType: vehicle.engineType,
        engineSize: vehicle.engineSize,
        fuelType: vehicle.fuelType,
        countryOfOrigin: vehicle.countryOfOrigin,
        importDate: vehicle.importDate?.toISOString() ?? null,
      },
      events: vehicle.events.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        eventDate: e.eventDate.toISOString(),
        mileage: e.mileage,
        sourceSystem: e.sourceSystem,
        rawPayload: e.rawPayload,
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
