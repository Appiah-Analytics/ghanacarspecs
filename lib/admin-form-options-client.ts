/** Client-safe select options (no Prisma imports). Keep in sync with schema enums. */

export const EVENT_TYPE_OPTIONS = [
  { value: "IMPORT", label: "Import" },
  { value: "REGISTRATION", label: "Registration" },
  { value: "SERVICE", label: "Service" },
  { value: "ACCIDENT", label: "Accident" },
  { value: "INSURANCE_CLAIM", label: "Insurance Claim" },
  { value: "MILEAGE_UPDATE", label: "Mileage Update" },
  { value: "THEFT", label: "Theft" },
  { value: "OTHER", label: "Other" },
] as const;

export const PHOTO_SOURCE_TYPE_OPTIONS = [
  { value: "IMPORT_CONDITION", label: "Import condition" },
  { value: "INSPECTION", label: "Inspection" },
  { value: "ACCIDENT_REPAIR", label: "Accident / repair" },
  { value: "AUCTION", label: "Auction / pre-sale" },
  { value: "OTHER", label: "Other" },
] as const;
