import type { ConfidenceLevel, ProvenanceType } from "@prisma/client";
import {
  confidenceBadgeClass,
  formatConfidenceBadge,
  formatProvenanceBadge,
  provenanceBadgeClass,
} from "@/lib/evidence-metadata";

type Props = {
  provenanceType: ProvenanceType;
  confidenceLevel: ConfidenceLevel;
};

export function EvidenceBadges({ provenanceType, confidenceLevel }: Props) {
  return (
    <div className="evidence-badge-row" aria-label="Evidence provenance and confidence">
      <span className={`evidence-badge ${provenanceBadgeClass(provenanceType)}`}>{formatProvenanceBadge(provenanceType)}</span>
      <span className={`evidence-badge ${confidenceBadgeClass(confidenceLevel)}`}>
        {formatConfidenceBadge(confidenceLevel)}
      </span>
    </div>
  );
}
