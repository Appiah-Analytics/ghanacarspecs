import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { getAdminIdentifierFromRequest } from "@/lib/audit-log";
import { ingestVehicleEventsCsv } from "@/lib/csv-ingest";
import { loggerForRequest } from "@/lib/logger";

type UploadedCsvFile = {
  name: string;
  type?: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
  text?: () => Promise<string>;
};

function getUploadedFile(value: FormDataEntryValue | null): UploadedCsvFile | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as UploadedCsvFile;
  if (typeof candidate.arrayBuffer !== "function" || typeof candidate.name !== "string") {
    return null;
  }

  return candidate;
}

async function readUploadedFileText(file: UploadedCsvFile): Promise<string> {
  if (typeof file.text === "function") {
    return file.text();
  }

  const buffer = await file.arrayBuffer();
  return new TextDecoder().decode(buffer);
}

export async function POST(request: Request) {
  const requestLogger = loggerForRequest(request, { route: "/api/admin/ingest" });
  const cookieStore = await cookies();
  if (!(await verifyAdminRequest(request, cookieStore))) {
    requestLogger.warn("csv ingest unauthorized");
    return NextResponse.json(
      { ok: false, errors: [{ row: 1, message: "Unauthorized. Sign in at /admin/login or send Authorization: Bearer <secret>." }] },
      { status: 401 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    requestLogger.warn("csv ingest rejected invalid multipart body");
    return NextResponse.json({ ok: false, errors: [{ row: 1, message: "Expected multipart form data." }] }, { status: 400 });
  }

  const file = getUploadedFile(formData.get("file"));
  if (!file) {
    requestLogger.warn("csv ingest missing file");
    return NextResponse.json({ ok: false, errors: [{ row: 1, message: "CSV file is required." }] }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    requestLogger.warn("csv ingest rejected non-csv file", { filename: file.name });
    return NextResponse.json({ ok: false, errors: [{ row: 1, message: "Uploaded file must be a .csv file." }] }, { status: 400 });
  }

  const text = await readUploadedFileText(file);
  const adminIdentifier = getAdminIdentifierFromRequest(request);
  const result = await ingestVehicleEventsCsv(text, adminIdentifier);
  requestLogger.info("csv ingest completed", {
    ok: result.ok,
    rowsProcessed: "rowsProcessed" in result ? result.rowsProcessed : undefined,
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
