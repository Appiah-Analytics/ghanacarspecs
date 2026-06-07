import Link from "next/link";
import { VehicleComparison } from "@/components/VehicleComparison";
import { VehicleComparisonForm } from "@/components/VehicleComparisonForm";
import { resolveComparisonPair } from "@/lib/resolve-vehicle-comparison";

export const dynamic = "force-dynamic";

type ComparePageProps = {
  searchParams: Promise<{ a?: string | string[]; b?: string | string[] }>;
};

function readParam(value: string | string[] | undefined): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return "";
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const params = await searchParams;
  const queryA = readParam(params.a);
  const queryB = readParam(params.b);
  const hasQuery = Boolean(queryA || queryB);

  const comparison = hasQuery ? await resolveComparisonPair(queryA, queryB) : null;

  return (
    <main className="page">
      <div className="back-row">
        <Link href="/">← Back to lookup</Link>
      </div>

      <section className="hero">
        <h1>Compare vehicles</h1>
        <p>
          Side-by-side comparison of two local GhanaCarSpecs records using trust score, risk profile, and published
          evidence counts. Not legal verification or official registry confirmation.
        </p>
      </section>

      <VehicleComparisonForm initialA={queryA} initialB={queryB} />

      {comparison ? <VehicleComparison sideA={comparison.sideA} sideB={comparison.sideB} /> : null}
    </main>
  );
}
