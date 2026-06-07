import Link from "next/link";
import type { VehicleComparisonSide } from "@/lib/resolve-vehicle-comparison";
import type { VehicleComparisonSnapshot } from "@/lib/vehicle-comparison";
import { buildComparisonInterpretation } from "@/lib/vehicle-comparison-interpret";

type VehicleComparisonProps = {
  sideA: VehicleComparisonSide;
  sideB: VehicleComparisonSide;
};

function formatOptional(value: string | null): string {
  return value?.trim() ? value : "—";
}

function formatBool(value: boolean, yes: string, no: string): string {
  return value ? yes : no;
}

function ComparisonColumn({
  title,
  side,
  missingMessage,
}: {
  title: string;
  side: VehicleComparisonSide;
  missingMessage: string;
}) {
  const snapshot = side.snapshot;

  if (!snapshot) {
    return (
      <article className="compare-column compare-column-missing">
        <h3>{title}</h3>
        <p className="compare-missing-query">
          Identifier: <span className="mono">{side.query || "—"}</span>
        </p>
        <p className="alert error compare-missing-alert" role="alert">
          {missingMessage}
        </p>
      </article>
    );
  }

  return (
    <article className="compare-column">
      <h3>{title}</h3>
      <p className="compare-column-label">{snapshot.label}</p>
      <p className="compare-report-link">
        <Link href={`/vehicles/${snapshot.vehicleId}`}>View full report</Link>
      </p>

      <ComparisonSection title="Identity">
        <ComparisonRow label="VIN" value={snapshot.vin} mono />
        <ComparisonRow label="Plate" value={formatOptional(snapshot.plateNumber)} mono />
        <ComparisonRow label="Chassis" value={formatOptional(snapshot.chassisNumber)} mono />
      </ComparisonSection>

      <ComparisonSection title="Scores">
        <ComparisonRow label="Trust score" value={`${snapshot.trustScore} / 100 (${snapshot.trustBand})`} />
        <ComparisonRow label="Risk score" value={`${snapshot.riskScore} / 100 (${snapshot.riskLevel})`} />
      </ComparisonSection>

      <ComparisonSection title="Evidence">
        <ComparisonRow label="Timeline events" value={String(snapshot.eventCount)} />
        <ComparisonRow label="Visual evidence" value={String(snapshot.photoCount)} />
        <ComparisonRow label="Accident events" value={String(snapshot.accidentCount)} />
        <ComparisonRow label="Insurance claims" value={String(snapshot.insuranceClaimCount)} />
        <ComparisonRow label="Theft events" value={String(snapshot.theftCount)} />
      </ComparisonSection>

      <ComparisonSection title="Signals">
        <ComparisonRow
          label="Imported vehicle"
          value={formatBool(snapshot.importedVehicle, "Indicated", "Not indicated")}
        />
        <ComparisonRow
          label="Mileage issue"
          value={formatBool(snapshot.mileageIssue, "Possible concern", "None detected")}
        />
        <ComparisonRow label="Service continuity" value={String(snapshot.serviceContinuityScore)} />
        <ComparisonRow label="History confidence" value={String(snapshot.historyConfidenceScore)} />
      </ComparisonSection>
    </article>
  );
}

function ComparisonSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="compare-section">
      <h4 className="compare-section-title">{title}</h4>
      <dl className="compare-rows">{children}</dl>
    </div>
  );
}

function ComparisonRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="compare-row">
      <dt>{label}</dt>
      <dd className={mono ? "mono" : undefined}>{value}</dd>
    </div>
  );
}

export function VehicleComparison({ sideA, sideB }: VehicleComparisonProps) {
  const bothFound = Boolean(sideA.snapshot && sideB.snapshot);
  const interpretation = buildComparisonInterpretation(sideA.snapshot, sideB.snapshot);

  return (
    <div className="compare-results">
      {!bothFound ? (
        <div className="compare-missing-summary" role="status">
          {!sideA.snapshot && sideA.query ? <p>Vehicle A was not found.</p> : null}
          {!sideB.snapshot && sideB.query ? <p>Vehicle B was not found.</p> : null}
          <p className="admin-help">
            Check identifiers and try again. Only local GhanaCarSpecs records can be compared (not external NHTSA-only
            decodes).
          </p>
        </div>
      ) : null}

      <div className="compare-columns">
        <ComparisonColumn title="Vehicle A" side={sideA} missingMessage="Vehicle A was not found." />
        <ComparisonColumn title="Vehicle B" side={sideB} missingMessage="Vehicle B was not found." />
      </div>

      {bothFound && interpretation.length > 0 ? (
        <section className="compare-interpretation admin-card" aria-labelledby="compare-interpretation-heading">
          <h2 id="compare-interpretation-heading">Comparison summary</h2>
          <ul className="plain-list compare-interpretation-list">
            {interpretation.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export type { VehicleComparisonSnapshot };
