import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminAddEventForm } from "@/components/AdminAddEventForm";
import { AdminAddPhotoForm } from "@/components/AdminAddPhotoForm";
import { AdminNav } from "@/components/AdminNav";
import { AdminSignOut } from "@/components/AdminSignOut";
import { EventTimeline } from "@/components/EventTimeline";
import { formatPhotoSource } from "@/lib/photo-source";
import { getAdminVehicleManage } from "@/lib/admin-vehicle-manage";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ photo?: string; event?: string }>;
};

function formatIdentityDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminVehicleManagePage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const vehicle = await getAdminVehicleManage(id);

  if (!vehicle) notFound();

  const photoAdded = query.photo === "added";
  const eventAdded = query.event === "added";

  return (
    <main className="page">
      <div className="back-row">
        <AdminNav current="manage" />
        <span className="back-row-sep" aria-hidden="true">
          ·
        </span>
        <Link href="/admin">Back to dashboard</Link>
        <span className="back-row-sep" aria-hidden="true">
          ·
        </span>
        <Link href={`/vehicles/${vehicle.id}`}>Public report</Link>
        <span className="back-row-sep" aria-hidden="true">
          ·
        </span>
        <AdminSignOut />
      </div>

      <section className="hero">
        <h1>
          Manage vehicle — {vehicle.year} {vehicle.make} {vehicle.model}
        </h1>
        <p>Add timeline events and visual evidence URLs for this local GhanaCarSpecs record.</p>
      </section>

      <p className="admin-provenance-note" role="note">
        Only add information from sources you can explain. Do not enter police, insurer, DVLA, or private claim data
        unless GhanaCarSpecs has explicit authorization.
      </p>

      {photoAdded ? (
        <p className="alert alert-not-found" role="status">
          Visual evidence URL added. Check the list below or open the public report.
        </p>
      ) : null}
      {eventAdded ? (
        <p className="alert alert-not-found" role="status">
          Timeline event added. Check the event list below or open the public report.
        </p>
      ) : null}

      <section className="admin-card" aria-labelledby="identity-heading">
        <h2 id="identity-heading">Vehicle identity</h2>
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
            <dd>{vehicle.trim ?? "—"}</dd>
          </div>
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
            <dt>Import date</dt>
            <dd>{formatIdentityDate(vehicle.importDate)}</dd>
          </div>
        </dl>
      </section>

      <section className="admin-card" aria-labelledby="photos-list-heading">
        <h2 id="photos-list-heading">Current visual evidence ({vehicle.photos.length})</h2>
        {vehicle.photos.length === 0 ? (
          <p className="admin-help">No photos on file yet. Add a URL below (e.g. an existing /demo-photos/ asset).</p>
        ) : (
          <ul className="admin-record-list">
            {vehicle.photos.map((photo) => (
              <li key={photo.id}>
                <p className="admin-record-list-title">
                  <a href={photo.url} target="_blank" rel="noopener noreferrer">
                    {photo.url}
                  </a>
                </p>
                <p className="admin-record-list-meta">
                  {photo.caption} · {formatPhotoSource(photo.sourceType, photo.sourceLabel)}
                  {photo.takenAt ? ` · ${formatIdentityDate(photo.takenAt)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-card" aria-labelledby="add-photo-heading">
        <h2 id="add-photo-heading">Add visual evidence URL</h2>
        <p className="admin-help">
          Link to a hosted image path. For demos, use placeholders under <span className="mono">/demo-photos/</span>.
        </p>
        <AdminAddPhotoForm vehicleId={vehicle.id} />
      </section>

      <section className="admin-card" aria-labelledby="events-list-heading">
        <h2 id="events-list-heading">Current events ({vehicle.events.length})</h2>
        <EventTimeline events={vehicle.events} />
      </section>

      <section className="admin-card" aria-labelledby="add-event-heading">
        <h2 id="add-event-heading">Add timeline event</h2>
        <p className="admin-help">Creates a new row on this vehicle&apos;s public event history.</p>
        <AdminAddEventForm vehicleId={vehicle.id} />
      </section>
    </main>
  );
}
