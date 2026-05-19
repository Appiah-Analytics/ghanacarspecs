import { EventType } from "@prisma/client";

export type IntelligenceEvent = {
  eventType: EventType;
  eventDate: Date;
  mileage: number | null;
  sourceSystem: string | null;
};

export type IntelligenceVehicle = {
  year: number;
  countryOfOrigin: string | null;
  importDate: Date | null;
  events: IntelligenceEvent[];
};

export type VehicleIntelligence = {
  mileageInconsistency: {
    detected: boolean;
    details: string[];
  };
  accidentRisk: {
    flagged: boolean;
    accidentCount: number;
    insuranceClaimCount: number;
    label: string;
  };
  importedVehicle: {
    indicated: boolean;
    reasons: string[];
  };
  serviceContinuity: {
    score: number;
    label: "Strong" | "Moderate" | "Limited" | "Unknown";
    detail: string;
  };
  timelineSummary: string;
  timelineHighlights: {
    eventType: string;
    eventDate: string;
    mileage: number | null;
    sourceSystem: string | null;
  }[];
  confidence: {
    score: number;
    label: "High" | "Medium" | "Low";
    factors: string[];
  };
};

const GHANA_ALIASES = new Set(["GHANA", "GH", "REPUBLIC OF GHANA"]);

function formatType(type: EventType): string {
  return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function isGhanaOrigin(country: string | null): boolean {
  if (!country) return false;
  return GHANA_ALIASES.has(country.trim().toUpperCase());
}

function detectMileageIssues(events: IntelligenceEvent[]): { detected: boolean; details: string[] } {
  const withMileage = events
    .filter((e) => e.mileage != null)
    .map((e) => ({ date: e.eventDate, mileage: e.mileage as number, type: e.eventType }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const details: string[] = [];

  for (let i = 1; i < withMileage.length; i += 1) {
    const prev = withMileage[i - 1];
    const curr = withMileage[i];
    if (curr.mileage < prev.mileage) {
      details.push(
        `Mileage dropped from ${prev.mileage.toLocaleString()} km (${formatType(prev.type)}) to ${curr.mileage.toLocaleString()} km (${formatType(curr.type)}).`,
      );
    }
    const years = (curr.date.getTime() - prev.date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (years > 0) {
      const annualKm = (curr.mileage - prev.mileage) / years;
      if (annualKm > 80_000) {
        details.push(
          `Large mileage increase (${Math.round(annualKm).toLocaleString()} km/year) between ${prev.date.toLocaleDateString()} and ${curr.date.toLocaleDateString()}.`,
        );
      }
    }
  }

  return { detected: details.length > 0, details };
}

function scoreServiceContinuity(events: IntelligenceEvent[]): VehicleIntelligence["serviceContinuity"] {
  if (events.length === 0) {
    return { score: 0, label: "Unknown", detail: "No events on file to assess service continuity." };
  }

  const sorted = [...events].sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());
  const first = sorted[0].eventDate;
  const last = sorted[sorted.length - 1].eventDate;
  const spanYears = Math.max((last.getTime() - first.getTime()) / (365.25 * 24 * 60 * 60 * 1000), 1 / 12);

  const serviceEvents = sorted.filter((e) => e.eventType === EventType.SERVICE);
  const serviceCount = serviceEvents.length;

  if (serviceCount === 0) {
    return {
      score: 25,
      label: "Limited",
      detail: `No service records across ${spanYears.toFixed(1)} years of history.`,
    };
  }

  const expectedServices = Math.max(1, Math.ceil(spanYears));
  const ratio = Math.min(serviceCount / expectedServices, 1);
  const score = Math.round(40 + ratio * 60);

  let label: VehicleIntelligence["serviceContinuity"]["label"] = "Moderate";
  if (score >= 75) label = "Strong";
  else if (score < 50) label = "Limited";

  return {
    score,
    label,
    detail: `${serviceCount} service record(s) across ${spanYears.toFixed(1)} year(s) of history (${expectedServices} year(s) tracked).`,
  };
}

function buildTimelineSummary(events: IntelligenceEvent[]): string {
  if (events.length === 0) return "No recorded events for this vehicle.";

  const sorted = [...events].sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());
  const first = sorted[0].eventDate;
  const last = sorted[sorted.length - 1].eventDate;
  const spanYears = ((last.getTime() - first.getTime()) / (365.25 * 24 * 60 * 60 * 1000)).toFixed(1);

  const counts = new Map<EventType, number>();
  for (const e of events) {
    counts.set(e.eventType, (counts.get(e.eventType) ?? 0) + 1);
  }

  const parts = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `${count} ${formatType(type).toLowerCase()}${count > 1 ? "s" : ""}`);

  const accidentCount = (counts.get(EventType.ACCIDENT) ?? 0) + (counts.get(EventType.INSURANCE_CLAIM) ?? 0);
  const accidentNote =
    accidentCount > 0 ? `${accidentCount} accident or claim record(s) on file.` : "No accidents or claims on file.";

  return `${events.length} event(s) over ${spanYears} year(s): ${parts.join(", ")}. ${accidentNote}`;
}

function computeConfidence(
  events: IntelligenceEvent[],
  serviceScore: number,
): VehicleIntelligence["confidence"] {
  const factors: string[] = [];
  let score = 0;

  const eventCount = events.length;
  if (eventCount >= 5) {
    score += 30;
    factors.push("Five or more recorded events.");
  } else if (eventCount >= 3) {
    score += 20;
    factors.push("Three or more recorded events.");
  } else if (eventCount >= 1) {
    score += 10;
    factors.push("Limited event history.");
  } else {
    factors.push("No events recorded.");
  }

  const types = new Set(events.map((e) => e.eventType));
  if (types.size >= 3) {
    score += 20;
    factors.push("Multiple event types (import, service, registration, etc.).");
  } else if (types.size >= 2) {
    score += 12;
    factors.push("More than one event type on file.");
  }

  const withMileage = events.filter((e) => e.mileage != null).length;
  const mileageRatio = eventCount > 0 ? withMileage / eventCount : 0;
  if (mileageRatio >= 0.75) {
    score += 20;
    factors.push("Most events include mileage.");
  } else if (mileageRatio >= 0.4) {
    score += 10;
    factors.push("Some events include mileage.");
  } else if (eventCount > 0) {
    factors.push("Few events include mileage readings.");
  }

  const sources = new Set(events.map((e) => e.sourceSystem).filter(Boolean));
  if (sources.size >= 2) {
    score += 15;
    factors.push("Multiple reporting sources.");
  } else if (sources.size === 1) {
    score += 8;
    factors.push("Single reporting source.");
  }

  score += Math.round(serviceScore * 0.15);

  const bounded = Math.min(100, Math.max(0, score));
  let label: VehicleIntelligence["confidence"]["label"] = "Low";
  if (bounded >= 70) label = "High";
  else if (bounded >= 45) label = "Medium";

  return { score: bounded, label, factors };
}

export function analyzeVehicleIntelligence(vehicle: IntelligenceVehicle): VehicleIntelligence {
  const events = vehicle.events;

  const mileageInconsistency = detectMileageIssues(events);

  const accidentCount = events.filter((e) => e.eventType === EventType.ACCIDENT).length;
  const insuranceClaimCount = events.filter((e) => e.eventType === EventType.INSURANCE_CLAIM).length;
  const accidentRisk = {
    flagged: accidentCount > 0 || insuranceClaimCount > 0,
    accidentCount,
    insuranceClaimCount,
    label:
      accidentCount + insuranceClaimCount === 0
        ? "No accident or insurance claim records"
        : `${accidentCount} accident(s), ${insuranceClaimCount} insurance claim(s) on file`,
  };

  const importReasons: string[] = [];
  if (events.some((e) => e.eventType === EventType.IMPORT)) importReasons.push("Import event recorded");
  if (vehicle.importDate) importReasons.push("Import date on vehicle record");
  if (vehicle.countryOfOrigin && !isGhanaOrigin(vehicle.countryOfOrigin)) {
    importReasons.push(`Country of origin: ${vehicle.countryOfOrigin}`);
  }

  const importedVehicle = {
    indicated: importReasons.length > 0,
    reasons: importReasons.length > 0 ? importReasons : ["No import indicators on file"],
  };

  const serviceContinuity = scoreServiceContinuity(events);
  const timelineSummary = buildTimelineSummary(events);

  const sortedDesc = [...events].sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime());
  const timelineHighlights = sortedDesc.slice(0, 6).map((e) => ({
    eventType: formatType(e.eventType),
    eventDate: e.eventDate.toISOString(),
    mileage: e.mileage,
    sourceSystem: e.sourceSystem,
  }));

  const confidence = computeConfidence(events, serviceContinuity.score);

  return {
    mileageInconsistency,
    accidentRisk,
    importedVehicle,
    serviceContinuity,
    timelineSummary,
    timelineHighlights,
    confidence,
  };
}
