import { PartnerInterestStatus, type PartnerInterest } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PartnerInterestListFilters = {
  status?: PartnerInterestStatus;
};

export type PartnerInterestPipelineUpdate = {
  status: PartnerInterestStatus;
  internalNotes: string | null;
  lastContactedAt: Date | null;
  nextFollowUpAt: Date | null;
};

export type PartnerInterestPipelineParseResult =
  | { ok: true; data: PartnerInterestPipelineUpdate }
  | { ok: false; error: string; field?: string };

export type PartnerInterestStatusSummary = {
  total: number;
  byStatus: Record<PartnerInterestStatus, number>;
};

const PARTNER_INTEREST_STATUSES = new Set<string>(Object.values(PartnerInterestStatus));

function trimOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseOptionalDate(value: unknown, field: string): Date | null | { error: string; field: string } {
  const raw = trimOrNull(value);
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return { error: `Invalid date for ${field}.`, field };
  }
  return date;
}

export function parsePartnerInterestPipelineBody(body: unknown): PartnerInterestPipelineParseResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Expected JSON object." };
  }

  const record = body as Record<string, unknown>;
  const statusRaw = trimOrNull(record.status);
  if (!statusRaw || !PARTNER_INTEREST_STATUSES.has(statusRaw)) {
    return { ok: false, error: "Select a valid pipeline status.", field: "status" };
  }

  const lastContactedAt = parseOptionalDate(record.lastContactedAt, "lastContactedAt");
  if (lastContactedAt && typeof lastContactedAt === "object" && "error" in lastContactedAt) {
    return { ok: false, error: lastContactedAt.error, field: lastContactedAt.field };
  }

  const nextFollowUpAt = parseOptionalDate(record.nextFollowUpAt, "nextFollowUpAt");
  if (nextFollowUpAt && typeof nextFollowUpAt === "object" && "error" in nextFollowUpAt) {
    return { ok: false, error: nextFollowUpAt.error, field: nextFollowUpAt.field };
  }

  return {
    ok: true,
    data: {
      status: statusRaw as PartnerInterestStatus,
      internalNotes: trimOrNull(record.internalNotes),
      lastContactedAt: lastContactedAt as Date | null,
      nextFollowUpAt: nextFollowUpAt as Date | null,
    },
  };
}

export function parsePartnerInterestStatusFilter(value: string | undefined): PartnerInterestStatus | undefined {
  if (!value?.trim()) return undefined;
  return PARTNER_INTEREST_STATUSES.has(value) ? (value as PartnerInterestStatus) : undefined;
}

export async function getPartnerInterestById(id: string): Promise<PartnerInterest | null> {
  return prisma.partnerInterest.findUnique({ where: { id } });
}

export async function listPartnerInterestsFiltered(
  filters: PartnerInterestListFilters = {},
  limit = 200,
): Promise<PartnerInterest[]> {
  return prisma.partnerInterest.findMany({
    where: filters.status ? { status: filters.status } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getPartnerInterestStatusSummary(): Promise<PartnerInterestStatusSummary> {
  const grouped = await prisma.partnerInterest.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const byStatus = Object.fromEntries(
    Object.values(PartnerInterestStatus).map((status) => [status, 0]),
  ) as Record<PartnerInterestStatus, number>;

  let total = 0;
  for (const row of grouped) {
    byStatus[row.status] = row._count._all;
    total += row._count._all;
  }

  return { total, byStatus };
}

export async function updatePartnerInterestPipeline(
  id: string,
  input: PartnerInterestPipelineUpdate,
): Promise<PartnerInterest | null> {
  try {
    return await prisma.partnerInterest.update({
      where: { id },
      data: input,
    });
  } catch {
    return null;
  }
}
