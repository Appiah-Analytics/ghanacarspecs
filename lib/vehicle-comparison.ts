import { EventType } from "@prisma/client";
import type { VehicleReportBundle } from "@/lib/vehicle-report-bundle";
import { vehicleDisplayLabel } from "@/lib/vehicle-report-bundle";

export type VehicleComparisonSnapshot = {
  vehicleId: string;
  label: string;
  vin: string;
  plateNumber: string | null;
  chassisNumber: string | null;
  trustScore: number;
  trustBand: string;
  riskScore: number;
  riskLevel: string;
  eventCount: number;
  photoCount: number;
  accidentCount: number;
  insuranceClaimCount: number;
  theftCount: number;
  importedVehicle: boolean;
  mileageIssue: boolean;
  serviceContinuityScore: number;
  historyConfidenceScore: number;
};

/** Structured comparison snapshot for Phase 23 side-by-side UI and export readiness. */
export function buildVehicleComparisonSnapshot(report: VehicleReportBundle): VehicleComparisonSnapshot {
  const { vehicle, trustScore, riskProfile, intelligence } = report;
  const publishedEvents = vehicle.events.filter(
    (event) => event.status === "PUBLISHED" && event.deletedAt === null,
  );
  const publishedPhotos = vehicle.photos.filter(
    (photo) => photo.status === "PUBLISHED" && photo.deletedAt === null,
  );

  return {
    vehicleId: vehicle.id,
    label: vehicleDisplayLabel(vehicle),
    vin: vehicle.vin,
    plateNumber: vehicle.plateNumber,
    chassisNumber: vehicle.chassisNumber,
    trustScore: trustScore.score,
    trustBand: trustScore.band,
    riskScore: riskProfile.score,
    riskLevel: riskProfile.level,
    eventCount: publishedEvents.length,
    photoCount: publishedPhotos.length,
    accidentCount: publishedEvents.filter((event) => event.eventType === EventType.ACCIDENT).length,
    insuranceClaimCount: publishedEvents.filter((event) => event.eventType === EventType.INSURANCE_CLAIM).length,
    theftCount: publishedEvents.filter((event) => event.eventType === EventType.THEFT).length,
    importedVehicle: intelligence.importedVehicle.indicated,
    mileageIssue: intelligence.mileageInconsistency.detected,
    serviceContinuityScore: intelligence.serviceContinuity.score,
    historyConfidenceScore: intelligence.confidence.score,
  };
}
