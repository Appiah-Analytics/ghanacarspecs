import type { EvidenceStatus } from "@prisma/client";
import { evidenceStatusClass, formatEvidenceStatus } from "@/lib/evidence-metadata";

type Props = {
  status: EvidenceStatus;
};

export function EvidenceStatusBadge({ status }: Props) {
  return <span className={`evidence-badge ${evidenceStatusClass(status)}`}>{formatEvidenceStatus(status)}</span>;
}
