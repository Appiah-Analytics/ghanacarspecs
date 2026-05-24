import type { PhotoSourceType } from "@prisma/client";

/** Human-readable labels for photo source categories (demo / sample evidence only). */
export const PHOTO_SOURCE_TYPE_LABELS: Record<PhotoSourceType, string> = {
  IMPORT_CONDITION: "Import condition",
  INSPECTION: "Inspection",
  ACCIDENT_REPAIR: "Accident / repair",
  AUCTION: "Auction / pre-sale",
  OTHER: "Other",
};

export function formatPhotoSource(sourceType: PhotoSourceType, sourceLabel?: string | null): string {
  const base = PHOTO_SOURCE_TYPE_LABELS[sourceType];
  if (sourceLabel?.trim()) return `${base} · ${sourceLabel.trim()}`;
  return base;
}
