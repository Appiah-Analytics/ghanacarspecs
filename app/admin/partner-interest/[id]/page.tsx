import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminEditPartnerInterestForm } from "@/components/AdminEditPartnerInterestForm";
import { AdminNav } from "@/components/AdminNav";
import { AdminSignOut } from "@/components/AdminSignOut";
import { PartnerInterestStatusBadge } from "@/components/PartnerInterestStatusBadge";
import {
  formatMonthlyVehicleVolumeLabel,
  formatPartnerTypeLabel,
} from "@/lib/partner-interest-options";
import { getPartnerInterestById } from "@/lib/partner-interest-pipeline";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string | string[] }>;
};

function formatDateTime(date: Date): string {
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

function displayOptional(value: string | null | undefined): string {
  return value?.trim() ? value : "—";
}

export default async function AdminPartnerInterestDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const submission = await getPartnerInterestById(id);

  if (!submission) notFound();

  const updated = query.updated === "1" || query.updated?.[0] === "1";

  return (
    <main className="page">
      <div className="back-row">
        <AdminNav current="partner-interest" />
        <span className="back-row-sep" aria-hidden="true">
          ·
        </span>
        <Link href="/admin/partner-interest">Back to partner interest</Link>
        <span className="back-row-sep" aria-hidden="true">
          ·
        </span>
        <AdminSignOut />
      </div>

      <section className="hero">
        <h1>{submission.businessName}</h1>
        <p>
          Partner interest submission — {formatPartnerTypeLabel(submission.partnerType)} · {submission.city}
        </p>
        <p className="partner-interest-detail-status">
          <PartnerInterestStatusBadge status={submission.status} />
        </p>
      </section>

      {updated ? (
        <p className="alert alert-not-found" role="status">
          Pipeline updates saved.
        </p>
      ) : null}

      <section className="admin-card" aria-labelledby="submission-details-heading">
        <h2 id="submission-details-heading">Submission details</h2>
        <dl className="spec-grid partner-interest-detail-grid">
          <div>
            <dt>Submitted</dt>
            <dd>{formatDateTime(submission.createdAt)}</dd>
          </div>
          <div>
            <dt>Partner type</dt>
            <dd>{formatPartnerTypeLabel(submission.partnerType)}</dd>
          </div>
          <div>
            <dt>Contact person</dt>
            <dd>{submission.contactPerson}</dd>
          </div>
          <div>
            <dt>WhatsApp</dt>
            <dd className="mono">{submission.whatsappNumber}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{displayOptional(submission.email)}</dd>
          </div>
          <div>
            <dt>City</dt>
            <dd>{submission.city}</dd>
          </div>
          <div>
            <dt>Monthly vehicle volume</dt>
            <dd>{formatMonthlyVehicleVolumeLabel(submission.monthlyVehicleVolume)}</dd>
          </div>
          <div>
            <dt>Last updated</dt>
            <dd>{formatDateTime(submission.updatedAt)}</dd>
          </div>
          <div>
            <dt>Last contacted</dt>
            <dd>{formatDateOnly(submission.lastContactedAt)}</dd>
          </div>
          <div>
            <dt>Next follow-up</dt>
            <dd>{formatDateOnly(submission.nextFollowUpAt)}</dd>
          </div>
        </dl>

        <div className="partner-interest-public-notes">
          <h3 className="admin-form-section-title">Public submission notes</h3>
          <p>{displayOptional(submission.notes)}</p>
        </div>
      </section>

      <section className="admin-card" aria-labelledby="pipeline-tracking-heading">
        <h2 id="pipeline-tracking-heading" className="sr-only">
          Pipeline tracking
        </h2>
        <AdminEditPartnerInterestForm submission={submission} />
      </section>
    </main>
  );
}
