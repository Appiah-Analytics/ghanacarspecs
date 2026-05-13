import { LookupForm } from "@/components/LookupForm";

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <h1>Check a car’s history in Ghana</h1>
        <p>
          Enter a <strong>VIN</strong> or <strong>plate number</strong> to view sample specs and recorded events from
          the local database (Phase 1 MVP).
        </p>
        <LookupForm />
      </section>
    </main>
  );
}
