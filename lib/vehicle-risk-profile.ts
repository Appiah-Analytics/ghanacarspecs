import {
  ConfidenceLevel,
  EventType,
  EvidenceStatus,
  ProvenanceType,
} from "@prisma/client";
import { analyzeVehicleIntelligence, type IntelligenceEvent } from "@/lib/vehicle-intelligence";
import type { VehicleTrustScoreInput } from "@/lib/vehicle-trust-score";

export const RISK_PROFILE_DISCLAIMER =
  "GhanaCarSpecs Risk Profile highlights possible concern areas from available evidence. It is not a legal finding, ownership verdict, or official government check.";

export const RISK_PROFILE_TRUST_NOTE =
  "Trust Score measures evidence completeness and traceability. Risk Profile highlights possible concern areas. A well-documented record can still show elevated risk if accidents or claims appear in the timeline.";

export const RISK_PROFILE_STANDARD_CAUTIONS = [
  "GhanaCarSpecs does not currently verify DVLA, police, or insurer records directly.",
  "No official integration is available for legal certification or ownership proof.",
  "Risk factors describe possible concerns — not accusations or confirmed fraud.",
] as const;

export type VehicleRiskLevel = "Low" | "Moderate" | "Elevated" | "High";

export type VehicleRiskProfile = {
  level: VehicleRiskLevel;
  score: number;
  riskFactors: string[];
  positiveSignals: string[];
  recommendations: string[];
  cautions: string[];
};

const RISK_WEIGHTS = {
  baseline: 8,
  accident: 18,
  insuranceClaim: 15,
  theft: 30,
  mileageInconsistency: 12,
  missingPlate: 10,
  missingChassis: 6,
  noPublishedEvents: 12,
  noPublishedPhotos: 8,
  lowConfidenceEvidence: 6,
  importContext: 4,
  identityComplete: -8,
  eventsRich: -6,
  photosPresent: -4,
  strongerConfidence: -5,
} as const;

function isPublishedEvidence(item: { status: EvidenceStatus; deletedAt: Date | null }): boolean {
  return item.status === EvidenceStatus.PUBLISHED && item.deletedAt === null;
}

function levelForScore(score: number): VehicleRiskLevel {
  if (score >= 65) return "High";
  if (score >= 45) return "Elevated";
  if (score >= 25) return "Moderate";
  return "Low";
}

function levelLabel(level: VehicleRiskLevel): string {
  switch (level) {
    case "High":
      return "High risk";
    case "Elevated":
      return "Elevated risk";
    case "Moderate":
      return "Moderate risk";
    default:
      return "Low risk";
  }
}

