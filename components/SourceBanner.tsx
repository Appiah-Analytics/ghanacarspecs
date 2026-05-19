import { RECORD_SOURCE_LABEL, type RecordSourceKey } from "@/lib/record-source";

type Props = {
  variant: RecordSourceKey;
};

export function SourceBanner({ variant }: Props) {
  const text = RECORD_SOURCE_LABEL[variant];
  return (
    <div className={`source-banner source-banner-${variant}`} role="status">
      <span className="source-banner-label">{text}</span>
      {variant === "external" ? (
        <span className="source-banner-hint">Not stored in GhanaCarSpecs. Specifications from a public VIN registry.</span>
      ) : null}
    </div>
  );
}
