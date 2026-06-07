import Link from "next/link";
import { DemoExamples } from "@/components/DemoExamples";
import { HowItWorks } from "@/components/HowItWorks";
import { LookupForm } from "@/components/LookupForm";
import { PublicDisclaimer } from "@/components/PublicDisclaimer";
import { VinChassisGuidance } from "@/components/VinChassisGuidance";

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero hero-home">
        <p className="hero-eyebrow">Vehicle intelligence &amp; history · Ghana</p>
        <h1>Understand a vehicle before you buy, sell, or insure it</h1>
        <p className="hero-lead">
          GhanaCarSpecs combines <strong>local vehicle records</strong> (specs, imports, service, accidents where
          available) with <strong>public VIN decoding</strong> when we do not yet have the car on file. Enter a VIN,
          Ghana plate number, or chassis number to see what the platform can surface today.
        </p>
        <LookupForm />
        <p className="hero-compare-link">
          <Link href="/compare">Compare two vehicles side by side</Link>
        </p>
      </section>

      <VinChassisGuidance />

      <HowItWorks />

      <DemoExamples />

      <PublicDisclaimer />
    </main>
  );
}
