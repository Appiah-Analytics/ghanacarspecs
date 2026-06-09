import PDFDocument from "pdfkit";
import type { VehicleReportData } from "@/lib/vehicle-report";
import type { ReportExportSummary } from "@/lib/report-export-summary";
import { buildReportExportSummary } from "@/lib/report-export-summary";
import { buildReportReference } from "@/lib/report-reference";
import { buildVehicleReportBundle, type VehicleReportBundle } from "@/lib/vehicle-report-bundle";

const PAGE_BOTTOM_MARGIN = 72;

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatEventType(type: string): string {
  return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function sanitizeFilenamePart(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned || "vehicle";
}

export function vehicleReportPdfFilename(vin: string): string {
  return `ghanacarspecs-${sanitizeFilenamePart(vin)}.pdf`;
}

type PdfDoc = InstanceType<typeof PDFDocument>;

function pageBottom(doc: PdfDoc): number {
  return doc.page.height - PAGE_BOTTOM_MARGIN;
}

function ensureSpace(doc: PdfDoc, needed: number): void {
  if (doc.y + needed > pageBottom(doc)) {
    doc.addPage();
  }
}

function sectionTitle(doc: PdfDoc, title: string): void {
  ensureSpace(doc, 28);
  doc.moveDown(0.4);
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#111827").text(title);
  doc.moveDown(0.25);
}

function subsectionTitle(doc: PdfDoc, title: string): void {
  ensureSpace(doc, 20);
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#111827").text(title);
  doc.moveDown(0.15);
}

function bodyText(doc: PdfDoc, text: string): void {
  doc.font("Helvetica").fontSize(9.5).fillColor("#111827").text(text, { lineGap: 2 });
  doc.moveDown(0.2);
}

function bulletList(doc: PdfDoc, items: string[]): void {
  if (items.length === 0) return;
  ensureSpace(doc, items.length * 14 + 8);
  doc.font("Helvetica").fontSize(9.5).fillColor("#111827").list(items, {
    bulletRadius: 1.5,
    textIndent: 12,
    bulletIndent: 4,
    lineGap: 2,
  });
  doc.moveDown(0.15);
}

function keyValueGrid(doc: PdfDoc, rows: Array<{ label: string; value: string }>, columns = 2): void {
  const colWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / columns;
  const startX = doc.page.margins.left;
  let column = 0;
  let rowY = doc.y;

  rows.forEach((row, index) => {
    const x = startX + column * colWidth;
    const blockHeight = 28;
    if (rowY + blockHeight > pageBottom(doc)) {
      doc.addPage();
      rowY = doc.y;
      column = 0;
    }

    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#6b7280").text(row.label.toUpperCase(), x, rowY, {
      width: colWidth - 8,
    });
    doc.font("Helvetica").fontSize(9.5).fillColor("#111827").text(row.value, x, rowY + 11, {
      width: colWidth - 8,
    });

    column += 1;
    if (column >= columns) {
      column = 0;
      rowY += blockHeight;
      doc.y = rowY;
    } else if (index === rows.length - 1) {
      doc.y = rowY + blockHeight;
    }
  });

  if (column !== 0) {
    doc.y = rowY + 28;
  }
  doc.moveDown(0.15);
}

function drawEventTable(doc: PdfDoc, vehicle: VehicleReportData): void {
  const left = doc.page.margins.left;
  const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidths = [tableWidth * 0.22, tableWidth * 0.28, tableWidth * 0.22, tableWidth * 0.28];
  const rowHeight = 18;
  const headers = ["Date", "Type", "Mileage", "Source"];

  const drawHeader = () => {
    let x = left;
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#111827");
    headers.forEach((header, i) => {
      doc.rect(x, doc.y, colWidths[i], rowHeight).stroke("#d1d5db");
      doc.text(header, x + 4, doc.y + 5, { width: colWidths[i] - 8 });
      x += colWidths[i];
    });
    doc.y += rowHeight;
  };

  ensureSpace(doc, rowHeight * 3);
  drawHeader();

  doc.font("Helvetica").fontSize(8.5).fillColor("#111827");
  vehicle.events.forEach((event) => {
    if (doc.y + rowHeight > pageBottom(doc)) {
      doc.addPage();
      drawHeader();
    }

    const cells = [
      formatDate(event.eventDate),
      formatEventType(event.eventType),
      event.mileage != null ? `${event.mileage.toLocaleString()} km` : "—",
      event.sourceSystem ?? "—",
    ];

    let x = left;
    const rowY = doc.y;
    cells.forEach((cell, i) => {
      doc.rect(x, rowY, colWidths[i], rowHeight).stroke("#d1d5db");
      doc.text(cell, x + 4, rowY + 5, { width: colWidths[i] - 8, ellipsis: true });
      x += colWidths[i];
    });
    doc.y = rowY + rowHeight;
  });

  doc.moveDown(0.25);
}

