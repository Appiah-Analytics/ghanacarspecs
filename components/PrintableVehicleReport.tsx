import type { VehicleReportData } from "@/lib/vehicle-report";
import { buildReportExportSummary } from "@/lib/report-export-summary";
import { buildVehicleReportBundle } from "@/lib/vehicle-report-bundle";

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatEventType(type: string): string {
  return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PrintableVehicleReport({ vehicle }: { vehicle: VehicleReportData }) {
  const reportBundle = buildVehicleReportBundle(vehicle);
  const { trustScore, riskProfile, intelligence } = reportBundle;
  const exportSummary = buildReportExportSummary(reportBundle);
  const snapshot = exportSummary.comparisonSnapshot;
  const summary = exportSummary.executiveSummary;

  const lastMileage = vehicle.events.reduce<number | null>((max, ev) => {
    if (ev.mileage == null) return max;
    if (max == null || ev.mileage > max) return ev.mileage;
    return max;
  }, null);

  const trustReasons = trustScore.reasons.slice(1);
  const trustCautions = trustScore.cautions;

  return (
    <article className="print-report">
      <header className="print-report-doc-header">
        <div className="print-report-brand">
          <p className="print-report-brand-name">GhanaCarSpecs</p>
          <p className="print-report-brand-tag">Vehicle intelligence report</p>
        </div>
        <p className="print-report-generated">
          Generated {formatDateTime(exportSummary.generatedAt)}
        </p>
      </header>

      <section className="print-report-section print-report-identity">
        <h1 className="print-report-title">
          {vehicle.year} {vehicle.make} {vehicle.model}
          {vehicle.trim ? ` ${vehicle.trim}` : ""}
        </h1>
        <dl className="print-report-identity-grid">
          <div>
            <dt>VIN</dt>
            <dd className="mono">{vehicle.vin}</dd>
          </div>
          <div>
            <dt>Plate</dt>
            <dd className="mono">{vehicle.plateNumber ?? "—"}</dd>
          </div>
          <div>
            <dt>Chassis</dt>
            <dd className="mono">{vehicle.chassisNumber ?? "—"}</dd>
          </div>
          <div>
            <dt>Report ID</dt>
            <dd className="mono">{vehicle.id}</dd>
          </div>
        </dl>
      </section>

      <section className="print-report-section" aria-labelledby="print-exec-heading">
        <h2 id="print-exec-heading" className="print-report-section-title">
          Executive summary
        </h2>
        <p className="print-report-lead">{summary.overallAssessment}</p>
        <dl className="print-report-status-grid">
          <div>
            <dt>Trust band</dt>
            <dd>{summary.trustBand}</dd>
          </div>
          <div>
            <dt>Risk level</dt>
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
        <h3 className="print-report-subtitle">Key signals</h3>
        <ul className="print-report-list">
          {summary.keySignals.map((signal) => (
            <li key={signal}>{signal}</li>
          ))}
        </ul>
        <h3 className="print-report-subtitle">Recommended next step</h3>
        <p className="print-report-text">{summary.recommendedNextStep}</p>
      </section>

      <section className="print-report-section" aria-labelledby="print-scores-heading">
        <h2 id="print-scores-heading" className="print-report-section-title">
          Trust score and risk profile
        </h2>
        <dl className="print-report-score-row">
          <div>
            <dt>Trust score</dt>
            <dd>
              {exportSummary.trustScore} / 100 ({exportSummary.trustBand})
            </dd>
          </div>
          <div>
            <dt>Risk profile</dt>
            <dd>
              {exportSummary.riskScore} / 100 ({exportSummary.riskLevel})
            </dd>
          </div>
        </dl>
        {trustReasons.length > 0 ? (
          <>
            <h3 className="print-report-subtitle">Trust score — why</h3>
            <ul className="print-report-list">
              {trustReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </>
        ) : null}
        {trustCautions.length > 0 ? (
          <>
            <h3 className="print-report-subtitle">Trust score — caution</h3>
            <ul className="print-report-list">
              {trustCautions.map((caution) => (
                <li key={caution}>{caution}</li>
              ))}
            </ul>
          </>
        ) : null}
        {riskProfile.riskFactors.length > 0 ? (
          <>
            <h3 className="print-report-subtitle">Risk factors</h3>
            <ul className="print-report-list">
              {riskProfile.riskFactors.map((factor) => (
                <li key={factor}>{factor}</li>
              ))}
            </ul>
          </>
        ) : null}
        {riskProfile.positiveSignals.length > 0 ? (
          <>
            <h3 className="print-report-subtitle">Positive signals</h3>
            <ul className="print-report-list">
              {riskProfile.positiveSignals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          </>
        ) : null}
        {riskProfile.recommendations.length > 0 ? (
          <>
            <h3 className="print-report-subtitle">Recommendations</h3>
            <ul className="print-report-list">
              {riskProfile.recommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      <section className="print-report-section" aria-labelledby="print-specs-heading">
        <h2 id="print-specs-heading" className="print-report-section-title">
          Vehicle specifications
        </h2>
        <dl className="print-report-spec-grid">
          <div>
            <dt>Year</dt>
            <dd>{vehicle.year}</dd>
          </div>
          <div>
            <dt>Make</dt>
            <dd>{vehicle.make}</dd>
          </div>
          <div>
            <dt>Model</dt>
            <dd>{vehicle.model}</dd>
          </div>
          <div>
            <dt>Trim</dt>
            <dd>{vehicle.trim ?? "—"}</dd>
          </div>
          <div>
            <dt>Engine</dt>
            <dd>{[vehicle.engineType, vehicle.engineSize].filter(Boolean).join(" · ") || "—"}</dd>
          </div>
          <div>
            <dt>Fuel</dt>
            <dd>{vehicle.fuelType ?? "—"}</dd>
          </div>
          <div>
            <dt>Country of origin</dt>
            <dd>{vehicle.countryOfOrigin ?? "—"}</dd>
          </div>
          <div>
            <dt>Import date</dt>
            <dd>{formatDate(vehicle.importDate)}</dd>
          </div>
          <div>
            <dt>Last known mileage</dt>
            <dd>{lastMileage != null ? `${lastMileage.toLocaleString()} km` : "—"}</dd>
          </div>
          <div>
            <dt>Published events</dt>
            <dd>{snapshot.eventCount}</dd>
          </div>
          <div>
            <dt>Published photos</dt>
            <dd>{snapshot.photoCount}</dd>
          </div>
        </dl>
      </section>

      <section className="print-report-section" aria-labelledby="print-intel-heading">
        <h2 id="print-intel-heading" className="print-report-section-title">
          Intelligence signals
        </h2>
        <dl className="print-report-spec-grid">
          <div>
            <dt>History confidence</dt>
            <dd>
              {intelligence.confidence.score}/100 ({intelligence.confidence.label})
            </dd>
          </div>
          <div>
            <dt>Service continuity</dt>
            <dd>
              {intelligence.serviceContinuity.score}/100 ({intelligence.serviceContinuity.label})
            </dd>
          </div>
          <div>
            <dt>Imported vehicle</dt>
            <dd>{snapshot.importedVehicle ? "Indicated" : "Not indicated"}</dd>
          </div>
          <div>
            <dt>Mileage issue</dt>
            <dd>{snapshot.mileageIssue ? "Possible inconsistency" : "None detected"}</dd>
          </div>
          <div>
            <dt>Accident events</dt>
            <dd>{snapshot.accidentCount}</dd>
          </div>
          <div>
            <dt>Insurance claim events</dt>
            <dd>{snapshot.insuranceClaimCount}</dd>
          </div>
          <div>
            <dt>Theft events</dt>
            <dd>{snapshot.theftCount}</dd>
          </div>
        </dl>
      </section>

      <section className="print-report-section" aria-labelledby="print-history-heading">
        <h2 id="print-history-heading" className="print-report-section-title">
          Published event history
        </h2>
        {vehicle.events.length === 0 ? (
          <p className="print-report-text">No published timeline events are available.</p>
        ) : (
          <table className="print-report-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Type</th>
                <th scope="col">Mileage</th>
                <th scope="col">Source</th>
              </tr>
            </thead>
            <tbody>
              {vehicle.events.map((event) => (
                <tr key={event.id}>
                  <td>{formatDate(event.eventDate)}</td>
                  <td>{formatEventType(event.eventType)}</td>
                  <td>{event.mileage != null ? `${event.mileage.toLocaleString()} km` : "—"}</td>
                  <td>{event.sourceSystem ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {vehicle.photos.length > 0 ? (
          <p className="print-report-note">
            {vehicle.photos.length} published visual evidence item
            {vehicle.photos.length === 1 ? "" : "s"} on file. View the full report online for photos.
          </p>
        ) : null}
      </section>

      <footer className="print-report-footer">
        <p className="print-report-disclaimer">{exportSummary.disclaimer}</p>
        <p className="print-report-disclaimer">
          Based on published GhanaCarSpecs evidence only. Not legal advice, ownership proof, or official government
          verification.
        </p>
      </footer>
    </article>
  );
}
