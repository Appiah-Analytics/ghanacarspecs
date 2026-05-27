import "server-only";

type NodeEnvironment = "development" | "production";

type Env = {
  DATABASE_URL: string;
  ADMIN_API_KEY: string | null;
  ADMIN_PASSWORD: string | null;
  BLOB_READ_WRITE_TOKEN: string | null;
  NODE_ENV: NodeEnvironment;
};

function readTrimmed(name: keyof NodeJS.ProcessEnv): string | null {
  const raw = process.env[name];
  if (raw == null) return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function maskSecret(value: string | null): string {
  if (!value) return "(missing)";
  if (value.length <= 4) return "***";
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

function requireValue(value: string | null, name: string): string {
  if (!value) {
    throw new Error(`[env] Missing required environment variable: ${name}`);
  }
  return value;
}

function validateEnvironment(): Env {
  const databaseUrl = readTrimmed("DATABASE_URL");
  const adminApiKey = readTrimmed("ADMIN_API_KEY");
  const adminPassword = readTrimmed("ADMIN_PASSWORD");
  const blobToken = readTrimmed("BLOB_READ_WRITE_TOKEN");

  const missing: string[] = [];
  if (!databaseUrl) {
    missing.push("DATABASE_URL");
  }
  if (!adminApiKey && !adminPassword) {
    missing.push("ADMIN_API_KEY or ADMIN_PASSWORD");
  }

  if (missing.length > 0) {
    const reason = missing.join(", ");
    throw new Error(
      `[env] Missing required environment variable(s): ${reason}. Set these before starting the server.`,
    );
  }

  if (!blobToken) {
    console.warn(
      `[env] Optional variable BLOB_READ_WRITE_TOKEN is missing. Admin image uploads will be unavailable.`,
    );
  }

  if (process.env.NODE_ENV !== "production") {
    console.info(
      `[env] validated DATABASE_URL=${maskSecret(databaseUrl)} ADMIN_API_KEY=${maskSecret(adminApiKey)} ADMIN_PASSWORD=${maskSecret(adminPassword)} BLOB_READ_WRITE_TOKEN=${maskSecret(blobToken)}`,
    );
  }

  return {
    DATABASE_URL: requireValue(databaseUrl, "DATABASE_URL"),
    ADMIN_API_KEY: adminApiKey,
    ADMIN_PASSWORD: adminPassword,
    BLOB_READ_WRITE_TOKEN: blobToken,
    NODE_ENV: process.env.NODE_ENV === "production" ? "production" : "development",
  };
}

export const env: Env = validateEnvironment();