function formatIdentityPositive(input: VehicleTrustScoreInput): string | null {
  const parts: string[] = [];
  if (input.vin.trim()) parts.push("VIN");
  if (input.plateNumber?.trim()) parts.push("plate");
  if (input.chassisNumber?.trim()) parts.push("chassis");
  if (parts.length === 0) return null;
  if (parts.length === 3) return "VIN, plate, and chassis are present";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]} are present`;
  return `${parts[0]} is present`;
}

/** Explainable 0–100 risk score (higher = more concern) from published evidence and record gaps. */
export function calculateVehicleRiskProfile(input: VehicleTrustScoreInput): VehicleRiskProfile {
  const publishedEvents = input.events.filter(isPublishedEvidence);
  const publishedPhotos = input.photos.filter(isPublishedEvidence);

  let score = RISK_WEIGHTS.baseline;
  const riskFactors: string[] = [];
  const positiveSignals: string[] = [];
  const recommendations: string[] = [];
  const cautions: string[] = [...RISK_PROFILE_STANDARD_CAUTIONS];

  const identityPositive = formatIdentityPositive(input);
  if (identityPositive) {
    positiveSignals.push(identityPositive);
    if (input.vin.trim() && input.plateNumber?.trim() && input.chassisNumber?.trim()) {
      score += RISK_WEIGHTS.identityComplete;
    }
  } else {
    riskFactors.push("Possible concern: core vehicle identifiers are incomplete on this record.");
  }

  if (!input.plateNumber?.trim()) {
    score += RISK_WEIGHTS.missingPlate;
    riskFactors.push("Possible concern: no plate number is recorded for this vehicle.");
  }

  if (!input.chassisNumber?.trim()) {
    score += RISK_WEIGHTS.missingChassis;
    riskFactors.push("Possible concern: no chassis number is recorded for this vehicle.");
  }

  if (publishedEvents.length === 0) {
    score += RISK_WEIGHTS.noPublishedEvents;
    riskFactors.push("Possible concern: no published timeline events are available.");
    recommendations.push("Gather more timeline evidence before relying on this record for a purchase decision.");
  } else {
    positiveSignals.push(
      `${publishedEvents.length} published timeline event${publishedEvents.length === 1 ? "" : "s"} on record`,
    );
    if (publishedEvents.length >= 3) {
      score += RISK_WEIGHTS.eventsRich;
    }
  }

  if (publishedPhotos.length === 0) {
    score += RISK_WEIGHTS.noPublishedPhotos;
    riskFactors.push("Possible concern: no published visual evidence is available.");
    recommendations.push("Request additional visual evidence or an independent inspection.");
  } else {
    positiveSignals.push(
      `${publishedPhotos.length} published visual evidence item${publishedPhotos.length === 1 ? "" : "s"} available`,
    );
    if (publishedPhotos.length >= 2) {
      score += RISK_WEIGHTS.photosPresent;
    }
  }

  const accidentCount = publishedEvents.filter((event) => event.eventType === EventType.ACCIDENT).length;
  const claimCount = publishedEvents.filter((event) => event.eventType === EventType.INSURANCE_CLAIM).length;
  const theftCount = publishedEvents.filter((event) => event.eventType === EventType.THEFT).length;
  const importCount = publishedEvents.filter((event) => event.eventType === EventType.IMPORT).length;

  if (accidentCount > 0) {
    score += accidentCount * RISK_WEIGHTS.accident;
    riskFactors.push(
      accidentCount === 1
        ? "Evidence indicates an accident event is present in the timeline."
        : `Evidence indicates ${accidentCount} accident events are present in the timeline.`,
    );
    recommendations.push("Review accident-related evidence carefully and request an independent inspection.");
  }

  if (claimCount > 0) {
    score += claimCount * RISK_WEIGHTS.insuranceClaim;
    riskFactors.push(
      claimCount === 1
        ? "Evidence indicates an insurance claim event is present in the timeline."
        : `Evidence indicates ${claimCount} insurance claim events are present in the timeline.`,
    );
    recommendations.push("Confirm claim context with the seller; no insurer integration is currently available.");
  }

  if (theftCount > 0) {
    score += theftCount * RISK_WEIGHTS.theft;
    riskFactors.push(
      theftCount === 1
        ? "Evidence indicates a theft-related event is present in the timeline."
        : `Evidence indicates ${theftCount} theft-related events are present in the timeline.`,
    );
    recommendations.push("Request independent verification before purchase; no police integration is currently available.");
  }

  if (importCount > 0 || input.importDate) {
    score += RISK_WEIGHTS.importContext;
    riskFactors.push("Imported vehicle record is present — review import source and provenance.");
    recommendations.push("Review import source, port/importer provenance, and supporting documentation.");
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
    score += RISK_WEIGHTS.mileageInconsistency;
    riskFactors.push("Possible concern: mileage readings show inconsistencies across published events.");
    for (const detail of intelligence.mileageInconsistency.details.slice(0, 2)) {
      riskFactors.push(`Evidence indicates: ${detail}`);
    }
    recommendations.push("Request an odometer verification or service history review before purchase.");
  }

  const allEvidence = [...publishedEvents, ...publishedPhotos];
  if (allEvidence.length > 0) {
    const lowOnly = allEvidence.every((item) => item.confidenceLevel === ConfidenceLevel.LOW);
    const hasStronger = allEvidence.some(
      (item) =>
        item.confidenceLevel === ConfidenceLevel.HIGH ||
        item.confidenceLevel === ConfidenceLevel.VERIFIED,
    );

    if (lowOnly) {
      score += RISK_WEIGHTS.lowConfidenceEvidence;
      cautions.push("Most published evidence is low confidence — treat risk signals as indicative only.");
    }

    if (hasStronger) {
      score += RISK_WEIGHTS.strongerConfidence;
      positiveSignals.push("Some published evidence uses higher confidence levels.");
    }

    const meaningfulProvenance = allEvidence.some(
      (item) =>
        item.provenanceType !== ProvenanceType.DEMO && item.provenanceType !== ProvenanceType.OTHER,
    );
    if (meaningfulProvenance) {
      positiveSignals.push("Published evidence includes traceable provenance labels.");
    }
  }

  if (recommendations.length === 0) {
    recommendations.push("Request an independent inspection before purchase if you have any remaining concerns.");
  }

  const uniqueRecommendations = [...new Set(recommendations)];
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const level = levelForScore(clamped);

  if (positiveSignals.length === 0) {
    positiveSignals.push("Limited positive signals available from published evidence.");
  }

  return {
    level,
    score: clamped,
    riskFactors,
    positiveSignals,
    recommendations: uniqueRecommendations,
    cautions,
  };
}

export function formatRiskProfileHeadline(profile: VehicleRiskProfile): string {
  return `${levelLabel(profile.level)} — ${profile.score} / 100`;
}
