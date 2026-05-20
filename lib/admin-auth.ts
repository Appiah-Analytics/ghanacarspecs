/** HttpOnly session cookie set after a successful browser login. */
export const ADMIN_SESSION_COOKIE = "gcs_admin_session";

const SESSION_MARKER = "gcs_admin_v1";

/** Cookie lifetime after login (8 hours). */
export const ADMIN_SESSION_MAX_AGE_SEC = 60 * 60 * 8;

type CookieReader = {
  get: (name: string) => { value: string } | undefined;
};

/** Non-empty trimmed env value, or null if missing/blank. */
export function readAdminEnv(name: "ADMIN_API_KEY" | "ADMIN_PASSWORD"): string | null {
  const raw = process.env[name];
  if (raw == null) return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Admin secret for this deployment. `ADMIN_API_KEY` wins if both are set.
 * Set one of these in the environment before exposing admin routes publicly.
 */
export function getAdminSecret(): string | null {
  return readAdminEnv("ADMIN_API_KEY") ?? readAdminEnv("ADMIN_PASSWORD");
}

export function isAdminConfigured(): boolean {
  return getAdminSecret() != null;
}

/** Safe diagnostic — never returns secret values. */
export function getAdminConfigDiagnostic(): {
  configured: boolean;
  adminApiKeySet: boolean;
  adminPasswordSet: boolean;
  activeSource: "ADMIN_API_KEY" | "ADMIN_PASSWORD" | null;
} {
  const apiKey = readAdminEnv("ADMIN_API_KEY");
  const password = readAdminEnv("ADMIN_PASSWORD");
  return {
    configured: apiKey != null || password != null,
    adminApiKeySet: apiKey != null,
    adminPasswordSet: password != null,
    activeSource: apiKey ? "ADMIN_API_KEY" : password ? "ADMIN_PASSWORD" : null,
  };
}

function safeEqual(expected: string, provided: string): boolean {
  if (expected.length !== provided.length) return false;
  let out = 0;
  for (let i = 0; i < expected.length; i += 1) {
    out |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return out === 0;
}

export function verifyAdminCredential(value: string): boolean {
  const secret = getAdminSecret();
  if (!secret) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return safeEqual(secret, trimmed);
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Deterministic session value derived from the admin secret (invalidates when secret rotates). */
export async function createAdminSessionToken(): Promise<string | null> {
  const secret = getAdminSecret();
  if (!secret) return null;
  return hmacSha256Hex(secret, SESSION_MARKER);
}

export async function hasValidAdminSession(cookieValue: string | undefined): Promise<boolean> {
  const expected = await createAdminSessionToken();
  if (!expected || !cookieValue) return false;
  return safeEqual(expected, cookieValue);
}

export function verifyAdminAuthorizationHeader(authHeader: string | null): boolean {
  if (!authHeader?.startsWith("Bearer ")) return false;
  return verifyAdminCredential(authHeader.slice(7));
}

/**
 * Accepts:
 * - `Authorization: Bearer <ADMIN_API_KEY or ADMIN_PASSWORD>`
 * - `X-Admin-Key: <same secret>`
 * - Valid admin session cookie (browser login)
 */
export async function verifyAdminRequest(request: Request, cookieReader?: CookieReader): Promise<boolean> {
  if (!isAdminConfigured()) return false;

  if (verifyAdminAuthorizationHeader(request.headers.get("authorization"))) {
    return true;
  }

  const headerKey = request.headers.get("x-admin-key");
  if (headerKey && verifyAdminCredential(headerKey)) {
    return true;
  }

  if (cookieReader) {
    const session = cookieReader.get(ADMIN_SESSION_COOKIE)?.value;
    if (await hasValidAdminSession(session)) {
      return true;
    }
  }

  return false;
}

export function adminSessionCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SEC,
  };
}
