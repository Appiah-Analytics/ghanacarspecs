import type { ConfidenceLevel } from "@prisma/client";
import { confidenceBadgeClass, formatConfidenceBadge } from "@/lib/evidence-metadata";
import { CONFIDENCE_HELP } from "@/lib/trust-content";

type Props = {
  confidenceLevel: ConfidenceLevel;
};

export function ConfidenceHelp({ confidenceLevel }: Props) {
  const help = CONFIDENCE_HELP[confidenceLevel];

  return (
    <details className="badge-help">
      <summary
        className={`evidence-badge ${confidenceBadgeClass(confidenceLevel)}`}
        aria-label={`${help.title}. Click for explanation.`}
      >
        {formatConfidenceBadge(confidenceLevel)}
      </summary>
      <div className="badge-help-panel" role="note">
        <p className="badge-help-title">{help.title}</p>
        <p className="badge-help-text">{help.summary}</p>
        {help.note ? <p className="badge-help-note">{help.note}</p> : null}
      </div>
    </details>
  );
}
