import type { DuplicateFinding } from "@/lib/duplicate-detection";

export type ImportValidationIssue = {
  row: number;
  field?: string;
  message: string;
};

export type ImportValidationReport = {
  rowsProcessed: number;
  imported: number;
  skipped: number;
  warnings: ImportValidationIssue[];
  errors: ImportValidationIssue[];
};

export function duplicateFindingsToWarnings(findings: DuplicateFinding[]): ImportValidationIssue[] {
  return findings.map((finding) => ({
    row: finding.row ?? 0,
    field: finding.category,
    message: finding.message,
  }));
}

export function buildImportValidationReport(params: {
  totalDataRows: number;
  imported: number;
  skipped: number;
  warnings: ImportValidationIssue[];
  errors: ImportValidationIssue[];
}): ImportValidationReport {
  return {
    rowsProcessed: params.totalDataRows,
    imported: params.imported,
    skipped: params.skipped,
    warnings: params.warnings,
    errors: params.errors,
  };
}
