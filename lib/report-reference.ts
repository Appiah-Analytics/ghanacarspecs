export type ReportReferenceInput = {
  id: string;
  vin: string;
  chassisNumber: string | null;
  plateNumber: string | null;
};

function normalizeReferenceKey(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function pickReferenceSource(vehicle: ReportReferenceInput): string {
  const vin = vehicle.vin?.trim();
  if (vin) return vin;

  const chassis = vehicle.chassisNumber?.trim();
  if (chassis) return chassis;

  const plate = vehicle.plateNumber?.trim();
  if (plate) return plate;

  return vehicle.id;
}

/** Deterministic GCS-prefixed reference for online, print, and PDF surfaces — no DB storage. */
export function buildReportReference(vehicle: ReportReferenceInput): string {
  return `GCS-${normalizeReferenceKey(pickReferenceSource(vehicle))}`;
}
