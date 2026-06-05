import {
  ConfidenceLevel,
  EventType,
  EvidenceStatus,
  ProvenanceType,
} from "@prisma/client";
import { PROVENANCE_TYPE_OPTIONS } from "@/lib/evidence-metadata";
import { analyzeVehicleIntelligence, type IntelligenceEvent } from "@/lib/vehicle-intelligence";

export const TRUST_SCORE_DISCLAIMER =
  "GhanaCarSpecs Trust Score is an internal evidence completeness and traceability signal. It does not prove ownership, legal status, roadworthiness, or official government verification.";

export const TRUST_SCORE_STANDARD_CAUTIONS = [
  "No official DVLA integration",
  "No insurer or police integration",
  "Score is not legal certification",
] as const;

export type VehicleTrustBand = "Strong" | "Moderate" | "Limited" | "Weak";

export type VehicleTrustScore = {
  score: number;
  band: VehicleTrustBand;
  reasons: string[];
  cautions: string[];
};

export type VehicleTrustScoreInput = {
  vin: string;
  plateNumber: string | null;
  chassisNumber: string | null;
  make: string;
  model: string;
  year: number;
  countryOfOrigin?: string | null;
  importDate?: Date | null;
  events: Array<{
    eventType: EventType;
    eventDate: Date;
    mileage: number | null;
    sourceSystem: string | null;
    confidenceLevel: ConfidenceLevel;
    provenanceType: ProvenanceType;
    status: EvidenceStatus;
    deletedAt: Date | null;
  }>;
  photos: Array<{
    confidenceLevel: ConfidenceLevel;
    provenanceType: ProvenanceType;
    status: EvidenceStatus;
    deletedAt: Date | null;
  }>;
};

const SCORE_WEIGHTS = {
  base: 15,
  vin: 10,
  plate: 8,
  chassis: 8,
  identity: 9,
  eventEach: 4,
  eventCap: 16,
  photoEach: 3,
  photoCap: 9,
  confidenceLow: 1,
  confidenceMedium: 2,
  confidenceHigh: 3,
  confidenceVerified: 4,
  confidenceCap: 15,
  provenanceDiversity: 8,
  accidentEach: 3,
  claimEach: 3,
  theftEach: 8,
  mileageInconsistency: 5,
} as const;

function isCountableEvidence(item: { status: EvidenceStatus; deletedAt: Date | null }): boolean {
  return item.status === EvidenceStatus.PUBLISHED && item.deletedAt === null;
}

function provenanceLabel(type: ProvenanceType): string {
  return PROVENANCE_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type.replace(/_/g, " ").toLowerCase();
}

function bandForScore(score: number): VehicleTrustBand {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Moderate";
  if (score >= 40) return "Limited";
  return "Weak";
}

function bandLead(band: VehicleTrustBand): string {
  switch (band) {
    case "Strong":
      return "Strong record confidence";
    case "Moderate":
      return "Moderate record confidence";
    case "Limited":
      return "Limited record confidence";
    default:
      return "Weak record confidence";
  }
}

function confidencePoints(level: ConfidenceLevel): number {
  switch (level) {
    case ConfidenceLevel.MEDIUM:
      return SCORE_WEIGHTS.confidenceMedium;
    case ConfidenceLevel.HIGH:
      return SCORE_WEIGHTS.confidenceHigh;
    case ConfidenceLevel.VERIFIED:
      return SCORE_WEIGHTS.confidenceVerified;
    default:
      return SCORE_WEIGHTS.confidenceLow;
  }
}

function averageConfidenceScore(
  events: VehicleTrustScoreInput["events"],
  photos: VehicleTrustScoreInput["photos"],
): number {
  const levels = [
    ...events.map((event) => event.confidenceLevel),
    ...photos.map((photo) => photo.confidenceLevel),
  ];
  if (levels.length === 0) return 0;

  const total = levels.reduce((sum, level) => sum + confidencePoints(level), 0);
  const average = total / levels.length;
  return Math.min(SCORE_WEIGHTS.confidenceCap, Math.round(average * 3.5));
}

function formatIdentitySummary(input: VehicleTrustScoreInput): string | null {
  const parts: string[] = [];
  if (input.vin.trim()) parts.push("VIN");
  if (input.plateNumber?.trim()) parts.push("plate");
  if (input.chassisNumber?.trim()) parts.push("chassis");

  if (parts.length === 0) return null;
  if (parts.length === 1) return `${parts[0]} is present`;
  if (parts.length === 2) return `${parts[0]} and ${parts[1]} are present`;
  return `${parts[0]}, ${parts[1]}, and ${parts[2]} are present`;
}

function formatProvenanceSummary(types: ProvenanceType[]): string | null {
  const meaningful = types.filter((type) => type !== ProvenanceType.DEMO && type !== ProvenanceType.OTHER);
  if (meaningful.length === 0) return null;

  const labels = [...new Set(meaningful.map(provenanceLabel))];
  if (labels.length === 1) return `Evidence includes ${labels[0].toLowerCase()} provenance`;
  const last = labels.pop();
  return `Evidence includes ${labels.map((label) => label.toLowerCase()).join(", ")} and ${last?.toLowerCase()} provenance`;
}

