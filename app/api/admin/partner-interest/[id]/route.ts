import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import {
  getPartnerInterestById,
  parsePartnerInterestPipelineBody,
  updatePartnerInterestPipeline,
} from "@/lib/partner-interest-pipeline";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const unauthorized = await requireAdminApi(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const existing = await getPartnerInterestById(id);
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Partner interest not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parsePartnerInterestPipelineBody(body);
  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, error: parsed.error, field: parsed.field },
      { status: 400 },
    );
  }

  const updated = await updatePartnerInterestPipeline(id, parsed.data);
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Could not update partner interest." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
