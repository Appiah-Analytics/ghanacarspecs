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

/** Keep in sync with `lib/evidence-metadata.ts` */
export const CONFIDENCE_LEVEL_OPTIONS = [
  { value: "LOW", label: "Low confidence" },
  { value: "MEDIUM", label: "Medium confidence" },
  { value: "HIGH", label: "High confidence" },
  { value: "VERIFIED", label: "Verified" },
] as const;

/** Keep in sync with `lib/evidence-metadata.ts` */
export const PROVENANCE_TYPE_OPTIONS = [
  { value: "DEMO", label: "Demo / sample" },
  { value: "USER_SUBMITTED", label: "User submitted" },
  { value: "DEALER", label: "Dealer" },
  { value: "IMPORTER", label: "Importer" },
  { value: "AUCTION", label: "Auction" },
  { value: "INTERNAL", label: "Internal (GhanaCarSpecs)" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "INSURER", label: "Insurer" },
  { value: "POLICE", label: "Police" },
  { value: "OTHER", label: "Other" },
] as const;

/** Keep in sync with EvidenceStatus enum */
export const EVIDENCE_STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "PUBLISHED", label: "Published" },
  { value: "REJECTED", label: "Rejected" },
  { value: "ARCHIVED", label: "Archived" },
] as const;
