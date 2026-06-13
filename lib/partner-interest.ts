import { PartnerType, type PartnerInterest } from "@prisma/client";
import { listPartnerInterestsFiltered } from "@/lib/partner-interest-pipeline";
import { prisma } from "@/lib/prisma";

export type PartnerInterestInput = {
  partnerType: PartnerType;
  businessName: string;
  contactPerson: string;
  whatsappNumber: string;
  email: string | null;
  city: string;
  monthlyVehicleVolume: string | null;
  notes: string | null;
};

export type PartnerInterestParseResult =
  | { ok: true; data: PartnerInterestInput }
  | { ok: false; error: string };

const PARTNER_TYPES = new Set<string>(Object.values(PartnerType));

function trimOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function trimRequired(value: unknown, field: string): string | null {
  const trimmed = trimOrNull(value);
  if (!trimmed) return null;
  return trimmed;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function parsePartnerInterestBody(body: unknown): PartnerInterestParseResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Expected JSON object." };
  }

  const record = body as Record<string, unknown>;
  const partnerTypeRaw = trimOrNull(record.partnerType);
  if (!partnerTypeRaw || !PARTNER_TYPES.has(partnerTypeRaw)) {
    return { ok: false, error: "Select a valid partner type." };
  }

  const businessName = trimRequired(record.businessName, "businessName");
  const contactPerson = trimRequired(record.contactPerson, "contactPerson");
  const whatsappNumber = trimRequired(record.whatsappNumber, "whatsappNumber");
  const city = trimRequired(record.city, "city");

  if (!businessName) return { ok: false, error: "Business name is required." };
  if (!contactPerson) return { ok: false, error: "Contact person is required." };
  if (!whatsappNumber) return { ok: false, error: "WhatsApp number is required." };
  if (!city) return { ok: false, error: "City is required." };

  const email = trimOrNull(record.email);
  if (email && !isValidEmail(email)) {
    return { ok: false, error: "Enter a valid email address or leave it blank." };
  }

  return {
    ok: true,
    data: {
      partnerType: partnerTypeRaw as PartnerType,
      businessName,
      contactPerson,
      whatsappNumber,
      email,
      city,
      monthlyVehicleVolume: trimOrNull(record.monthlyVehicleVolume),
      notes: trimOrNull(record.notes),
    },
  };
}

export async function createPartnerInterest(input: PartnerInterestInput): Promise<PartnerInterest> {
  return prisma.partnerInterest.create({ data: input });
}

export async function listPartnerInterests(limit = 200): Promise<PartnerInterest[]> {
  return listPartnerInterestsFiltered({}, limit);
}

export { listPartnerInterestsFiltered } from "@/lib/partner-interest-pipeline";
