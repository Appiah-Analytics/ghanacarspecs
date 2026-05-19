import { EventType, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const REQUIRED_COLUMNS = ["vin", "make", "model", "year", "eventType", "eventDate"] as const;
const OPTIONAL_COLUMNS = ["plateNumber", "chassisNumber", "mileage", "sourceSystem", "description"] as const;
const ALL_COLUMNS = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS] as const;

export type CsvIngestError = {
  row: number;
  field?: string;
  message: string;
};

export type CsvIngestSummary = {
  vehiclesCreated: number;
  vehiclesUpdated: number;
  eventsInserted: number;
  rowsProcessed: number;
};

export type CsvIngestResult =
  | { ok: true; summary: CsvIngestSummary }
  | { ok: false; errors: CsvIngestError[] };

type CanonicalColumn = (typeof ALL_COLUMNS)[number];

function normalizeChassisKey(value: string): string {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

type ValidatedCsvRow = {
  rowNumber: number;
  vin: string;
  plateNumber: string | null;
  chassisNumber: string | null;
  make: string;
  model: string;
  year: number;
  eventType: EventType;
  eventDate: Date;
  mileage: number | null;
  sourceSystem: string | null;
  description: string | null;
};

type VehicleProfile = {
  vin: string;
  plateNumber: string | null;
  chassisNumber: string | null;
  make: string;
  model: string;
  year: number;
  importDate: Date | null;
};

function normalizeVin(value: string): string {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        field += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function canonicalHeader(value: string): CanonicalColumn | null {
  const compact = value.trim().replace(/^\uFEFF/, "").toLowerCase();
  return ALL_COLUMNS.find((c) => c.toLowerCase() === compact) ?? null;
}

function normalizeEventType(value: string): EventType | null {
  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  const alias = normalized === "INSURANCECLAIM" ? "INSURANCE_CLAIM" : normalized;
  return Object.values(EventType).includes(alias as EventType) ? (alias as EventType) : null;
}

function parseInteger(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  return Number.parseInt(value.trim(), 10);
}

function parseDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getCell(row: string[], indexByColumn: Map<CanonicalColumn, number>, col: CanonicalColumn): string {
  const index = indexByColumn.get(col);
  return index == null ? "" : (row[index] ?? "").trim();
}

function validateRows(rows: string[][]): { validRows: ValidatedCsvRow[]; errors: CsvIngestError[] } {
  const errors: CsvIngestError[] = [];
  const header = rows[0] ?? [];
  const indexByColumn = new Map<CanonicalColumn, number>();

  header.forEach((cell, index) => {
    const canonical = canonicalHeader(cell);
    if (!canonical) {
      errors.push({ row: 1, message: `Unknown column "${cell.trim()}".` });
      return;
    }
    if (indexByColumn.has(canonical)) {
      errors.push({ row: 1, field: canonical, message: `Duplicate column "${canonical}".` });
      return;
    }
    indexByColumn.set(canonical, index);
  });

  for (const col of REQUIRED_COLUMNS) {
    if (!indexByColumn.has(col)) {
      errors.push({ row: 1, field: col, message: `Missing required column "${col}".` });
    }
  }

  if (errors.length > 0) return { validRows: [], errors };

  const validRows: ValidatedCsvRow[] = [];
  const profileByVin = new Map<string, VehicleProfile>();
  const currentYear = new Date().getFullYear() + 1;

  rows.slice(1).forEach((row, rowIndex) => {
    const rowNumber = rowIndex + 2;
    const rowErrors: CsvIngestError[] = [];

    const vin = normalizeVin(getCell(row, indexByColumn, "vin"));
    const plateNumber = getCell(row, indexByColumn, "plateNumber") || null;
    const chassisRaw = getCell(row, indexByColumn, "chassisNumber");
    const chassisNumber = chassisRaw ? normalizeChassisKey(chassisRaw) : null;
    const make = getCell(row, indexByColumn, "make");
    const model = getCell(row, indexByColumn, "model");
    const yearRaw = getCell(row, indexByColumn, "year");
    const eventTypeRaw = getCell(row, indexByColumn, "eventType");
    const eventDateRaw = getCell(row, indexByColumn, "eventDate");
    const mileageRaw = getCell(row, indexByColumn, "mileage");
    const sourceSystem = getCell(row, indexByColumn, "sourceSystem") || null;
    const description = getCell(row, indexByColumn, "description") || null;

    if (vin.length !== 17) {
      rowErrors.push({ row: rowNumber, field: "vin", message: "VIN must be exactly 17 characters." });
    }
    if (!make) rowErrors.push({ row: rowNumber, field: "make", message: "Make is required." });
    if (!model) rowErrors.push({ row: rowNumber, field: "model", message: "Model is required." });

    const year = parseInteger(yearRaw);
    if (year == null || year < 1886 || year > currentYear) {
      rowErrors.push({ row: rowNumber, field: "year", message: `Year must be between 1886 and ${currentYear}.` });
    }

    const eventType = normalizeEventType(eventTypeRaw);
    if (!eventType) {
      rowErrors.push({
        row: rowNumber,
        field: "eventType",
        message: `Event type must be one of: ${Object.values(EventType).join(", ")}.`,
      });
    }

    const eventDate = parseDate(eventDateRaw);
    if (!eventDate) {
      rowErrors.push({ row: rowNumber, field: "eventDate", message: "Event date must be a valid date." });
    }

    let mileage: number | null = null;
    if (mileageRaw) {
      mileage = parseInteger(mileageRaw);
      if (mileage == null) {
        rowErrors.push({ row: rowNumber, field: "mileage", message: "Mileage must be a whole number." });
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      return;
    }

    const validYear = year as number;
    const validEventType = eventType as EventType;
    const validEventDate = eventDate as Date;

    const existing = profileByVin.get(vin);
    if (existing) {
      if (existing.make.toLowerCase() !== make.toLowerCase()) {
        errors.push({ row: rowNumber, field: "make", message: `VIN conflicts with earlier row: make differs for ${vin}.` });
      }
      if (existing.model.toLowerCase() !== model.toLowerCase()) {
        errors.push({ row: rowNumber, field: "model", message: `VIN conflicts with earlier row: model differs for ${vin}.` });
      }
      if (existing.year !== validYear) {
        errors.push({ row: rowNumber, field: "year", message: `VIN conflicts with earlier row: year differs for ${vin}.` });
      }
      if (existing.plateNumber && plateNumber && existing.plateNumber.toUpperCase() !== plateNumber.toUpperCase()) {
        errors.push({
          row: rowNumber,
          field: "plateNumber",
          message: `VIN conflicts with earlier row: plate number differs for ${vin}.`,
        });
      }
      if (
        existing.chassisNumber &&
        chassisNumber &&
        existing.chassisNumber !== chassisNumber
      ) {
        errors.push({
          row: rowNumber,
          field: "chassisNumber",
          message: `VIN conflicts with earlier row: chassis number differs for ${vin}.`,
        });
      }
      if (!existing.plateNumber && plateNumber) existing.plateNumber = plateNumber;
      if (!existing.chassisNumber && chassisNumber) existing.chassisNumber = chassisNumber;
      if (validEventType === EventType.IMPORT && (!existing.importDate || validEventDate < existing.importDate)) {
        existing.importDate = validEventDate;
      }
    } else {
      profileByVin.set(vin, {
        vin,
        plateNumber,
        chassisNumber,
        make,
        model,
        year: validYear,
        importDate: validEventType === EventType.IMPORT ? validEventDate : null,
      });
    }

    if (chassisNumber) {
      for (const [otherVin, profile] of profileByVin) {
        if (otherVin !== vin && profile.chassisNumber === chassisNumber) {
          errors.push({
            row: rowNumber,
            field: "chassisNumber",
            message: `Chassis number ${chassisNumber} is already used for VIN ${otherVin} in this file.`,
          });
        }
      }
    }

    validRows.push({
      rowNumber,
      vin,
      plateNumber,
      chassisNumber,
      make,
      model,
      year: validYear,
      eventType: validEventType,
      eventDate: validEventDate,
      mileage,
      sourceSystem,
      description,
    });
  });

  return { validRows, errors };
}

export async function ingestVehicleEventsCsv(csvText: string): Promise<CsvIngestResult> {
  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    return { ok: false, errors: [{ row: 1, message: "CSV must include a header row and at least one data row." }] };
  }

  const { validRows, errors } = validateRows(rows);
  if (errors.length > 0) return { ok: false, errors };

  const profiles = new Map<string, VehicleProfile>();
  for (const row of validRows) {
    const existing = profiles.get(row.vin);
    if (existing) {
      if (!existing.plateNumber && row.plateNumber) existing.plateNumber = row.plateNumber;
      if (!existing.chassisNumber && row.chassisNumber) existing.chassisNumber = row.chassisNumber;
      if (row.eventType === EventType.IMPORT && (!existing.importDate || row.eventDate < existing.importDate)) {
        existing.importDate = row.eventDate;
      }
      continue;
    }
    profiles.set(row.vin, {
      vin: row.vin,
      plateNumber: row.plateNumber,
      chassisNumber: row.chassisNumber,
      make: row.make,
      model: row.model,
      year: row.year,
      importDate: row.eventType === EventType.IMPORT ? row.eventDate : null,
    });
  }

  const existingVehicles = await prisma.vehicle.findMany({
    where: { vin: { in: [...profiles.keys()] } },
    select: { vin: true },
  });
  const existingVins = new Set(existingVehicles.map((v) => v.vin));

  const summary = await prisma.$transaction(async (tx) => {
    const vehicleIdByVin = new Map<string, string>();
    let vehiclesCreated = 0;
    let vehiclesUpdated = 0;

    for (const profile of profiles.values()) {
      const updateData: Prisma.VehicleUpdateInput = {
        make: profile.make,
        model: profile.model,
        year: profile.year,
      };
      if (profile.plateNumber) updateData.plateNumber = profile.plateNumber;
      if (profile.chassisNumber) updateData.chassisNumber = profile.chassisNumber;
      if (profile.importDate) updateData.importDate = profile.importDate;

      const vehicle = await tx.vehicle.upsert({
        where: { vin: profile.vin },
        create: {
          vin: profile.vin,
          plateNumber: profile.plateNumber,
          chassisNumber: profile.chassisNumber,
          make: profile.make,
          model: profile.model,
          year: profile.year,
          importDate: profile.importDate,
        },
        update: updateData,
        select: { id: true, vin: true },
      });

      vehicleIdByVin.set(vehicle.vin, vehicle.id);
      if (existingVins.has(vehicle.vin)) vehiclesUpdated += 1;
      else vehiclesCreated += 1;
    }

    await tx.vehicleEvent.createMany({
      data: validRows.map((row) => ({
        vehicleId: vehicleIdByVin.get(row.vin) as string,
        eventType: row.eventType,
        eventDate: row.eventDate,
        mileage: row.mileage,
        sourceSystem: row.sourceSystem,
        rawPayload: row.description ? { description: row.description, importedFrom: "csv" } : { importedFrom: "csv" },
      })),
    });

    return {
      vehiclesCreated,
      vehiclesUpdated,
      eventsInserted: validRows.length,
      rowsProcessed: validRows.length,
    };
  });

  return { ok: true, summary };
}
