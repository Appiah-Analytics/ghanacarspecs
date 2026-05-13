import type { VehicleWithEvents } from "@/lib/lookup";
import { EventTimeline } from "@/components/EventTimeline";

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function VehicleReport({ vehicle }: { vehicle: VehicleWithEvents }) {
  return (
    <article className="report">
      <h2>
        {vehicle.year} {vehicle.make} {vehicle.model}
        {vehicle.trim ? ` ${vehicle.trim}` : ""}
      </h2>
      <p className="sub">
        VIN <strong>{vehicle.vin}</strong>
        {vehicle.plateNumber ? (
          <>
            {" "}
            · Plate <strong>{vehicle.plateNumber}</strong>
          </>
        ) : null}
      </p>

      <dl className="spec-grid">
        <div>
          <dt>Engine</dt>
          <dd>
            {[vehicle.engineType, vehicle.engineSize].filter(Boolean).join(" · ") || "—"}
          </dd>
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
          <dt>Recorded events</dt>
          <dd>{vehicle.events.length}</dd>
        </div>
      </dl>

      <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.05rem" }}>History</h3>
      <EventTimeline events={vehicle.events} />

      <div className="cta-muted">
        <strong>Request full report</strong> — coming later; this MVP shows free sample data only.
      </div>
    </article>
  );
}
