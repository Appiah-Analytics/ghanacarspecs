import { normalizeVin } from "@/lib/lookup";

/** Verified NHTSA vPIC decode example (not in local seed database). */
export const EXTERNAL_DEMO_VIN = "1HGCM82633A004352";

export function isSeventeenCharVin(query: string): boolean {
  return normalizeVin(query).length === 17;
}

export type NotFoundLookupMessage = {
  title: string;
  message: string;
};

/**
 * Shown when there is no local row and external decode does not apply or did not run.
 * Plate and chassis searches never call NHTSA; only valid 17-character VINs can trigger external decode.
 */
export function getLocalNotFoundMessage(query: string): NotFoundLookupMessage {
  return {
    title: "No local GhanaCarSpecs record",
    message: [
      "There is no local GhanaCarSpecs record for this search in our demonstration database yet.",
      "This demo contains a limited set of sample vehicles only — not DVLA, insurer, police, garage, or other official Ghana records.",
      "If you entered a real Ghana plate, VIN, or chassis number, absence here does not mean the vehicle has no history; it means we have not loaded that record in this demo.",
      "For a valid 17-character VIN not in our sample data, we may show public manufacturer specifications from NHTSA vPIC (US), clearly labeled as an external decode with no GhanaCarSpecs history.",
    ].join(" "),
  };
}

export function getExternalDecodeFailedMessage(reason: string): NotFoundLookupMessage {
  return {
    title: "No local record — external decode unavailable",
    message: [
      "There is no local GhanaCarSpecs record for this VIN in our demonstration database.",
      "We attempted a public manufacturer decode (NHTSA vPIC) because you entered a 17-character VIN, but it did not return usable data.",
      "This is not access to DVLA, insurers, or other official Ghana sources.",
      reason ? `Detail: ${reason}` : "",
    ]
      .filter(Boolean)
      .join(" "),
  };
}
