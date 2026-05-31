import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import {
  buildEvidenceBlobPath,
  getUploadedImageFile,
  sanitizeUploadFilename,
  validateImageUpload,
} from "@/lib/admin-upload";
import { env } from "@/lib/env";
import { loggerForRequest } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestLogger = loggerForRequest(request, { route: "/api/admin/uploads" });
  const unauthorized = await requireAdminApi(request);
  if (unauthorized) return unauthorized;

  if (!env.BLOB_READ_WRITE_TOKEN) {
    requestLogger.warn("upload attempted without blob token");
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
    requestLogger.warn("upload rejected invalid multipart body");
    return NextResponse.json({ ok: false, error: "Expected multipart form data." }, { status: 400 });
  }

  const vehicleIdRaw = formData.get("vehicleId");
  const vehicleId = typeof vehicleIdRaw === "string" ? vehicleIdRaw.trim() : "";
  if (!vehicleId) {
    requestLogger.warn("upload rejected missing vehicleId");
    return NextResponse.json({ ok: false, error: "vehicleId is required." }, { status: 400 });
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true },
  });
  if (!vehicle) {
    requestLogger.warn("upload rejected unknown vehicle", { vehicleId });
    return NextResponse.json({ ok: false, error: "Vehicle not found." }, { status: 404 });
  }

  const fileField = getUploadedImageFile(formData.get("file"));
  if (!fileField) {
    requestLogger.warn("upload rejected missing file");
    return NextResponse.json({ ok: false, error: "Image file is required." }, { status: 400 });
  }

  const validation = validateImageUpload(fileField);
  if (!validation.ok) {
    requestLogger.warn("upload rejected invalid image", { reason: validation.error, filename: fileField.name });
    return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
  }

  const filename = sanitizeUploadFilename(fileField.name);
  const pathname = buildEvidenceBlobPath(vehicleId, filename);

  try {
    const fileBody = await fileField.arrayBuffer();
    const blob = await put(pathname, fileBody, {
      access: "public",
      contentType: fileField.type,
      addRandomSuffix: false,
    });

    requestLogger.info("upload stored blob", { vehicleId, pathname });
    return NextResponse.json({ ok: true, url: blob.url, pathname: blob.pathname });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    requestLogger.error("upload failed", { vehicleId, error: message });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
