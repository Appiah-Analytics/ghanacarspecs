import type { VehicleReportData } from "@/lib/vehicle-report";
import { analyzeVehicleIntelligence, type VehicleIntelligence } from "@/lib/vehicle-intelligence";
import {
  calculateVehicleTrustScore,
  type VehicleTrustScore,
  type VehicleTrustScoreInput,
} from "@/lib/vehicle-trust-score";
import { calculateVehicleRiskProfile, type VehicleRiskProfile } from "@/lib/vehicle-risk-profile";
import { EvidenceStatus } from "@prisma/client";

type ReportVehicle = VehicleReportData | {
  id: string;
  vin: string;
  plateNumber: string | null;
  chassisNumber: string | null;
  make: string;
  model: string;
  year: number;
  trim?: string | null;
  countryOfOrigin?: string | null;
  importDate?: Date | null;
  events: VehicleReportData["events"];
  photos: VehicleReportData["photos"];
};

export type VehicleReportBundle = {
  vehicle: ReportVehicle;
  trustScore: VehicleTrustScore;
  riskProfile: VehicleRiskProfile;
  intelligence: VehicleIntelligence;
};

function isPublishedEvidence(item: { status: EvidenceStatus; deletedAt: Date | null }): boolean {
  return item.status === EvidenceStatus.PUBLISHED && item.deletedAt === null;
}

function toScoreInput(vehicle: ReportVehicle): VehicleTrustScoreInput {
  return {
    vin: vehicle.vin,
    plateNumber: vehicle.plateNumber,
    chassisNumber: vehicle.chassisNumber,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    countryOfOrigin: vehicle.countryOfOrigin ?? null,
    importDate: vehicle.importDate ?? null,
    events: vehicle.events.filter(isPublishedEvidence),
    photos: vehicle.photos.filter(isPublishedEvidence),
  };
}

/** Shared trust, risk, and intelligence derivations for report presentation. */
export function buildVehicleReportBundle(vehicle: ReportVehicle): VehicleReportBundle {
  const scoreInput = toScoreInput(vehicle);
  const intelligence = analyzeVehicleIntelligence({
    year: vehicle.year,
    countryOfOrigin: scoreInput.countryOfOrigin ?? null,
    importDate: scoreInput.importDate ?? null,
    events: scoreInput.events,
  });

  return {
    vehicle,
    trustScore: calculateVehicleTrustScore(scoreInput),
    riskProfile: calculateVehicleRiskProfile(scoreInput),
    intelligence,
  };
}

export function vehicleDisplayLabel(vehicle: ReportVehicle): string {
  const trim = vehicle.trim ? ` ${vehicle.trim}` : "";
  return `${vehicle.year} ${vehicle.make} ${vehicle.model}${trim}`;
}
