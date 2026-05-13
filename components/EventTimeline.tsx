import type { VehicleEvent } from "@prisma/client";

function formatEventDate(d: Date): string {
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatEventType(type: string): string {
  return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function EventTimeline({ events }: { events: VehicleEvent[] }) {
  if (events.length === 0) {
    return <p className="timeline-empty">No events recorded for this vehicle.</p>;
  }

  return (
    <ol className="timeline-cards">
      {events.map((e) => (
        <li key={e.id} className="timeline-card">
          <div className="timeline-card-top">
            <span className="event-type-badge">{formatEventType(e.eventType)}</span>
            <time className="event-date" dateTime={e.eventDate.toISOString()}>
              {formatEventDate(e.eventDate)}
            </time>
          </div>
          <dl className="event-fields">
            <div className="event-field">
              <dt>Mileage</dt>
              <dd>{e.mileage != null ? `${e.mileage.toLocaleString()} km` : "Not recorded"}</dd>
            </div>
            <div className="event-field">
              <dt>Source</dt>
              <dd>{e.sourceSystem ?? "Unknown"}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ol>
  );
}
