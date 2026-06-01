import type { DuplicateFinding } from "@/lib/duplicate-detection";

export type ImportQualityStatus = "Excellent" | "Good" | "Needs Review" | "Poor";

export type ImportQualityResult = {
  score: number;
  status: ImportQualityStatus;
};

export type ImportQualityRow = {
  vin: string;
  plateNumber: string | null;
  chassisNumber: string | null;
  make: string;
  model: string;
};

const PENALTY = {
  missingVin: 20,
  missingChassis: 3,
  missingMakeModel: 15,
  duplicateVinHigh: 12,
  duplicateVinPossible: 0,
  duplicatePlate: 6,
  duplicateChassis: 6,
} as const;

function qualityStatusForScore(score: number): ImportQualityStatus {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 50) return "Needs Review";
  return "Poor";
}

function countFindings(findings: DuplicateFinding[], confidence: DuplicateFinding["confidence"], category: DuplicateFinding["category"]): number {
  const seen = new Set<string>();
  for (const finding of findings) {
    if (finding.confidence === confidence && finding.category === category) {
      seen.add(finding.value);
    }
  }
  return seen.size;
}

/**
 * Quality score 0–100 from row completeness and duplicate findings.
 * Penalizes missing VIN/chassis/make-model and duplicate VIN/plate/chassis signals.
 */
export function calculateImportQualityScore(params: {
  totalDataRows: number;
  rows: ImportQualityRow[];
  duplicateFindings: DuplicateFinding[];
  invalidRowCount: number;
}): ImportQualityResult {
  const { totalDataRows, rows, duplicateFindings, invalidRowCount } = params;
  const denominator = Math.max(1, totalDataRows);

  let penalty = 0;

  for (const row of rows) {
    if (!row.vin.trim()) penalty += PENALTY.missingVin;
    if (!row.chassisNumber?.trim()) penalty += PENALTY.missingChassis;
    if (!row.make.trim() || !row.model.trim()) penalty += PENALTY.missingMakeModel;
  }

  penalty += invalidRowCount * PENALTY.missingVin;

  penalty += countFindings(duplicateFindings, "high", "vin") * PENALTY.duplicateVinHigh;
  penalty += countFindings(duplicateFindings, "possible", "plate") * PENALTY.duplicatePlate;
  penalty += countFindings(duplicateFindings, "possible", "chassis") * PENALTY.duplicateChassis;

  const normalizedPenalty = (penalty / denominator) * 10;
  const score = Math.round(Math.max(0, Math.min(100, 100 - normalizedPenalty)));

  return {
    score,
    status: qualityStatusForScore(score),
  };
}
