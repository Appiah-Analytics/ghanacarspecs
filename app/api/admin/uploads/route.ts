import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import {
  buildEvidenceBlobPath,
  sanitizeUploadFilename,
  validateImageUpload,
} from "@/lib/admin-upload";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi(request);
  if (unauthorized) return unauthorized;

  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Blob storage is not configured. Set BLOB_READ_WRITE_TOKEN (see docs/vercel_blob_setup.md).",
      },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Expected multipart form data." }, { status: 400 });
  }

  const vehicleIdRaw = formData.get("vehicleId");
  const vehicleId = typeof vehicleIdRaw === "string" ? vehicleIdRaw.trim() : "";
  if (!vehicleId) {
    return NextResponse.json({ ok: false, error: "vehicleId is required." }, { status: 400 });
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true },
  });
  if (!vehicle) {
    return NextResponse.json({ ok: false, error: "Vehicle not found." }, { status: 404 });
  }

  const fileField = formData.get("file");
  if (!(fileField instanceof File)) {
    return NextResponse.json({ ok: false, error: "Image file is required." }, { status: 400 });
  }

  const validation = validateImageUpload(fileField);
  if (!validation.ok) {
    return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
  }

  const filename = sanitizeUploadFilename(fileField.name);
  const pathname = buildEvidenceBlobPath(vehicleId, filename);

  try {
    const blob = await put(pathname, fileField, {
      access: "public",
      contentType: fileField.type,
      addRandomSuffix: false,
    });

    return NextResponse.json({ ok: true, url: blob.url, pathname: blob.pathname });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
