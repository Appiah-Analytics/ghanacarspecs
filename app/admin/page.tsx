import Link from "next/link";
import { AdminSignOut } from "@/components/AdminSignOut";
import { getAdminDashboardSummary, getAdminVehicleRows } from "@/lib/admin-dashboard";

export const dynamic = "force-dynamic";

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

export default async function AdminDashboardPage() {
  const [summary, vehicles] = await Promise.all([getAdminDashboardSummary(), getAdminVehicleRows()]);

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
        <Link href="/">Back to lookup</Link>
        <span className="back-row-sep" aria-hidden="true">
          ·
        </span>
        <Link href="/admin/ingest">CSV ingestion</Link>
        <span className="back-row-sep" aria-hidden="true">
          ·
        </span>
        <AdminSignOut />
      </div>

      <section className="hero">
        <h1>Admin dashboard</h1>
        <p>Local overview of GhanaCarSpecs SQLite records. Access is limited to holders of the deployment admin secret.</p>
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

      <section className="admin-card" aria-labelledby="vehicles-heading">
        <h2 id="vehicles-heading">Vehicles</h2>
        <p className="admin-help">
          {vehicles.length === 0
            ? "No vehicles in the database yet. Use CSV ingestion to add records."
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
                  <th scope="col">
                    <span className="sr-only">Report</span>
                  </th>
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
                    <td>
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
