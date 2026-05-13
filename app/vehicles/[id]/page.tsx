import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { VehicleReport } from "@/components/VehicleReport";

type Props = { params: Promise<{ id: string }> };

export default async function VehiclePage({ params }: Props) {
  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: { events: { orderBy: { eventDate: "desc" } } },
  });

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