function renderPdfContent(
  doc: PdfDoc,
  vehicle: VehicleReportData,
  reportBundle: VehicleReportBundle,
  exportSummary: ReportExportSummary,
): void {
  const { trustScore, riskProfile, intelligence } = reportBundle;
  const reportReference = buildReportReference(vehicle);
  const snapshot = exportSummary.comparisonSnapshot;
  const summary = exportSummary.executiveSummary;
  const trustReasons = trustScore.reasons.slice(1);

  const lastMileage = vehicle.events.reduce<number | null>((max, ev) => {
    if (ev.mileage == null) return max;
    if (max == null || ev.mileage > max) return ev.mileage;
    return max;
  }, null);

  const titleLine = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ""}`;

  doc.font("Helvetica-Bold").fontSize(16).fillColor("#111827").text("GhanaCarSpecs");
  doc.font("Helvetica").fontSize(10).fillColor("#4b5563").text("Vehicle intelligence report");
  doc.font("Helvetica").fontSize(9).fillColor("#4b5563").text(`Generated ${formatDateTime(exportSummary.generatedAt)}`, {
    align: "right",
  });
  doc.moveDown(0.5);
  doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke("#111827");
  doc.moveDown(0.6);

  doc.font("Helvetica-Bold").fontSize(14).fillColor("#111827").text(titleLine);
  doc.moveDown(0.35);

  keyValueGrid(doc, [
    { label: "Report Reference", value: reportReference },
    { label: "VIN", value: vehicle.vin },
    { label: "Plate", value: vehicle.plateNumber ?? "—" },
    { label: "Chassis", value: vehicle.chassisNumber ?? "—" },
    { label: "Report ID", value: vehicle.id },
  ]);

  sectionTitle(doc, "Executive summary");
  bodyText(doc, summary.overallAssessment);
  keyValueGrid(doc, [
    { label: "Trust band", value: summary.trustBand },
    { label: "Risk level", value: summary.riskLevel },
    { label: "Import status", value: summary.importStatus },
    { label: "Accident / claim status", value: summary.accidentClaimStatus },
    { label: "Mileage status", value: summary.mileageStatus },
  ]);
  subsectionTitle(doc, "Key signals");
  bulletList(doc, summary.keySignals);
  subsectionTitle(doc, "Recommended next step");
  bodyText(doc, summary.recommendedNextStep);

  sectionTitle(doc, "Trust score and risk profile");
  keyValueGrid(doc, [
    { label: "Trust score", value: `${exportSummary.trustScore} / 100 (${exportSummary.trustBand})` },
    { label: "Risk profile", value: `${exportSummary.riskScore} / 100 (${exportSummary.riskLevel})` },
  ]);
  if (trustReasons.length > 0) {
    subsectionTitle(doc, "Trust score — why");
    bulletList(doc, trustReasons);
  }
  if (trustScore.cautions.length > 0) {
    subsectionTitle(doc, "Trust score — caution");
    bulletList(doc, trustScore.cautions);
  }
  if (riskProfile.riskFactors.length > 0) {
    subsectionTitle(doc, "Risk factors");
    bulletList(doc, riskProfile.riskFactors);
  }
  if (riskProfile.positiveSignals.length > 0) {
    subsectionTitle(doc, "Positive signals");
    bulletList(doc, riskProfile.positiveSignals);
  }
  if (riskProfile.recommendations.length > 0) {
    subsectionTitle(doc, "Recommendations");
    bulletList(doc, riskProfile.recommendations);
  }

  sectionTitle(doc, "Vehicle specifications");
  keyValueGrid(doc, [
    { label: "Year", value: String(vehicle.year) },
    { label: "Make", value: vehicle.make },
    { label: "Model", value: vehicle.model },
    { label: "Trim", value: vehicle.trim ?? "—" },
    { label: "Engine", value: [vehicle.engineType, vehicle.engineSize].filter(Boolean).join(" · ") || "—" },
    { label: "Fuel", value: vehicle.fuelType ?? "—" },
    { label: "Country of origin", value: vehicle.countryOfOrigin ?? "—" },
    { label: "Import date", value: formatDate(vehicle.importDate) },
    { label: "Last known mileage", value: lastMileage != null ? `${lastMileage.toLocaleString()} km` : "—" },
    { label: "Published events", value: String(snapshot.eventCount) },
    { label: "Published photos", value: String(snapshot.photoCount) },
  ]);

  sectionTitle(doc, "Intelligence signals");
  keyValueGrid(doc, [
    {
      label: "History confidence",
      value: `${intelligence.confidence.score}/100 (${intelligence.confidence.label})`,
    },
    {
      label: "Service continuity",
      value: `${intelligence.serviceContinuity.score}/100 (${intelligence.serviceContinuity.label})`,
    },
    { label: "Imported vehicle", value: snapshot.importedVehicle ? "Indicated" : "Not indicated" },
    { label: "Mileage issue", value: snapshot.mileageIssue ? "Possible inconsistency" : "None detected" },
    { label: "Accident events", value: String(snapshot.accidentCount) },
    { label: "Insurance claim events", value: String(snapshot.insuranceClaimCount) },
    { label: "Theft events", value: String(snapshot.theftCount) },
  ]);

  sectionTitle(doc, "Published event history");
  if (vehicle.events.length === 0) {
    bodyText(doc, "No published timeline events are available.");
  } else {
    drawEventTable(doc, vehicle);
  }
  if (vehicle.photos.length > 0) {
    bodyText(
      doc,
      `${vehicle.photos.length} published visual evidence item${vehicle.photos.length === 1 ? "" : "s"} on file. View the full report online for photos.`,
    );
  }

  ensureSpace(doc, 48);
  doc.moveDown(0.5);
  doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke("#e5e7eb");
  doc.moveDown(0.35);
  doc.font("Helvetica").fontSize(8).fillColor("#4b5563").text(exportSummary.disclaimer, { lineGap: 2 });
  doc.moveDown(0.2);
  doc.text(
    "Based on published GhanaCarSpecs evidence only. Not legal advice, ownership proof, or official government verification.",
    { lineGap: 2 },
  );
}

/** Build a vehicle report PDF buffer from published report data. */
export async function generateVehicleReportPdf(vehicle: VehicleReportData): Promise<Buffer> {
  const reportBundle = buildVehicleReportBundle(vehicle);
  const exportSummary = buildReportExportSummary(reportBundle);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    try {
      renderPdfContent(doc, vehicle, reportBundle, exportSummary);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
