/**
 * Canonical demo photo paths under public/demo-photos/.
 * Seed and UI must use these constants so filenames and URLs stay in sync.
 */
export const DEMO_PHOTO_URLS = {
  toyotaPortImport: "/demo-photos/toyota-tema-port-import.svg",
  toyotaInspection: "/demo-photos/toyota-inspection-walkaround.svg",
  vwAccident: "/demo-photos/vw-accident-damage.svg",
  vwRepair: "/demo-photos/vw-body-shop-repair.svg",
  hondaAuction: "/demo-photos/honda-us-auction-lot.svg",
  hondaImportSource: "/demo-photos/honda-export-import-source.svg",
} as const;

export type DemoPhotoUrl = (typeof DEMO_PHOTO_URLS)[keyof typeof DEMO_PHOTO_URLS];

/** Normalize stored photo URL for static serving from /public. */
export function normalizeDemoPhotoSrc(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("/demo-photos/")) return trimmed;
  if (trimmed.startsWith("demo-photos/")) return `/${trimmed}`;
  return trimmed;
}
