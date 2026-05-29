import type { ProvenanceType } from "@prisma/client";
import { formatProvenanceBadge, provenanceBadgeClass } from "@/lib/evidence-metadata";
import { PROVENANCE_HELP } from "@/lib/trust-content";

type Props = {
  provenanceType: ProvenanceType;
};

export function ProvenanceHelp({ provenanceType }: Props) {
  const help = PROVENANCE_HELP[provenanceType];

  return (
    <details className="badge-help">
      <summary
        className={`evidence-badge ${provenanceBadgeClass(provenanceType)}`}
        aria-label={`${help.title} provenance. Click for explanation.`}
      >
        {formatProvenanceBadge(provenanceType)}
      </summary>
      <div className="badge-help-panel" role="note">
        <p className="badge-help-title">{help.title}</p>
        <p className="badge-help-text">{help.means}</p>
        <p className="badge-help-caveat">
          <strong>Does not guarantee:</strong> {help.doesNotGuarantee}
        </p>
      </div>
    </details>
  );
}
