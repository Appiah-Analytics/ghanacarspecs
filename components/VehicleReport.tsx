import type { VehicleWithEvents } from "@/lib/lookup";
import { analyzeVehicleIntelligence } from "@/lib/vehicle-intelligence";
import { EventTimeline } from "@/components/EventTimeline";
import { SourceBanner } from "@/components/SourceBanner";
import { VehicleIntelligencePanel } from "@/components/VehicleIntelligence";

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function VehicleReport({ vehicle }: { vehicle: VehicleWithEvents }) {
  const intelligence = analyzeVehicleIntelligence({
    year: vehicle.year,
    countryOfOrigin: vehicle.countryOfOrigin,
    importDate: vehicle.importDate,
    events: vehicle.events,
  });

  const lastMileage = vehicle.events.reduce<number | null>((max, ev) => {
    if (ev.mileage == null) return max;
    if (max == null || ev.mileage > max) return ev.mileage;
    return max;
  }, null);

  return (
    <article className="report">
      <SourceBanner variant="local" />
      <header className="report-header">
        <h2 className="report-title">
          {vehicle.year} {vehicle.make} {vehicle.model}
          {vehicle.trim ? ` ${vehicle.trim}` : ""}
        </h2>
        <p className="report-sub">
          Identifiers: VIN <span className="mono">{vehicle.vin}</span>
          {vehicle.plateNumber ? (
            <>
              {" "}
              &middot; Plate <span className="mono">{vehicle.plateNumber}</span>
            </>
          ) : (
            <> &middot; No plate on file</>
          )}
        </p>
      </header>

      <section className="report-section" aria-labelledby="specs-heading">
        <h3 id="specs-heading" className="report-section-title">
          Vehicle specifications
        </h3>
        <dl className="spec-grid">
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
            <dd>{vehicle.trim ?? "-"}</dd>
          </div>
          <div>
            <dt>VIN</dt>
            <dd className="mono">{vehicle.vin}</dd>
          </div>
          <div>
            <dt>Plate</dt>
            <dd className="mono">{vehicle.plateNumber ?? "-"}</dd>
          </div>
          <div>
            <dt>Engine</dt>
            <dd>{[vehicle.engineType, vehicle.engineSize].filter(Boolean).join(" · ") || "-"}</dd>
          </div>
          <div>
            <dt>Fuel</dt>
            <dd>{vehicle.fuelType ?? "-"}</dd>
          </div>
          <div>
            <dt>Country of origin</dt>
            <dd>{vehicle.countryOfOrigin ?? "-"}</dd>
          </div>
          <div>
            <dt>Import date</dt>
            <dd>{formatDate(vehicle.importDate)}</dd>
          </div>
          <div>
            <dt>Recorded events</dt>
            <dd>{vehicle.events.length}</dd>
          </div>
          <div>
            <dt>Last known mileage</dt>
            <dd>{lastMileage != null ? `${lastMileage.toLocaleString()} km` : "-"}</dd>
          </div>
        </dl>
      </section>

      <VehicleIntelligencePanel intelligence={intelligence} />

      <section className="report-section" aria-labelledby="history-heading">
        <h3 id="history-heading" className="report-section-title">
          Event history
        </h3>
        <p className="report-section-lead">Newest events first. Each row shows date, mileage, and reporting source.</p>
        <EventTimeline events={vehicle.events} />
      </section>

      <div className="cta-muted">
        <strong>Request full report</strong> - coming later; this MVP shows free sample data only.
      </div>
    </article>
  );
}
