import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Load .env before inlining admin vars into the Edge middleware bundle.
loadEnvConfig(process.cwd());

const adminApiKey = process.env.ADMIN_API_KEY?.trim() ?? "";
const adminPassword = process.env.ADMIN_PASSWORD?.trim() ?? "";

/**
 * Middleware runs on the Edge runtime. Non-NEXT_PUBLIC variables from `.env` are
 * inlined here at dev/build time via `env`. Server routes (API, RSC) also read `.env`.
 */
const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],
  env: {
    ADMIN_API_KEY: adminApiKey,
    ADMIN_PASSWORD: adminPassword,
  },
};

export default nextConfig;
