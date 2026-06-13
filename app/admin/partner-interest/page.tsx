import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { AdminSignOut } from "@/components/AdminSignOut";
import { PartnerInterestStatusBadge } from "@/components/PartnerInterestStatusBadge";
import {
  formatMonthlyVehicleVolumeLabel,
  formatPartnerTypeLabel,
  PARTNER_INTEREST_STATUS_OPTIONS,
} from "@/lib/partner-interest-options";
import {
  getPartnerInterestStatusSummary,
  listPartnerInterestsFiltered,
  parsePartnerInterestStatusFilter,
} from "@/lib/partner-interest-pipeline";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ status?: string | string[] }>;
};

function formatDate(date: Date): string {
  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(date: Date | null | undefined): string {
  if (!date) return "—";
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function readStatusParam(value: string | string[] | undefined): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return "";
}

export default async function AdminPartnerInterestPage({ searchParams }: Props) {
  const params = await searchParams;
  const statusQuery = readStatusParam(params.status);
  const statusFilter = parsePartnerInterestStatusFilter(statusQuery || undefined);

  const [summary, submissions] = await Promise.all([
    getPartnerInterestStatusSummary(),
    listPartnerInterestsFiltered(statusFilter ? { status: statusFilter } : {}),
  ]);

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
          Submissions from the public partner interest form with lightweight pipeline tracking for outreach and market
          discovery. Not a CRM — no notifications or partner accounts.
        </p>
      </section>

      <section className="admin-stats" aria-labelledby="partner-pipeline-summary-heading">
        <h2 id="partner-pipeline-summary-heading" className="admin-section-title">
          Pipeline summary
        </h2>
        <div className="admin-stats-grid">
          <article className="admin-stat-card">
            <h3>Total submissions</h3>
            <p className="admin-stat-value">{summary.total.toLocaleString()}</p>
          </article>
          {PARTNER_INTEREST_STATUS_OPTIONS.map((option) => (
            <article key={option.value} className="admin-stat-card">
              <h3>{option.label}</h3>
              <p className="admin-stat-value">{summary.byStatus[option.value].toLocaleString()}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-card" aria-labelledby="partner-interest-table-heading">
        <h2 id="partner-interest-table-heading">Submissions ({submissions.length})</h2>

        <form className="admin-search" method="get" role="search">
          <label htmlFor="partner-interest-status-filter">Filter by status</label>
          <div className="admin-search-row">
            <select id="partner-interest-status-filter" name="status" defaultValue={statusQuery}>
              <option value="">All statuses</option>
              {PARTNER_INTEREST_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button type="submit">Apply</button>
            {statusQuery ? (
              <Link href="/admin/partner-interest" className="admin-search-clear">
                Clear
              </Link>
            ) : null}
          </div>
        </form>

        {submissions.length === 0 ? (
          <p className="admin-help">No partner interest submissions match this filter.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table partner-interest-table">
              <thead>
                <tr>
                  <th scope="col">Submitted</th>
                  <th scope="col">Status</th>
                  <th scope="col">Type</th>
                  <th scope="col">Business</th>
                  <th scope="col">Contact</th>
                  <th scope="col">City</th>
                  <th scope="col">Last contacted</th>
                  <th scope="col">Next follow-up</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.createdAt)}</td>
                    <td>
                      <PartnerInterestStatusBadge status={row.status} />
                    </td>
                    <td>{formatPartnerTypeLabel(row.partnerType)}</td>
                    <td>{row.businessName}</td>
                    <td>{row.contactPerson}</td>
                    <td>{row.city}</td>
                    <td>{formatDateOnly(row.lastContactedAt)}</td>
                    <td>{formatDateOnly(row.nextFollowUpAt)}</td>
                    <td>
                      <Link href={`/admin/partner-interest/${row.id}`}>View</Link>
                    </td>
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
