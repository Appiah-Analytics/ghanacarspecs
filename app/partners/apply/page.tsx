import Link from "next/link";
import type { Metadata } from "next";
import { PartnerInterestForm } from "@/components/PartnerInterestForm";

export const metadata: Metadata = {
  title: "Partner interest",
  description: "Register interest in future GhanaCarSpecs partnership opportunities.",
};

type Props = {
  searchParams: Promise<{ submitted?: string | string[] }>;
};

export default async function PartnerApplyPage({ searchParams }: Props) {
  const params = await searchParams;
  const submitted = params.submitted === "1" || params.submitted?.[0] === "1";

  return (
    <main className="page">
      <div className="back-row">
        <Link href="/partners">← Back to partners</Link>
      </div>

      <section className="hero">
        <p className="hero-eyebrow">GhanaCarSpecs partners</p>
        <h1>Register your interest</h1>
        <p className="hero-lead">
          Garages, dealers, importers, fleet operators, insurers, lenders, and service providers can share basic
          contact details so GhanaCarSpecs can follow up when partnership intake opens.
        </p>
      </section>

      {submitted ? (
        <p className="alert alert-not-found partner-interest-success" role="status">
          Thank you — your interest has been recorded. GhanaCarSpecs will review submissions when partnership onboarding
          begins. You can submit another response if details change.
        </p>
      ) : null}

      <section className="partner-interest-section" aria-labelledby="partner-interest-form-heading">
        <h2 id="partner-interest-form-heading" className="admin-section-title">
          Partner interest form
        </h2>
        <PartnerInterestForm />
      </section>
    </main>
  );
}
