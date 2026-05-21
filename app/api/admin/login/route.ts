import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
  isAdminConfigured,
  verifyAdminCredential,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Admin protection is not configured. Set ADMIN_API_KEY or ADMIN_PASSWORD." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const secret =
    body && typeof body === "object" && "secret" in body && typeof (body as { secret: unknown }).secret === "string"
      ? (body as { secret: string }).secret
      : null;

  if (!secret) {
    return NextResponse.json({ ok: false, error: "Missing secret." }, { status: 400 });
  }

  if (!verifyAdminCredential(secret)) {
    return NextResponse.json({ ok: false, error: "Invalid admin secret." }, { status: 401 });
  }

  const token = await createAdminSessionToken();
  if (!token) {
    return NextResponse.json({ ok: false, error: "Could not create admin session." }, { status: 500 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions());

  return NextResponse.json({ ok: true });
}
