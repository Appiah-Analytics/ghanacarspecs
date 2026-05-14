import { LookupForm } from "@/components/LookupForm";

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <h1>Check a car's history in Ghana</h1>
        <p>
          Enter a <strong>VIN</strong> or <strong>plate number</strong>. Local GhanaCarSpecs records are shown first;
          if a 17-character VIN is not in the database, we fall back to a free public VIN decoder (NHTSA vPIC) and label
          the result clearly.
        </p>
        <LookupForm />
      </section>
    </main>
  );
}
