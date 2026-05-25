/** Admin image upload validation (Vercel Blob). */

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
]);

const BLOCKED_EXTENSIONS = new Set([
  "exe",
  "bat",
  "cmd",
  "com",
  "scr",
  "msi",
  "dll",
  "sh",
  "bash",
  "ps1",
  "vbs",
  "js",
  "mjs",
  "cjs",
  "ts",
  "jsx",
  "tsx",
  "html",
  "htm",
  "php",
  "jar",
  "apk",
  "dmg",
  "app",
  "deb",
  "rpm",
]);

export function sanitizeUploadFilename(originalName: string): string {
  const base = originalName.split(/[/\\]/).pop()?.trim() || "upload";
  let safe = base.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  if (!safe || safe === "." || safe === "..") {
    safe = "upload";
  }
  const dot = safe.lastIndexOf(".");
  const ext = dot > 0 ? safe.slice(dot + 1).toLowerCase() : "";
  if (ext && BLOCKED_EXTENSIONS.has(ext)) {
    return "upload.jpg";
  }
  if (safe.length > 120) {
    const stem = dot > 0 ? safe.slice(0, dot) : safe;
    safe = `${stem.slice(0, 100)}${ext ? `.${ext}` : ""}`;
  }
  return safe;
}

export function buildEvidenceBlobPath(vehicleId: string, filename: string): string {
  const sanitizedVehicleId = vehicleId.replace(/[^a-zA-Z0-9_-]/g, "");
  return `vehicle-evidence/${sanitizedVehicleId}/${Date.now()}-${filename}`;
}

export type UploadValidationResult = { ok: true } | { ok: false; error: string };

export function validateImageUpload(file: File): UploadValidationResult {
  if (!file.size) {
    return { ok: false, error: "File is empty." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "File exceeds 10 MB limit." };
  }
  const mime = file.type.trim().toLowerCase();
  if (!mime || !ALLOWED_IMAGE_MIME_TYPES.has(mime)) {
    return { ok: false, error: "Only image files are allowed (JPEG, PNG, WebP, GIF, AVIF, HEIC)." };
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext && BLOCKED_EXTENSIONS.has(ext)) {
    return { ok: false, error: "Executable or script file types are not allowed." };
  }
  return { ok: true };
}
