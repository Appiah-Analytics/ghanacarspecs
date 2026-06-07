import { NextResponse } from "next/server";
import { generateVehicleReportPdf, vehicleReportPdfFilename } from "@/lib/generate-vehicle-report-pdf";
import { getVehicleForReport } from "@/lib/vehicle-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const vehicle = await getVehicleForReport(id);

  if (!vehicle) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }

  try {
    const pdf = await generateVehicleReportPdf(vehicle);
    const filename = vehicleReportPdfFilename(vehicle.vin);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[vehicle-pdf-export]", {
      vehicleId: id,
      error: error instanceof Error ? error.message : "unknown error",
    });
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
