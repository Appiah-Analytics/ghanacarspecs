import type { PartnerInterestStatus } from "@prisma/client";
import {
  formatPartnerInterestStatusLabel,
  partnerInterestStatusClass,
} from "@/lib/partner-interest-options";

type Props = {
  status: PartnerInterestStatus;
};

export function PartnerInterestStatusBadge({ status }: Props) {
  return (
    <span className={`partner-status-badge ${partnerInterestStatusClass(status)}`}>
      {formatPartnerInterestStatusLabel(status)}
    </span>
  );
}
