import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintableVehicleReport } from "@/components/PrintableVehicleReport";
import { PrintReportActions } from "@/components/PrintReportActions";
import { getVehicleForReport } from "@/lib/vehicle-report";
import { vehicleDisplayLabel } from "@/lib/vehicle-report-bundle";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const vehicle = await getVehicleForReport(id);
  if (!vehicle) return { title: "Print report" };
  return {
    title: `Print — ${vehicleDisplayLabel(vehicle)}`,
    robots: { index: false, follow: false },
  };
}

export default async function PrintVehiclePage({ params }: Props) {
  const { id } = await params;
  const vehicle = await getVehicleForReport(id);

  if (!vehicle) notFound();

  return (
    <main className="page print-page">
      <PrintReportActions vehicleId={vehicle.id} />
      <PrintableVehicleReport vehicle={vehicle} />
    </main>
  );
}
