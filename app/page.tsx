import Link from "next/link";
import { AudiencePaths } from "@/components/AudiencePaths";
import { DemoExamples } from "@/components/DemoExamples";
import { HomeTrustSection } from "@/components/HomeTrustSection";
import { HowItWorks } from "@/components/HowItWorks";
import { LookupForm } from "@/components/LookupForm";
import { PublicDisclaimer } from "@/components/PublicDisclaimer";
import { VinChassisGuidance } from "@/components/VinChassisGuidance";

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero hero-home">
        <p className="hero-eyebrow">Ghana vehicle trust &amp; verification</p>
        <h1>Check a Ghana vehicle before you buy, sell, service, insure, or finance it</h1>
        <p className="hero-lead">
          Search by plate number, chassis number, or VIN to view available vehicle specifications, history signals,
          mileage records, service events, risk indicators, and supporting evidence.
        </p>
        <LookupForm />
        <p className="hero-compare-link">
          <Link href="/compare">Compare two vehicles side by side</Link>
        </p>
      </section>

      <AudiencePaths />

      <HomeTrustSection />

      <VinChassisGuidance />

      <HowItWorks />

      <DemoExamples />

      <PublicDisclaimer />
    </main>
  );
}
