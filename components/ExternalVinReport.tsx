import type { ExternalVinSpecs } from "@/lib/nhtsa-vin";
import { SourceBanner } from "@/components/SourceBanner";

const SPEC_ROWS: { key: keyof ExternalVinSpecs; label: string }[] = [
  { key: "modelYear", label: "Model year" },
  { key: "make", label: "Make" },
  { key: "model", label: "Model" },
  { key: "trim", label: "Trim" },
  { key: "series", label: "Series" },
  { key: "bodyClass", label: "Body class" },
  { key: "vehicleType", label: "Vehicle type" },
  { key: "driveType", label: "Drive type" },
  { key: "fuelTypePrimary", label: "Fuel type" },
  { key: "displacementL", label: "Displacement (L)" },
  { key: "engineCylinders", label: "Engine cylinders" },
  { key: "engineModel", label: "Engine model" },
  { key: "doors", label: "Doors" },
  { key: "transmissionStyle", label: "Transmission" },
  { key: "manufacturerName", label: "Manufacturer" },
  { key: "plantCountry", label: "Plant country" },
  { key: "plantCity", label: "Plant city" },
  { key: "plantState", label: "Plant state" },
];

type Props = {
  vin: string;
  specs: ExternalVinSpecs;
  dataProvider: string;
};

export function ExternalVinReport({ vin, specs, dataProvider }: Props) {
  return (
    <article className="report">
      <SourceBanner variant="external" />
      <header className="report-header">
        <h2 className="report-title">
          {[specs.modelYear, specs.make, specs.model].filter(Boolean).join(" ") || "Decoded vehicle"}
        </h2>
        <p className="report-sub">
          VIN <span className="mono">{vin}</span>
          <span className="report-sub-sep">&middot;</span>
          Data provider: <strong>{dataProvider}</strong>
        </p>
      </header>

      <section className="report-section" aria-labelledby="ext-specs-heading">
        <h3 id="ext-specs-heading" className="report-section-title">
          Specifications (external registry)
        </h3>
        <p className="report-section-lead">
          Values come from the public VIN decoder only. GhanaCarSpecs has no history or mileage for this vehicle.
        </p>
        <dl className="spec-grid">
          {SPEC_ROWS.map(({ key, label }) => {
            const val = specs[key];
            if (val == null || val === "") return null;
            return (
              <div key={key}>
                <dt>{label}</dt>
                <dd>{val}</dd>
              </div>
            );
          })}
        </dl>
        {!SPEC_ROWS.some(({ key }) => {
          const v = specs[key];
          return v != null && v !== "";
        }) ? (
          <p className="timeline-empty">No specification fields were returned for this VIN.</p>
        ) : null}
      </section>

      <section className="report-section" aria-labelledby="ext-history-heading">
        <h3 id="ext-history-heading" className="report-section-title">
          Event history
        </h3>
        <p className="timeline-empty">No GhanaCarSpecs events for this VIN. Import this vehicle into the database in a future release to see a timeline here.</p>
      </section>
    </article>
  );
}
