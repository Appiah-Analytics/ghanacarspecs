"use client";

import Link from "next/link";
import { vehiclePdfExportUrl } from "@/lib/vehicle-pdf-export-url";

type PrintReportActionsProps = {
  vehicleId: string;
};

export function PrintReportActions({ vehicleId }: PrintReportActionsProps) {
  return (
    <div className="print-actions no-print">
      <button type="button" className="print-actions-btn" onClick={() => window.print()}>
        Print report
      </button>
      <a href={vehiclePdfExportUrl(vehicleId)} className="print-actions-link">
        Download PDF
      </a>
      <Link href={`/vehicles/${vehicleId}`} className="print-actions-link">
        View full report
      </Link>
    </div>
  );
}
