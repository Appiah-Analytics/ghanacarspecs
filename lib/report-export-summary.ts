import type { VehicleExecutiveSummary } from "@/lib/vehicle-executive-summary";
import type { VehicleReportBundle } from "@/lib/vehicle-report-bundle";
import { buildVehicleExecutiveSummary } from "@/lib/vehicle-executive-summary";
import { buildVehicleComparisonSnapshot } from "@/lib/vehicle-comparison";
import { vehicleDisplayLabel } from "@/lib/vehicle-report-bundle";

export type ReportExportSummary = {
  generatedAt: string;
  vehicleId: string;
  label: string;
  vin: string;
  plateNumber: string | null;
  chassisNumber: string | null;
  executiveSummary: VehicleExecutiveSummary;
  comparisonSnapshot: ReturnType<typeof buildVehicleComparisonSnapshot>;
  trustScore: number;
  trustBand: string;
  riskScore: number;
  riskLevel: string;
  disclaimer: string;
};

const EXPORT_DISCLAIMER =
  "GhanaCarSpecs report summary for informational use only. Not legal certification, ownership proof, or official government verification.";

/** Plain structured summary for future PDF/print export — no PDF generation in Phase 22. */
export function buildReportExportSummary(report: VehicleReportBundle): ReportExportSummary {
  const executiveSummary = buildVehicleExecutiveSummary(report);

  return {
    generatedAt: new Date().toISOString(),
    vehicleId: report.vehicle.id,
    label: vehicleDisplayLabel(report.vehicle),
    vin: report.vehicle.vin,
    plateNumber: report.vehicle.plateNumber,
    chassisNumber: report.vehicle.chassisNumber,
    executiveSummary,
    comparisonSnapshot: buildVehicleComparisonSnapshot(report),
    trustScore: report.trustScore.score,
    trustBand: report.trustScore.band,
    riskScore: report.riskProfile.score,
    riskLevel: report.riskProfile.level,
    disclaimer: EXPORT_DISCLAIMER,
  };
}
