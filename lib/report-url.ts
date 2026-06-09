/** Canonical public report path for a local vehicle record. */
export function vehicleReportPath(vehicleId: string): string {
  return `/vehicles/${vehicleId}`;
}

/** Print-friendly report path. */
export function vehiclePrintReportPath(vehicleId: string): string {
  return `/vehicles/${vehicleId}/print`;
}
