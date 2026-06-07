import type { VehicleComparisonSnapshot } from "@/lib/vehicle-comparison";

const TRUST_DELTA = 5;
const RISK_DELTA = 8;
const EVIDENCE_LOW_THRESHOLD = 2;

/** Cautious side-by-side interpretation — not legal conclusions. */
export function buildComparisonInterpretation(
  sideA: VehicleComparisonSnapshot | null,
  sideB: VehicleComparisonSnapshot | null,
): string[] {
  if (!sideA || !sideB) {
    return [];
  }

  const lines: string[] = [];

  if (sideA.trustScore - sideB.trustScore >= TRUST_DELTA) {
    lines.push("Vehicle A has stronger record completeness based on available published evidence.");
  } else if (sideB.trustScore - sideA.trustScore >= TRUST_DELTA) {
    lines.push("Vehicle B has stronger record completeness based on available published evidence.");
  } else {
    lines.push("Both vehicles show similar record completeness on available published evidence.");
  }

  if (sideA.riskScore - sideB.riskScore >= RISK_DELTA) {
    lines.push("Vehicle A shows more visible risk indicators in the published timeline.");
  } else if (sideB.riskScore - sideA.riskScore >= RISK_DELTA) {
    lines.push("Vehicle B shows more visible risk indicators in the published timeline.");
  } else {
    lines.push("Both vehicles show a similar level of visible risk indicators on published evidence.");
  }

  const aLimited =
    sideA.eventCount + sideA.photoCount <= EVIDENCE_LOW_THRESHOLD;
  const bLimited =
    sideB.eventCount + sideB.photoCount <= EVIDENCE_LOW_THRESHOLD;

  if (aLimited && bLimited) {
    lines.push("Both vehicles have limited published evidence — treat comparison as indicative only.");
  } else if (aLimited) {
    lines.push("Vehicle A has limited published evidence compared with Vehicle B.");
  } else if (bLimited) {
    lines.push("Vehicle B has limited published evidence compared with Vehicle A.");
  }

  if (sideA.accidentCount > 0 && sideB.accidentCount === 0) {
    lines.push("Vehicle A includes accident-related timeline events; review evidence carefully.");
  } else if (sideB.accidentCount > 0 && sideA.accidentCount === 0) {
    lines.push("Vehicle B includes accident-related timeline events; review evidence carefully.");
  }

  lines.push("Request independent inspection before purchase — GhanaCarSpecs does not verify DVLA, police, or insurer records.");

  return lines;
}
