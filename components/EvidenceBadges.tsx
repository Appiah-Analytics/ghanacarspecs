import type { ConfidenceLevel, ProvenanceType } from "@prisma/client";
import { ConfidenceHelp } from "@/components/ConfidenceHelp";
import { ProvenanceHelp } from "@/components/ProvenanceHelp";

type Props = {
  provenanceType: ProvenanceType;
  confidenceLevel: ConfidenceLevel;
};

export function EvidenceBadges({ provenanceType, confidenceLevel }: Props) {
  return (
    <div className="evidence-badge-row" aria-label="Evidence provenance and confidence">
      <ProvenanceHelp provenanceType={provenanceType} />
      <ConfidenceHelp confidenceLevel={confidenceLevel} />
    </div>
  );
}
