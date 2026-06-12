import { AdminNav } from "@/components/AdminNav";
import { AdminSignOut } from "@/components/AdminSignOut";
import {
  formatMonthlyVehicleVolumeLabel,
  formatPartnerTypeLabel,
} from "@/lib/partner-interest-options";
import { listPartnerInterests } from "@/lib/partner-interest";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function displayOptional(value: string | null | undefined): string {
  return value?.trim() ? value : "—";
}

export default async function AdminPartnerInterestPage() {
  const submissions = await listPartnerInterests();

  return (
    <main className="page">
      <div className="back-row">
        <AdminNav current="partner-interest" />
        <span className="back-row-sep" aria-hidden="true">
          ·
        </span>
        <AdminSignOut />
      </div>

      <section className="hero">
        <h1>Partner interest</h1>
        <p>
          Submissions from the public partner interest form. Read-only list — no workflows, notifications, or partner
          accounts in this phase.
        </p>
      </section>

      <section className="admin-card" aria-labelledby="partner-interest-table-heading">
        <h2 id="partner-interest-table-heading">Submissions ({submissions.length})</h2>

        {submissions.length === 0 ? (
          <p className="admin-help">No partner interest submissions yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table partner-interest-table">
              <thead>
                <tr>
                  <th scope="col">Submitted</th>
                  <th scope="col">Type</th>
                  <th scope="col">Business</th>
                  <th scope="col">Contact</th>
                  <th scope="col">WhatsApp</th>
                  <th scope="col">Email</th>
                  <th scope="col">City</th>
                  <th scope="col">Volume</th>
                  <th scope="col">Notes</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.createdAt)}</td>
                    <td>{formatPartnerTypeLabel(row.partnerType)}</td>
                    <td>{row.businessName}</td>
                    <td>{row.contactPerson}</td>
                    <td className="mono">{row.whatsappNumber}</td>
                    <td>{displayOptional(row.email)}</td>
                    <td>{row.city}</td>
                    <td>{formatMonthlyVehicleVolumeLabel(row.monthlyVehicleVolume)}</td>
                    <td className="partner-interest-notes-cell">{displayOptional(row.notes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
