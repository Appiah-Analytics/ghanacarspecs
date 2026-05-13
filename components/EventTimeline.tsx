import type { VehicleEvent } from "@prisma/client";

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function EventTimeline({ events }: { events: VehicleEvent[] }) {
  if (events.length === 0) {
    return <p style={{ color: "var(--muted)", margin: 0 }}>No events recorded.</p>;
  }

  return (
    <ol className="timeline">
      {events.map((e) => (
        <li key={e.id}>
          <div className="meta">
            <span className="type">{e.eventType.replace(/_/g, " ")}</span>
            <span>{formatDate(e.eventDate)}</span>
            {e.mileage != null ? <span>{e.mileage.toLocaleString()} km</span> : null}
          </div>
          {e.sourceSystem ? <div style={{ fontSize: "0.95rem" }}>{e.sourceSystem}</div> : null}
        </li>
      ))}
    </ol>
  );
}
