import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/admin-auth";

export async function requireAdminApi(request: Request): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  if (await verifyAdminRequest(request, cookieStore)) {
    return null;
  }
  return NextResponse.json(
    {
      ok: false,
      error: "Unauthorized. Sign in at /admin/login or send Authorization: Bearer <secret>.",
    },
    { status: 401 },
  );
}
