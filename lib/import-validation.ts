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
  eventsInserted: number;
  eventsSkipped: number;
  duplicateEventsSkipped: number;
  vehiclesCreated: number;
  vehiclesUpdated: number;
  warnings: ImportValidationIssue[];
  errors: ImportValidationIssue[];
  mode: "preview" | "commit";
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
  eventsInserted: number;
  eventsSkipped: number;
  duplicateEventsSkipped: number;
  vehiclesCreated: number;
  vehiclesUpdated: number;
  warnings: ImportValidationIssue[];
  errors: ImportValidationIssue[];
  mode: "preview" | "commit";
}): ImportValidationReport {
  return {
    rowsProcessed: params.totalDataRows,
    imported: params.imported,
    skipped: params.skipped,
    eventsInserted: params.eventsInserted,
    eventsSkipped: params.eventsSkipped,
    duplicateEventsSkipped: params.duplicateEventsSkipped,
    vehiclesCreated: params.vehiclesCreated,
    vehiclesUpdated: params.vehiclesUpdated,
    warnings: params.warnings,
    errors: params.errors,
    mode: params.mode,
  };
}
