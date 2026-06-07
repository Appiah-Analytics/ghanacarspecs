import type { VehicleExecutiveSummary } from "@/lib/vehicle-executive-summary";

type VehicleExecutiveSummaryProps = {
  summary: VehicleExecutiveSummary;
  variant?: "public" | "admin";
};

export function VehicleExecutiveSummaryPanel({ summary, variant = "public" }: VehicleExecutiveSummaryProps) {
  return (
    <section
      className="report-section vehicle-executive-summary"
      aria-labelledby={variant === "admin" ? "admin-executive-summary-heading" : "executive-summary-heading"}
    >
      <h3
        id={variant === "admin" ? "admin-executive-summary-heading" : "executive-summary-heading"}
        className="report-section-title"
      >
        Executive summary
      </h3>

      <div className="executive-summary-assessment">
        <h4 className="executive-summary-subtitle">Overall assessment</h4>
        <p className="executive-summary-lead">{summary.overallAssessment}</p>
      </div>

      <dl className="executive-summary-status-grid">
        <div>
          <dt>Trust score band</dt>
          <dd>{summary.trustBand}</dd>
        </div>
        <div>
          <dt>Risk profile level</dt>
          <dd>{summary.riskLevel}</dd>
        </div>
        <div>
          <dt>Import status</dt>
          <dd>{summary.importStatus}</dd>
        </div>
        <div>
          <dt>Accident / claim status</dt>
          <dd>{summary.accidentClaimStatus}</dd>
        </div>
        <div>
          <dt>Mileage status</dt>
          <dd>{summary.mileageStatus}</dd>
        </div>
      </dl>

      <div className="executive-summary-block">
        <h4 className="executive-summary-subtitle">Key signals</h4>
        <ul className="plain-list executive-summary-list">
          {summary.keySignals.map((signal) => (
            <li key={signal}>{signal}</li>
          ))}
        </ul>
      </div>

      <div className="executive-summary-block">
        <h4 className="executive-summary-subtitle">Recommended next step</h4>
        <p className="executive-summary-next-step">{summary.recommendedNextStep}</p>
      </div>

      <p className="executive-summary-note" role="note">
        Summary is based on published GhanaCarSpecs evidence only. It is not legal advice or official verification.
      </p>
    </section>
  );
}
