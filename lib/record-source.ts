/** Shared labels for lookup result origin (safe to import from Client Components). */
export const RECORD_SOURCE_LABEL = {
  local: "Local GhanaCarSpecs record",
  external: "External VIN decoded record",
} as const;

export type RecordSourceKey = keyof typeof RECORD_SOURCE_LABEL;
