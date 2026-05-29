import type { ConfidenceLevel, ProvenanceType } from "@prisma/client";

export type ConfidenceHelpContent = {
  title: string;
  summary: string;
  note?: string;
};

export type ProvenanceHelpContent = {
  title: string;
  means: string;
  doesNotGuarantee: string;
};

export const CONFIDENCE_HELP: Record<ConfidenceLevel, ConfidenceHelpContent> = {
  LOW: {
    title: "Low confidence",
    summary: "Limited supporting evidence. Treat as indicative only until more records are available.",
  },
  MEDIUM: {
    title: "Medium confidence",
    summary: "Multiple supporting signals suggest the record is plausible, but gaps may remain.",
  },
  HIGH: {
    title: "High confidence",
    summary: "Strong supporting evidence and traceability. Still not a substitute for independent verification.",
  },
  VERIFIED: {
    title: "Verified",
    summary: "Reviewed evidence with strong traceability within GhanaCarSpecs workflows.",
    note: "VERIFIED does not mean legal certification, government validation, or official DVLA confirmation.",
  },
};

export const PROVENANCE_HELP: Record<ProvenanceType, ProvenanceHelpContent> = {
  DEMO: {
    title: "Demo / sample",
    means: "Placeholder or demonstration material for product testing.",
    doesNotGuarantee: "Not real-world evidence and not an official record.",
  },
  IMPORTER: {
    title: "Importer",
    means: "Information attributed to a vehicle importer or import workflow.",
    doesNotGuarantee: "Not customs clearance proof or DVLA registration confirmation.",
  },
  DEALER: {
    title: "Dealer",
    means: "Information from a dealer or showroom context.",
    doesNotGuarantee: "Not manufacturer warranty status or independent inspection certification.",
  },
  AUCTION: {
    title: "Auction",
    means: "Information linked to auction or pre-export listing context.",
    doesNotGuarantee: "Auction data may be incomplete and may not reflect post-import condition in Ghana.",
  },
  USER_SUBMITTED: {
    title: "User submitted",
    means: "Submitted by a user or operator through GhanaCarSpecs channels.",
    doesNotGuarantee: "May require review; submission alone does not prove accuracy.",
  },
  GOVERNMENT: {
    title: "Government",
    means: "Labeled as government-related source category.",
    doesNotGuarantee: "Does not automatically imply official confirmation or live registry integration.",
  },
  INSURER: {
    title: "Insurer",
    means: "Attributed to an insurer or insurance-related process.",
    doesNotGuarantee: "Not a claim file, payout decision, or policy verification.",
  },
  POLICE: {
    title: "Police",
    means: "Attributed to police or incident-reporting context.",
    doesNotGuarantee: "Not a police report, court finding, or criminal record verification.",
  },
  INTERNAL: {
    title: "Internal",
    means: "Captured or curated inside GhanaCarSpecs operations.",
    doesNotGuarantee: "Internal labeling is not third-party certification.",
  },
  OTHER: {
    title: "Other",
    means: "Source does not match a standard category.",
    doesNotGuarantee: "Category alone does not establish reliability.",
  },
};

export const TRANSPARENCY_STATEMENT =
  "GhanaCarSpecs aggregates available vehicle evidence and metadata from multiple sources. Confidence levels reflect evidence quality and traceability, not legal certainty or ownership verification.";

export const VISIBILITY_RULES = [
  "Only published evidence appears on public vehicle reports.",
  "Draft, reviewed-but-unpublished, rejected, and archived items are hidden from public view.",
  "Moderation may change visibility without altering underlying storage history.",
];

export const VERIFICATION_CAPABILITIES = [
  "Vehicle specifications (from local records or external VIN decode)",
  "Evidence tracking (photos and timeline events)",
  "Provenance labeling (source category on each item)",
  "Confidence scoring (estimated reliability, not legal proof)",
  "Moderation review (publish / archive workflow)",
] as const;

export const VERIFICATION_NOT_YET = [
  "DVLA integration",
  "Insurance claim integration",
  "Police incident integration",
  "Ownership verification",
  "Official government certification",
] as const;
