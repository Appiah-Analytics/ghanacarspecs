import Link from "next/link";
import { notFound } from "next/navigation";
import { VehicleReport } from "@/components/VehicleReport";
import { getVehicleForReport } from "@/lib/vehicle-report";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function VehiclePage({ params }: Props) {
  const { id } = await params;
  const vehicle = await getVehicleForReport(id);

  if (!vehicle) notFound();

  return (
    <main className="page">
      <div className="back-row">
        <Link href="/">← Back to lookup</Link>
      </div>
      <VehicleReport vehicle={vehicle} />
    </main>
  );
}
