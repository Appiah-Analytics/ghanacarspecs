import type { ConfidenceLevel, EvidenceStatus, ProvenanceType } from "@prisma/client";

export const CONFIDENCE_LEVEL_OPTIONS = [
  { value: "LOW", label: "Low confidence" },
  { value: "MEDIUM", label: "Medium confidence" },
  { value: "HIGH", label: "High confidence" },
  { value: "VERIFIED", label: "Verified" },
] as const;

export const PROVENANCE_TYPE_OPTIONS = [
  { value: "DEMO", label: "Demo / sample" },
  { value: "USER_SUBMITTED", label: "User submitted" },
  { value: "DEALER", label: "Dealer" },
  { value: "IMPORTER", label: "Importer" },
  { value: "AUCTION", label: "Auction" },
  { value: "INTERNAL", label: "Internal (GhanaCarSpecs)" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "INSURER", label: "Insurer" },
  { value: "POLICE", label: "Police" },
  { value: "OTHER", label: "Other" },
] as const;

export function formatProvenanceBadge(provenanceType: ProvenanceType): string {
  return provenanceType.replace(/_/g, " ");
}

export function formatConfidenceBadge(confidenceLevel: ConfidenceLevel): string {
  if (confidenceLevel === "VERIFIED") return "VERIFIED";
  return `${confidenceLevel} CONFIDENCE`;
}

export function confidenceBadgeClass(confidenceLevel: ConfidenceLevel): string {
  switch (confidenceLevel) {
    case "LOW":
      return "evidence-confidence-low";
    case "MEDIUM":
      return "evidence-confidence-medium";
    case "HIGH":
      return "evidence-confidence-high";
    case "VERIFIED":
      return "evidence-confidence-verified";
    default:
      return "evidence-confidence-low";
  }
}

export function provenanceBadgeClass(_provenanceType: ProvenanceType): string {
  return "evidence-provenance";
}

export function formatEvidenceStatus(status: EvidenceStatus): string {
  return status;
}

export function evidenceStatusClass(status: EvidenceStatus): string {
  switch (status) {
    case "DRAFT":
      return "evidence-status-draft";
    case "REVIEWED":
      return "evidence-status-reviewed";
    case "PUBLISHED":
      return "evidence-status-published";
    case "REJECTED":
      return "evidence-status-rejected";
    case "ARCHIVED":
      return "evidence-status-archived";
    default:
      return "evidence-status-draft";
  }
}
