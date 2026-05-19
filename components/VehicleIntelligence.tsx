import type { VehicleIntelligence } from "@/lib/vehicle-intelligence";

type Props = {
  intelligence: VehicleIntelligence;
};

function scoreClass(score: number): string {
  if (score >= 70) return "intel-score-good";
  if (score >= 45) return "intel-score-mid";
  return "intel-score-low";
}

export function VehicleIntelligencePanel({ intelligence }: Props) {
  const {
    mileageInconsistency,
    accidentRisk,
    importedVehicle,
    serviceContinuity,
    timelineSummary,
    confidence,
  } = intelligence;

  return (
    <section className="report-section intel-section" aria-labelledby="intel-heading">
      <h3 id="intel-heading" className="report-section-title">
        Vehicle intelligence
      </h3>
      <p className="report-section-lead">
        Derived from recorded GhanaCarSpecs events. Not a legal or insurance assessment.
      </p>

      <div className="intel-grid">
        <article
          className={`intel-card ${confidence.label === "High" ? "intel-card-good" : confidence.label === "Medium" ? "intel-card-mid" : "intel-card-low"}`}
        >
          <h4>History confidence</h4>
          <p className={`intel-score ${scoreClass(confidence.score)}`}>{confidence.score}/100</p>
          <p className="intel-meta">{confidence.label} confidence</p>
          <ul className="intel-factors">
            {confidence.factors.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </article>

        <article
          className={`intel-card ${serviceContinuity.label === "Strong" ? "intel-card-good" : serviceContinuity.label === "Limited" ? "intel-card-warn" : "intel-card-mid"}`}
        >
          <h4>Service continuity</h4>
          <p className={`intel-score ${scoreClass(serviceContinuity.score)}`}>{serviceContinuity.score}/100</p>
          <p className="intel-meta">{serviceContinuity.label}</p>
          <p className="intel-detail">{serviceContinuity.detail}</p>
        </article>

        <article className={`intel-card ${accidentRisk.flagged ? "intel-card-warn" : "intel-card-good"}`}>
          <h4>Accident risk flag</h4>
          <p className="intel-flag">{accidentRisk.flagged ? "Flagged" : "Clear"}</p>
          <p className="intel-detail">{accidentRisk.label}</p>
        </article>

        <article className={`intel-card ${importedVehicle.indicated ? "intel-card-mid" : ""}`}>
          <h4>Imported vehicle</h4>
          <p className="intel-flag">{importedVehicle.indicated ? "Yes" : "Not indicated"}</p>
          <ul className="intel-factors">
            {importedVehicle.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </article>

        <article
          className={`intel-card intel-card-wide ${mileageInconsistency.detected ? "intel-card-warn" : "intel-card-good"}`}
        >
          <h4>Mileage consistency</h4>
          <p className="intel-flag">{mileageInconsistency.detected ? "Inconsistency detected" : "No issues detected"}</p>
          {mileageInconsistency.details.length > 0 ? (
            <ul className="intel-factors">
              {mileageInconsistency.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          ) : (
            <p className="intel-detail">Mileage readings increase logically across dated events.</p>
          )}
        </article>

        <article className="intel-card intel-card-wide">
          <h4>Ownership &amp; event timeline</h4>
          <p className="intel-detail">{timelineSummary}</p>
        </article>
      </div>
    </section>
  );
}
