import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminConfigured, verifyAdminRequest } from "@/lib/admin-auth";

const PUBLIC_ADMIN_PATHS = new Set(["/admin/login", "/api/admin/login", "/api/admin/logout"]);

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin/");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isAdminPath(pathname)) {
    return NextResponse.next();
  }

  if (PUBLIC_ADMIN_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (await verifyAdminRequest(request, request.cookies)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin")) {
    if (!isAdminConfigured()) {
      return NextResponse.json(
        {
          error: "Admin protection is not configured. Set ADMIN_API_KEY or ADMIN_PASSWORD on the server.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      {
        error: "Unauthorized. Provide Authorization: Bearer <secret>, X-Admin-Key, or sign in at /admin/login.",
      },
      { status: 401 },
    );
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/admin", "/api/admin/:path*"],
};
