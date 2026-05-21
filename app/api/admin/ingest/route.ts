import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { ingestVehicleEventsCsv } from "@/lib/csv-ingest";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!(await verifyAdminRequest(request, cookieStore))) {
    return NextResponse.json(
      { ok: false, errors: [{ row: 1, message: "Unauthorized. Sign in at /admin/login or send Authorization: Bearer <secret>." }] },
      { status: 401 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, errors: [{ row: 1, message: "Expected multipart form data." }] }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, errors: [{ row: 1, message: "CSV file is required." }] }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    return NextResponse.json({ ok: false, errors: [{ row: 1, message: "Uploaded file must be a .csv file." }] }, { status: 400 });
  }

  const text = await file.text();
  const result = await ingestVehicleEventsCsv(text);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
