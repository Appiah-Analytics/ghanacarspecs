import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
  isAdminConfigured,
  verifyAdminCredential,
} from "@/lib/admin-auth";
import { loggerForRequest } from "@/lib/logger";

export async function POST(request: Request) {
  const requestLogger = loggerForRequest(request, { route: "/api/admin/login" });
  if (!isAdminConfigured()) {
    requestLogger.error("admin login attempted but admin secret not configured");
    return NextResponse.json(
      { ok: false, error: "Admin protection is not configured. Set ADMIN_API_KEY or ADMIN_PASSWORD." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    requestLogger.warn("admin login rejected invalid json body");
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const secret =
    body && typeof body === "object" && "secret" in body && typeof (body as { secret: unknown }).secret === "string"
      ? (body as { secret: string }).secret
      : null;

  if (!secret) {
    requestLogger.warn("admin login rejected missing secret");
    return NextResponse.json({ ok: false, error: "Missing secret." }, { status: 400 });
  }

  if (!verifyAdminCredential(secret)) {
    requestLogger.warn("admin login rejected invalid credential");
    return NextResponse.json({ ok: false, error: "Invalid admin secret." }, { status: 401 });
  }

  const token = await createAdminSessionToken();
  if (!token) {
    requestLogger.error("admin login failed creating session token");
    return NextResponse.json({ ok: false, error: "Could not create admin session." }, { status: 500 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions());

  requestLogger.info("admin login succeeded");
  return NextResponse.json({ ok: true });
}
