import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { AdminSignOut } from "@/components/AdminSignOut";
import {
  getAdminDashboardSummary,
  getAdminDataHealth,
  getAdminVehicleRows,
} from "@/lib/admin-dashboard";

export const dynamic = "force-dynamic";

type AdminDashboardPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function displayOptional(value: string | null): string {
  return value?.trim() ? value : "—";
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const params = await searchParams;
  const rawQuery = params.q;
  const searchQuery =
    typeof rawQuery === "string" ? rawQuery.trim() : Array.isArray(rawQuery) ? rawQuery[0]?.trim() ?? "" : "";

  const [summary, health, vehicles] = await Promise.all([
    getAdminDashboardSummary(),
    getAdminDataHealth(),
    getAdminVehicleRows(searchQuery || undefined),
  ]);

  const statCards = [
    { label: "Total vehicles", value: summary.totalVehicles },
    { label: "Total events", value: summary.totalEvents },
    { label: "Accidents / claims", value: summary.vehiclesWithAccidentsOrClaims },
    { label: "With chassis number", value: summary.vehiclesWithChassis },
    { label: "Imported vehicles", value: summary.importedVehicles },
  ];

  return (
    <main className="page">
      <div className="back-row">
        <AdminNav current="dashboard" />
        <span className="back-row-sep" aria-hidden="true">
          ·
        </span>
        <AdminSignOut />
      </div>

      <section className="hero">
        <h1>Admin dashboard</h1>
        <p>
          Overview of GhanaCarSpecs records. Manage vehicles, ingest CSV data, and attach events or visual evidence
          URLs. Access requires the deployment admin secret.
        </p>
      </section>

      <section className="admin-stats" aria-labelledby="admin-stats-heading">
        <h2 id="admin-stats-heading" className="admin-section-title">
          Summary
        </h2>
        <div className="admin-stats-grid">
          {statCards.map((card) => (
            <article key={card.label} className="admin-stat-card">
              <h3>{card.label}</h3>
              <p className="admin-stat-value">{card.value.toLocaleString()}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-stats" aria-labelledby="data-health-heading">
        <h2 id="data-health-heading" className="admin-section-title">
          Data health
        </h2>
        <div className="admin-stats-grid">
          <article className="admin-stat-card">
            <h3>Vehicles</h3>
            <p className="admin-stat-value">{health.vehicles.toLocaleString()}</p>
          </article>
          <article className="admin-stat-card">
            <h3>Events</h3>
            <p className="admin-stat-value">{health.events.toLocaleString()}</p>
          </article>
          <article className="admin-stat-card">
            <h3>Photos</h3>
            <p className="admin-stat-value">{health.photos.toLocaleString()}</p>
          </article>
          <article className="admin-stat-card">
            <h3>Vehicles with VIN</h3>
            <p className="admin-stat-value">{health.vehiclesWithVin.toLocaleString()}</p>
          </article>
          <article className="admin-stat-card">
            <h3>Vehicles with plate</h3>
            <p className="admin-stat-value">{health.vehiclesWithPlateNumber.toLocaleString()}</p>
          </article>
          <article className="admin-stat-card">
            <h3>Vehicles with chassis</h3>
            <p className="admin-stat-value">{health.vehiclesWithChassisNumber.toLocaleString()}</p>
          </article>
          <article className="admin-stat-card">
            <h3>Published evidence</h3>
            <p className="admin-stat-value">{health.publishedEvidence.toLocaleString()}</p>
          </article>
          <article className="admin-stat-card">
            <h3>Draft evidence</h3>
            <p className="admin-stat-value">{health.draftEvidence.toLocaleString()}</p>
          </article>
          <article className="admin-stat-card">
            <h3>Archived evidence</h3>
            <p className="admin-stat-value">{health.archivedEvidence.toLocaleString()}</p>
          </article>
        </div>
      </section>

      <section className="admin-card" aria-labelledby="vehicles-heading">
        <h2 id="vehicles-heading">Vehicles</h2>
        <form className="admin-search" method="get" role="search">
          <label htmlFor="admin-vehicle-search">Search by VIN, plate, or chassis</label>
          <div className="admin-search-row">
            <input
              id="admin-vehicle-search"
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder="Partial match, case insensitive"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" className="btn btn-primary">
              Search
            </button>
            {searchQuery ? (
              <Link href="/admin" className="btn btn-secondary">
                Clear
              </Link>
            ) : null}
          </div>
        </form>
        <p className="admin-help">
          {vehicles.length === 0
            ? searchQuery
              ? `No vehicles match “${searchQuery}”. Try a shorter or different term.`
              : "No vehicles in the database yet. Use CSV ingestion to add records."
            : searchQuery
              ? `${vehicles.length} vehicle(s) matching “${searchQuery}”. Select a row to open the full report.`
              : `${vehicles.length} vehicle(s) in the local database. Select a row to open the full report.`}
        </p>

        {vehicles.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Make</th>
                  <th scope="col">Model</th>
                  <th scope="col">Year</th>
                  <th scope="col">VIN</th>
                  <th scope="col">Chassis</th>
                  <th scope="col">Plate</th>
                  <th scope="col">Events</th>
                  <th scope="col">Latest event</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td>{vehicle.make}</td>
                    <td>{vehicle.model}</td>
                    <td>{vehicle.year}</td>
                    <td className="mono">{vehicle.vin}</td>
                    <td className="mono">{displayOptional(vehicle.chassisNumber)}</td>
                    <td className="mono">{displayOptional(vehicle.plateNumber)}</td>
                    <td>{vehicle.eventCount}</td>
                    <td>{formatDate(vehicle.latestEventDate)}</td>
                    <td className="admin-table-actions">
                      <Link href={`/admin/vehicles/${vehicle.id}`}>Manage</Link>
                      <Link href={`/vehicles/${vehicle.id}`}>View report</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  );
}
