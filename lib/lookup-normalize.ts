/** Normalize VIN: trim, uppercase, remove spaces. */
export function normalizeVin(input: string): string {
  return input.trim().replace(/\s+/g, "").toUpperCase();
}

/** Normalize plate or chassis for comparison: uppercase, letters and digits only. */
export function normalizePlateKey(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export const normalizeChassisKey = normalizePlateKey;
