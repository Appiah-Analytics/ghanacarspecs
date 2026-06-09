type ReportReferenceBlockProps = {
  reference: string;
  className?: string;
};

export function ReportReferenceBlock({ reference, className }: ReportReferenceBlockProps) {
  return (
    <p className={className ?? "report-reference"}>
      <span className="report-reference-label">Report Reference</span>
      <span className="mono report-reference-value">{reference}</span>
    </p>
  );
}
