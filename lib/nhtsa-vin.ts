/**
 * Free VIN decode via NHTSA vPIC (US DOT public API). No API key.
 * https://vpic.nhtsa.dot.gov/api/
 */

const VPIC_BASE = "https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues";

export type ExternalVinSpecs = {
  modelYear?: string;
  make?: string;
  model?: string;
  trim?: string;
  series?: string;
  bodyClass?: string;
  driveType?: string;
  fuelTypePrimary?: string;
  displacementL?: string;
  engineCylinders?: string;
  engineModel?: string;
  plantCountry?: string;
  vehicleType?: string;
  manufacturerName?: string;
  plantCity?: string;
  plantState?: string;
  doors?: string;
  transmissionStyle?: string;
};

export type NhtsaDecodeOutcome =
  | { ok: true; vin: string; specs: ExternalVinSpecs; provider: "NHTSA vPIC" }
  | { ok: false; reason: string };

function pick(row: Record<string, string>, key: string): string | undefined {
  const v = row[key];
  if (v == null) return undefined;
  const t = String(v).trim();
  return t === "" || t.toLowerCase() === "not applicable" ? undefined : t;
}

export async function decodeVinNhtsa(vin: string): Promise<NhtsaDecodeOutcome> {
  const normalized = vin.trim().toUpperCase();
  if (normalized.length !== 17) {
    return { ok: false, reason: "VIN must be exactly 17 characters." };
  }

  const url = `${VPIC_BASE}/${encodeURIComponent(normalized)}?format=json`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return { ok: false, reason: `Could not reach NHTSA vPIC: ${msg}` };
  }

  if (!res.ok) {
    return { ok: false, reason: `NHTSA vPIC returned HTTP ${res.status}.` };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return { ok: false, reason: "Invalid JSON from NHTSA vPIC." };
  }

  const results = json && typeof json === "object" && "Results" in json ? (json as { Results?: unknown }).Results : null;
  if (!Array.isArray(results) || results.length === 0 || typeof results[0] !== "object" || results[0] === null) {
    return { ok: false, reason: "Unexpected response shape from NHTSA vPIC." };
  }

  const row = results[0] as Record<string, string>;
  const errorCode = pick(row, "ErrorCode");
  const errorText = pick(row, "ErrorText");

  if (errorCode && errorCode !== "0") {
    return {
      ok: false,
      reason: errorText ? `NHTSA: ${errorText}` : `NHTSA decode failed (code ${errorCode}).`,
    };
  }

  const specs: ExternalVinSpecs = {
    modelYear: pick(row, "ModelYear"),
    make: pick(row, "Make"),
    model: pick(row, "Model"),
    trim: pick(row, "Trim"),
    series: pick(row, "Series"),
    bodyClass: pick(row, "BodyClass"),
    driveType: pick(row, "DriveType"),
    fuelTypePrimary: pick(row, "FuelTypePrimary"),
    displacementL: pick(row, "DisplacementL"),
    engineCylinders: pick(row, "EngineCylinders"),
    engineModel: pick(row, "EngineModel"),
    plantCountry: pick(row, "PlantCountry"),
    vehicleType: pick(row, "VehicleType"),
    manufacturerName: pick(row, "ManufacturerName") ?? pick(row, "Manufacturer"),
    plantCity: pick(row, "PlantCity"),
    plantState: pick(row, "PlantState"),
    doors: pick(row, "Doors"),
    transmissionStyle: pick(row, "TransmissionStyle"),
  };

  const hasCore = specs.make || specs.model || specs.modelYear;
  if (!hasCore) {
    return { ok: false, reason: "NHTSA returned no usable make/model/year for this VIN." };
  }

  return { ok: true, vin: normalized, specs, provider: "NHTSA vPIC" };
}
