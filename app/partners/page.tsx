import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partners",
  description:
    "Future GhanaCarSpecs partnership opportunities for garages, dealers, importers, and fleet operators in Ghana.",
};

const PARTNER_SECTIONS = [
  {
    id: "garages",
    title: "Garages",
    highlights: [
      "Build digital service history",
      "Improve trust with customers",
      "Support future buyers with maintenance records",
      "Demonstrate care and continuity over time",
    ],
  },
  {
    id: "dealers",
    title: "Dealers & Importers",
    highlights: [
      "Share vehicle information with buyers",
      "Reduce buyer uncertainty before purchase",
      "Present supporting evidence clearly",
      "Improve transparency in sales conversations",
    ],
  },
  {
    id: "fleet",
    title: "Fleet Operators",
    highlights: [
      "Track maintenance history across vehicles",
      "Monitor vehicle records in one place",
      "Support future resale and handover activities",
      "Build evidence for insurance and finance discussions",
    ],
  },
] as const;

const FUTURE_ECOSYSTEM = [
  "Insurers",
  "Lenders",
  "Fleet operators",
  "Service providers",
] as const;

export default function PartnersPage() {
  return (
    <main className="page">
      <div className="back-row">
        <Link href="/">← Back to lookup</Link>
      </div>

      <section className="hero partners-hero">
        <p className="hero-eyebrow">Ghana vehicle trust platform</p>
        <h1>Become a GhanaCarSpecs Partner</h1>
        <p className="hero-lead partners-hero-lead">
          GhanaCarSpecs is building a trusted vehicle information layer for Ghana — connecting buyers, sellers, garages,
          and operators through explainable reports and evidence-backed history. Partnership workflows are not live yet;
          this page describes future participation opportunities.
        </p>
      </section>

      <div className="partners-grid">
        {PARTNER_SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="partners-card" aria-labelledby={`${section.id}-heading`}>
            <h2 id={`${section.id}-heading`}>{section.title}</h2>
            <ul className="plain-list partners-card-list">
              {section.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="partners-ecosystem" aria-labelledby="partners-ecosystem-heading">
        <h2 id="partners-ecosystem-heading">Future ecosystem</h2>
        <p>
          Over time, GhanaCarSpecs aims to collaborate with organizations that help Ghanaians buy, insure, finance, and
          maintain vehicles with greater confidence. Future collaboration opportunities may include:
        </p>
        <ul className="plain-list partners-ecosystem-list">
          {FUTURE_ECOSYSTEM.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="partners-cta" aria-labelledby="partners-cta-heading">
        <h2 id="partners-cta-heading">Register your interest</h2>
        <p>
          Partnership onboarding is not live yet, but you can share basic business details so GhanaCarSpecs can follow
          up when intake opens.
        </p>
        <p className="partners-cta-action">
          <Link href="/partners/apply" className="partners-apply-link">
            Submit partner interest
          </Link>
        </p>
      </section>
    </main>
  );
}
