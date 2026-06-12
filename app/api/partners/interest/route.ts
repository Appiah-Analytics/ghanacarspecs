import { NextResponse } from "next/server";
import { loggerForRequest } from "@/lib/logger";
import { createPartnerInterest, parsePartnerInterestBody } from "@/lib/partner-interest";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestLogger = loggerForRequest(request, { route: "/api/partners/interest" });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    requestLogger.warn("partner interest rejected invalid json");
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parsePartnerInterestBody(body);
  if (!parsed.ok) {
    requestLogger.warn("partner interest validation failed", { error: parsed.error });
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  try {
    const record = await createPartnerInterest(parsed.data);
    requestLogger.info("partner interest submitted", {
      id: record.id,
      partnerType: record.partnerType,
      city: record.city,
    });
    return NextResponse.json({ ok: true, id: record.id });
  } catch (error) {
    requestLogger.error("partner interest create failed", {
      error: error instanceof Error ? error.message : "unknown error",
    });
    return NextResponse.json({ ok: false, error: "Could not save your interest. Try again later." }, { status: 500 });
  }
}
