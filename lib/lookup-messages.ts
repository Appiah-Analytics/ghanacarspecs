import { normalizePlateKey, normalizeVin } from "@/lib/lookup";

/** Verified NHTSA vPIC decode example (not in local seed database). */
export const EXTERNAL_DEMO_VIN = "1HGCM82633A004352";

export function isSeventeenCharVin(query: string): boolean {
  return normalizeVin(query).length === 17;
}

export type NotFoundLookupMessage = {
  title: string;
  message: string;
};

export const LOOKUP_UNAVAILABLE_TITLE = "Lookup temporarily unavailable";
export const LOOKUP_UNAVAILABLE_MESSAGE =
  "The lookup service could not complete the request. Please try again shortly.";

export const EXTERNAL_DECODE_FAILED_TITLE = "VIN could not be decoded";
export const EXTERNAL_DECODE_FAILED_MESSAGE =
  "We did not find a local GhanaCarSpecs record, and the public VIN decoder could not return usable specifications for this VIN.";

export const LOCAL_NOT_FOUND_TITLE = "No local GhanaCarSpecs record found yet";
export const LOCAL_NOT_FOUND_MESSAGE =
  "This does not mean the vehicle has no history. It only means this demo database does not currently contain a local record for that VIN, plate, or chassis number.";

export const PLATE_CHASSIS_NOT_FOUND_MESSAGE =
  "This demonstration database does not contain a local record for that plate or chassis number. That does not mean your vehicle has no history in Ghana — only that this demo has not loaded that identifier. We do not access DVLA, police, insurer, dealer, or other official Ghana records in this version. Only valid 17-character VINs may use the public NHTSA manufacturer decode; plates and chassis numbers do not.";

/**
 * Heuristic for 404 responses: input is not a 17-character VIN, so external decode did not run.
 * Used only for copy — does not affect lookup routing.
 */
export function isPlateOrChassisStyleQuery(query: string): boolean {
  const raw = query.trim();
  if (!raw || isSeventeenCharVin(query)) return false;
  if (/[-\s]/.test(raw)) return true;
  if (/^gr/i.test(raw)) return true;
  const key = normalizePlateKey(raw);
  return key.length > 0 && key.length < 17;
}

/**
 * Shown when there is no local row and external decode does not apply or did not run.
 * Plate and chassis searches never call NHTSA; only valid 17-character VINs can trigger external decode.
 */
export function getLocalNotFoundMessage(query: string): NotFoundLookupMessage {
  if (isPlateOrChassisStyleQuery(query)) {
    return {
      title: LOCAL_NOT_FOUND_TITLE,
      message: PLATE_CHASSIS_NOT_FOUND_MESSAGE,
    };
  }

  return {
    title: LOCAL_NOT_FOUND_TITLE,
    message: [
      LOCAL_NOT_FOUND_MESSAGE,
      "This demo contains a limited set of sample vehicles only — not DVLA, insurer, police, garage, or other official Ghana records.",
      "For a valid 17-character VIN not in our sample data, we may show public manufacturer specifications from NHTSA vPIC (US), clearly labeled as an external decode with no GhanaCarSpecs history.",
    ].join(" "),
  };
}

export function getExternalDecodeFailedMessage(_reason: string): NotFoundLookupMessage {
  return {
    title: EXTERNAL_DECODE_FAILED_TITLE,
    message: [
      EXTERNAL_DECODE_FAILED_MESSAGE,
      "External decode uses NHTSA vPIC (US) for valid 17-character VINs only. This is not access to DVLA, insurers, or other official Ghana sources.",
    ].join(" "),
  };
}

export function getLookupUnavailableMessage(): NotFoundLookupMessage {
  return {
    title: LOOKUP_UNAVAILABLE_TITLE,
    message: LOOKUP_UNAVAILABLE_MESSAGE,
  };
}
