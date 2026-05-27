import { NextResponse } from "next/server";
import { resolveLookupWithExternalVin } from "@/lib/lookup";
import {
  getExternalDecodeFailedMessage,
  getLocalNotFoundMessage,
  getLookupUnavailableMessage,
} from "@/lib/lookup-messages";
import { loggerForRequest } from "@/lib/logger";
import { RECORD_SOURCE_LABEL } from "@/lib/record-source";
import { analyzeVehicleIntelligence } from "@/lib/vehicle-intelligence";

export async function POST(request: Request) {
  const requestLogger = loggerForRequest(request, { route: "/api/v1/lookup" });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    requestLogger.warn("lookup rejected invalid json body");
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    requestLogger.warn("lookup rejected non-object payload");
    return NextResponse.json({ error: "Expected JSON object" }, { status: 400 });
  }

  const vinOrPlate = (body as { vinOrPlate?: unknown }).vinOrPlate;
  if (typeof vinOrPlate !== "string") {
    requestLogger.warn("lookup rejected missing vinOrPlate");
    return NextResponse.json({ error: "Missing or invalid vinOrPlate" }, { status: 400 });
  }

  try {
    const resolved = await resolveLookupWithExternalVin(vinOrPlate);

    if (resolved.result === "not_found") {
      requestLogger.info("lookup not found", { vinOrPlate });
      const notFound = getLocalNotFoundMessage(vinOrPlate);
      return NextResponse.json(
        { found: false, title: notFound.title, message: notFound.message },
        { status: 404 },
      );
    }

    if (resolved.result === "external_failed") {
      requestLogger.warn("lookup external decode failed", { detail: resolved.reason, vinOrPlate });
      const failed = getExternalDecodeFailedMessage(resolved.reason);
      return NextResponse.json(
        {
          found: false,
          title: failed.title,
          message: failed.message,
          detail: resolved.reason,
        },
        { status: 502 },
      );
    }

    if (resolved.result === "local") {
      requestLogger.info("lookup resolved local record", { vehicleId: resolved.vehicle.id });
      const vehicle = resolved.vehicle;
      return NextResponse.json({
        found: true,
        recordSource: "local",
        recordSourceLabel: RECORD_SOURCE_LABEL.local,
        vehicle: {
          id: vehicle.id,
          vin: vehicle.vin,
          chassisNumber: vehicle.chassisNumber,
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
        intelligence: analyzeVehicleIntelligence({
          year: vehicle.year,
          countryOfOrigin: vehicle.countryOfOrigin,
          importDate: vehicle.importDate,
          events: vehicle.events,
        }),
      });
    }

    requestLogger.info("lookup resolved external record", { provider: resolved.provider, vin: resolved.vin });
    return NextResponse.json({
      found: true,
      recordSource: "external",
      recordSourceLabel: RECORD_SOURCE_LABEL.external,
      dataProvider: resolved.provider,
      vin: resolved.vin,
      decoded: resolved.specs,
      events: [],
    });
  } catch (e) {
    requestLogger.error("lookup failed unexpectedly", {
      error: e instanceof Error ? e.message : "unknown error",
    });
    const unavailable = getLookupUnavailableMessage();
    return NextResponse.json(
      {
        found: false,
        error: unavailable.title,
        title: unavailable.title,
        message: unavailable.message,
      },
      { status: 500 },
    );
  }
}
