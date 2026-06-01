import type { PrismaClient } from "@prisma/client";

export type DuplicateConfidence = "high" | "possible";

export type DuplicateCategory = "vin" | "plate" | "chassis";

export type CsvRowForDuplicateCheck = {
  rowNumber: number;
  vin: string;
  plateNumber: string | null;
  chassisNumber: string | null;
};

export type DuplicateFinding = {
  confidence: DuplicateConfidence;
  category: DuplicateCategory;
  value: string;
  row?: number;
  message: string;
};

function normalizePlate(value: string): string {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function normalizeChassis(value: string): string {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

function pushUniqueFinding(findings: DuplicateFinding[], finding: DuplicateFinding): void {
  const key = `${finding.confidence}:${finding.category}:${finding.value}`;
  if (findings.some((f) => `${f.confidence}:${f.category}:${f.value}` === key)) {
    return;
  }
  findings.push(finding);
}

function detectWithinFileDuplicates(rows: CsvRowForDuplicateCheck[]): DuplicateFinding[] {
  const findings: DuplicateFinding[] = [];

  const plateToVins = new Map<string, { vins: Set<string>; rows: number[] }>();
  const chassisToVins = new Map<string, { vins: Set<string>; rows: number[] }>();

  for (const row of rows) {
    if (row.plateNumber) {
      const plate = normalizePlate(row.plateNumber);
      const entry = plateToVins.get(plate) ?? { vins: new Set<string>(), rows: [] };
      entry.vins.add(row.vin);
      entry.rows.push(row.rowNumber);
      plateToVins.set(plate, entry);
    }

    if (row.chassisNumber) {
      const chassis = normalizeChassis(row.chassisNumber);
      const entry = chassisToVins.get(chassis) ?? { vins: new Set<string>(), rows: [] };
      entry.vins.add(row.vin);
      entry.rows.push(row.rowNumber);
      chassisToVins.set(chassis, entry);
    }
  }

  for (const [plate, { vins, rows: rowNumbers }] of plateToVins) {
    if (vins.size > 1) {
      pushUniqueFinding(findings, {
        confidence: "possible",
        category: "plate",
        value: plate,
        row: rowNumbers[0],
        message: `Possible duplicate plate in file: ${plate}`,
      });
    }
  }

  for (const [chassis, { vins, rows: rowNumbers }] of chassisToVins) {
    if (vins.size > 1) {
      pushUniqueFinding(findings, {
        confidence: "possible",
        category: "chassis",
        value: chassis,
        row: rowNumbers[0],
        message: `Possible duplicate chassis in file: ${chassis}`,
      });
    }
  }

  return findings;
}

async function detectDatabaseDuplicates(rows: CsvRowForDuplicateCheck[], db: PrismaClient): Promise<DuplicateFinding[]> {
  const findings: DuplicateFinding[] = [];
  if (rows.length === 0) {
    return findings;
  }

  const vins = [...new Set(rows.map((r) => r.vin))];
  const uploadVinByPlate = new Map<string, string>();
  const uploadVinByChassis = new Map<string, string>();

  for (const row of rows) {
    if (row.plateNumber) {
      uploadVinByPlate.set(normalizePlate(row.plateNumber), row.vin);
    }
    if (row.chassisNumber) {
      uploadVinByChassis.set(normalizeChassis(row.chassisNumber), row.vin);
    }
  }

  const plateInputs = [...uploadVinByPlate.keys()];
  const chassisInputs = [...uploadVinByChassis.keys()];

  const existingVehicles = await db.vehicle.findMany({
    where: {
      OR: [
        { vin: { in: vins } },
        ...(plateInputs.length > 0 ? [{ plateNumber: { not: null } }] : []),
        ...(chassisInputs.length > 0 ? [{ chassisNumber: { not: null } }] : []),
      ],
    },
    select: { vin: true, plateNumber: true, chassisNumber: true },
  });

  const existingVins = new Set<string>();

  for (const vehicle of existingVehicles) {
    if (vins.includes(vehicle.vin)) {
      existingVins.add(vehicle.vin);
    }

    if (vehicle.plateNumber) {
      const plate = normalizePlate(vehicle.plateNumber);
      const uploadVin = uploadVinByPlate.get(plate);
      if (uploadVin && uploadVin !== vehicle.vin) {
        pushUniqueFinding(findings, {
          confidence: "possible",
          category: "plate",
          value: plate,
          message: `Possible duplicate plate: ${plate}`,
        });
      }
    }

    if (vehicle.chassisNumber) {
      const chassis = normalizeChassis(vehicle.chassisNumber);
      const uploadVin = uploadVinByChassis.get(chassis);
      if (uploadVin && uploadVin !== vehicle.vin) {
        pushUniqueFinding(findings, {
          confidence: "possible",
          category: "chassis",
          value: chassis,
          message: `Possible duplicate chassis: ${chassis}`,
        });
      }
    }
  }

  for (const vin of existingVins) {
    const firstRow = rows.find((r) => r.vin === vin);
    pushUniqueFinding(findings, {
      confidence: "high",
      category: "vin",
      value: vin,
      row: firstRow?.rowNumber,
      message: `Duplicate VIN: ${vin}`,
    });
  }

  return findings;
}

/** Detect duplicate VIN/plate/chassis signals for a validated CSV upload. Warnings only — never blocks import. */
export async function detectImportDuplicates(
  rows: CsvRowForDuplicateCheck[],
  db: PrismaClient,
): Promise<DuplicateFinding[]> {
  const findings = detectWithinFileDuplicates(rows);
  const dbFindings = await detectDatabaseDuplicates(rows, db);

  for (const finding of dbFindings) {
    pushUniqueFinding(findings, finding);
  }

  return findings;
}
