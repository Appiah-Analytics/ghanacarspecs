"use client";

import Link from "next/link";

type PrintReportActionsProps = {
  vehicleId: string;
};

export function PrintReportActions({ vehicleId }: PrintReportActionsProps) {
  return (
    <div className="print-actions no-print">
      <button type="button" className="print-actions-btn" onClick={() => window.print()}>
        Print report
      </button>
      <Link href={`/vehicles/${vehicleId}`} className="print-actions-link">
        View full report
      </Link>
    </div>
  );
}
