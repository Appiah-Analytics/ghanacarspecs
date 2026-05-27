import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";
import { loggerForRequest } from "@/lib/logger";

export async function requireAdminApi(request: Request): Promise<NextResponse | null> {
  const requestLogger = loggerForRequest(request, { area: "admin-api-auth" });
  const cookieStore = await cookies();
  if (await verifyAdminRequest(request, cookieStore)) {
    return null;
  }
  requestLogger.warn("admin api request unauthorized");
  return NextResponse.json(
    {
      ok: false,
      error: "Unauthorized. Sign in at /admin/login or send Authorization: Bearer <secret>.",
    },
    { status: 401 },
  );
}