/** Explainable 0–100 trust score from published, non-deleted evidence and record completeness. */
export function calculateVehicleTrustScore(input: VehicleTrustScoreInput): VehicleTrustScore {
  const publishedEvents = input.events.filter(isCountableEvidence);
  const publishedPhotos = input.photos.filter(isCountableEvidence);

  let score = SCORE_WEIGHTS.base;
  const reasons: string[] = [];
  const cautions: string[] = [...TRUST_SCORE_STANDARD_CAUTIONS];

  const identitySummary = formatIdentitySummary(input);
  if (input.vin.trim()) score += SCORE_WEIGHTS.vin;
  if (input.plateNumber?.trim()) score += SCORE_WEIGHTS.plate;
  if (input.chassisNumber?.trim()) score += SCORE_WEIGHTS.chassis;
  if (input.make.trim() && input.model.trim() && input.year > 0) score += SCORE_WEIGHTS.identity;
  if (identitySummary) reasons.push(identitySummary);

  const eventPoints = Math.min(publishedEvents.length * SCORE_WEIGHTS.eventEach, SCORE_WEIGHTS.eventCap);
  const photoPoints = Math.min(publishedPhotos.length * SCORE_WEIGHTS.photoEach, SCORE_WEIGHTS.photoCap);
  score += eventPoints + photoPoints;

  if (publishedEvents.length > 0) {
    reasons.push(
      `${publishedEvents.length} published timeline event${publishedEvents.length === 1 ? "" : "s"}`,
    );
  } else {
    cautions.push("No published timeline events on this record");
  }

  if (publishedPhotos.length > 0) {
    reasons.push(
      `${publishedPhotos.length} published visual evidence item${publishedPhotos.length === 1 ? "" : "s"}`,
    );
  } else {
    cautions.push("No published visual evidence on this record");
  }

  const qualityPoints = averageConfidenceScore(publishedEvents, publishedPhotos);
  score += qualityPoints;
  if (qualityPoints >= 10) {
    reasons.push("Evidence includes medium-to-high confidence items");
  } else if (publishedEvents.length + publishedPhotos.length > 0) {
    reasons.push("Most published evidence is low confidence — more traceable sources would help");
  }

  const provenanceTypes = [
    ...publishedEvents.map((event) => event.provenanceType),
    ...publishedPhotos.map((photo) => photo.provenanceType),
  ];
  const provenanceSummary = formatProvenanceSummary(provenanceTypes);
  if (provenanceSummary) {
    score += SCORE_WEIGHTS.provenanceDiversity;
    reasons.push(provenanceSummary);
  }

  const accidentCount = publishedEvents.filter((event) => event.eventType === EventType.ACCIDENT).length;
  const claimCount = publishedEvents.filter((event) => event.eventType === EventType.INSURANCE_CLAIM).length;
  const theftCount = publishedEvents.filter((event) => event.eventType === EventType.THEFT).length;

  if (accidentCount > 0) {
    score -= accidentCount * SCORE_WEIGHTS.accidentEach;
    cautions.push(
      `Published timeline includes ${accidentCount} accident event${accidentCount === 1 ? "" : "s"}`,
    );
  }
  if (claimCount > 0) {
    score -= claimCount * SCORE_WEIGHTS.claimEach;
    cautions.push(
      `Published timeline includes ${claimCount} insurance claim event${claimCount === 1 ? "" : "s"}`,
    );
  }
  if (theftCount > 0) {
    score -= theftCount * SCORE_WEIGHTS.theftEach;
    cautions.push(`Published timeline includes ${theftCount} theft event${theftCount === 1 ? "" : "s"}`);
  }

  const intelligenceEvents: IntelligenceEvent[] = publishedEvents.map((event) => ({
    eventType: event.eventType,
    eventDate: event.eventDate,
    mileage: event.mileage,
    sourceSystem: event.sourceSystem,
  }));
  const intelligence = analyzeVehicleIntelligence({
    year: input.year,
    countryOfOrigin: input.countryOfOrigin ?? null,
    importDate: input.importDate ?? null,
    events: intelligenceEvents,
  });

  if (intelligence.mileageInconsistency.detected) {
    score -= SCORE_WEIGHTS.mileageInconsistency;
    cautions.push("Mileage readings show inconsistencies across published events");
    for (const detail of intelligence.mileageInconsistency.details.slice(0, 2)) {
      cautions.push(detail);
    }
  }

  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const band = bandForScore(clamped);

  if (reasons.length === 0) {
    reasons.push("Minimal published evidence available for this vehicle");
  }

  return {
    score: clamped,
    band,
    reasons: [bandLead(band), ...reasons],
    cautions,
  };
}
