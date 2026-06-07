/** Public PDF export endpoint for local vehicle reports. */
export function vehiclePdfExportUrl(vehicleId: string): string {
  return `/api/vehicles/${vehicleId}/export/pdf`;
}
