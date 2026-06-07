import { EventType, EvidenceStatus } from "@prisma/client";
import type { VehicleReportBundle } from "@/lib/vehicle-report-bundle";

export type VehicleExecutiveSummary = {
  overallAssessment: string;
  trustBand: string;
  riskLevel: string;
  importStatus: string;
  accidentClaimStatus: string;
  mileageStatus: string;
  keySignals: string[];
  recommendedNextStep: string;
};

function isPublished(item: { status: EvidenceStatus; deletedAt: Date | null }): boolean {
  return item.status === EvidenceStatus.PUBLISHED && item.deletedAt === null;
}

function formatIdentitySignal(vehicle: VehicleReportBundle["vehicle"]): string | null {
  const parts: string[] = [];
  if (vehicle.vin.trim()) parts.push("VIN");
  if (vehicle.plateNumber?.trim()) parts.push("plate");
  if (vehicle.chassisNumber?.trim()) parts.push("chassis");
  if (parts.length === 0) return null;
  if (parts.length === 3) return "VIN, plate, and chassis are present.";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]} are present.`;
  return `${parts[0]} is present.`;
}

function buildOverallAssessment(trustBand: string, riskLevel: string): string {
  const riskPhrase =
    riskLevel === "Low"
      ? "low visible risk"
      : riskLevel === "Moderate"
        ? "moderate visible risk"
        : riskLevel === "Elevated"
          ? "elevated visible risk"
          : "high visible risk";
  return `${trustBand} record confidence with ${riskPhrase}.`;
}

function buildImportStatus(intelligence: VehicleReportBundle["intelligence"]): string {
  if (intelligence.importedVehicle.indicated) {
    return "Imported vehicle record is present — review import provenance.";
  }
  return "No import event indicated on published timeline.";
}

function buildAccidentClaimStatus(
  accidentCount: number,
  claimCount: number,
  theftCount: number,
): string {
  const parts: string[] = [];
  if (accidentCount > 0) {
    parts.push(`${accidentCount} accident event${accidentCount === 1 ? "" : "s"}`);
  }
  if (claimCount > 0) {
    parts.push(`${claimCount} insurance claim event${claimCount === 1 ? "" : "s"}`);
  }
  if (theftCount > 0) {
    parts.push(`${theftCount} theft event${theftCount === 1 ? "" : "s"}`);
  }
  if (parts.length === 0) {
    return "No accident, claim, or theft events on published timeline.";
  }
  return `Possible concern: ${parts.join(", ")} on published timeline.`;
}

function buildMileageStatus(intelligence: VehicleReportBundle["intelligence"]): string {
  if (intelligence.mileageInconsistency.detected) {
    return "Possible mileage inconsistency detected across published events.";
  }
  return "No mileage inconsistency detected on published timeline.";
}

function buildRecommendedNextStep(report: VehicleReportBundle): string {
  const primary = report.riskProfile.recommendations[0];
  if (primary) return primary;
  return "Review evidence and request an independent inspection before purchase.";
}

/** One-glance report interpretation from existing trust, risk, and intelligence data. */
export function buildVehicleExecutiveSummary(report: VehicleReportBundle): VehicleExecutiveSummary {
  const { vehicle, trustScore, riskProfile, intelligence } = report;
  const publishedEvents = vehicle.events.filter(isPublished);
  const publishedPhotos = vehicle.photos.filter(isPublished);

  const accidentCount = publishedEvents.filter((event) => event.eventType === EventType.ACCIDENT).length;
  const claimCount = publishedEvents.filter((event) => event.eventType === EventType.INSURANCE_CLAIM).length;
  const theftCount = publishedEvents.filter((event) => event.eventType === EventType.THEFT).length;

  const keySignals: string[] = [];

  const identity = formatIdentitySignal(vehicle);
  if (identity) keySignals.push(identity);

  if (publishedEvents.length > 0) {
    keySignals.push(
      `${publishedEvents.length} published timeline event${publishedEvents.length === 1 ? "" : "s"} ${publishedEvents.length === 1 ? "is" : "are"} available.`,
    );
  } else {
    keySignals.push("No published timeline events are available.");
  }

  if (publishedPhotos.length > 0) {
    keySignals.push(
      `${publishedPhotos.length} published visual evidence item${publishedPhotos.length === 1 ? "" : "s"} ${publishedPhotos.length === 1 ? "is" : "are"} available.`,
    );
  } else {
    keySignals.push("No published visual evidence is available.");
  }

  if (intelligence.importedVehicle.indicated) {
    keySignals.push("Imported vehicle record is present.");
  }

  if (intelligence.mileageInconsistency.detected) {
    keySignals.push("Possible mileage inconsistency detected.");
  } else if (publishedEvents.some((event) => event.mileage != null)) {
    keySignals.push("No mileage inconsistency detected on available readings.");
  }

  if (accidentCount > 0) {
    keySignals.push(
      `Evidence indicates ${accidentCount} accident event${accidentCount === 1 ? "" : "s"} on the timeline.`,
    );
  }

  if (claimCount > 0) {
    keySignals.push(
      `Evidence indicates ${claimCount} insurance claim event${claimCount === 1 ? "" : "s"} on the timeline.`,
    );
  }

  return {
    overallAssessment: buildOverallAssessment(trustScore.band, riskProfile.level),
    trustBand: trustScore.band,
    riskLevel: riskProfile.level,
    importStatus: buildImportStatus(intelligence),
    accidentClaimStatus: buildAccidentClaimStatus(accidentCount, claimCount, theftCount),
    mileageStatus: buildMileageStatus(intelligence),
    keySignals,
    recommendedNextStep: buildRecommendedNextStep(report),
  };
}
