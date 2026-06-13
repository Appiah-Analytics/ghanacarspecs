import { PartnerInterestStatus, PartnerType } from "@prisma/client";

export const PARTNER_INTEREST_STATUS_OPTIONS: { value: PartnerInterestStatus; label: string }[] = [
  { value: PartnerInterestStatus.NEW, label: "New" },
  { value: PartnerInterestStatus.CONTACTED, label: "Contacted" },
  { value: PartnerInterestStatus.QUALIFIED, label: "Qualified" },
  { value: PartnerInterestStatus.NOT_A_FIT, label: "Not a fit" },
  { value: PartnerInterestStatus.DEFERRED, label: "Deferred" },
];

const PARTNER_INTEREST_STATUS_LABELS = Object.fromEntries(
  PARTNER_INTEREST_STATUS_OPTIONS.map((option) => [option.value, option.label]),
) as Record<PartnerInterestStatus, string>;

export function formatPartnerInterestStatusLabel(status: PartnerInterestStatus): string {
  return PARTNER_INTEREST_STATUS_LABELS[status] ?? status;
}

export function partnerInterestStatusClass(status: PartnerInterestStatus): string {
  switch (status) {
    case PartnerInterestStatus.NEW:
      return "partner-status-new";
    case PartnerInterestStatus.CONTACTED:
      return "partner-status-contacted";
    case PartnerInterestStatus.QUALIFIED:
      return "partner-status-qualified";
    case PartnerInterestStatus.NOT_A_FIT:
      return "partner-status-not-a-fit";
    default:
      return "partner-status-deferred";
  }
}

export const PARTNER_TYPE_OPTIONS: { value: PartnerType; label: string }[] = [
  { value: PartnerType.GARAGE, label: "Garage / workshop" },
  { value: PartnerType.DEALER, label: "Dealer" },
  { value: PartnerType.IMPORTER, label: "Importer" },
  { value: PartnerType.FLEET_OPERATOR, label: "Fleet operator" },
  { value: PartnerType.INSURER, label: "Insurer" },
  { value: PartnerType.LENDER, label: "Lender / finance" },
  { value: PartnerType.SERVICE_PROVIDER, label: "Service provider" },
  { value: PartnerType.OTHER, label: "Other ecosystem participant" },
];

export const MONTHLY_VEHICLE_VOLUME_OPTIONS = [
  { value: "", label: "Prefer not to say" },
  { value: "UNDER_10", label: "Under 10 vehicles / month" },
  { value: "10_TO_50", label: "10–50 vehicles / month" },
  { value: "51_TO_200", label: "51–200 vehicles / month" },
  { value: "OVER_200", label: "Over 200 vehicles / month" },
] as const;

const PARTNER_TYPE_LABELS = Object.fromEntries(
  PARTNER_TYPE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<PartnerType, string>;

const VOLUME_LABELS: Record<string, string> = {
  UNDER_10: "Under 10 / month",
  "10_TO_50": "10–50 / month",
  "51_TO_200": "51–200 / month",
  OVER_200: "Over 200 / month",
};

export function formatPartnerTypeLabel(type: PartnerType): string {
  return PARTNER_TYPE_LABELS[type] ?? type;
}

export function formatMonthlyVehicleVolumeLabel(value: string | null | undefined): string {
  if (!value?.trim()) return "—";
  return VOLUME_LABELS[value] ?? value;
}
