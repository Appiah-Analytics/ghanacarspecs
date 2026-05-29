"use client";

import type { EvidenceStatus, VehicleEvent } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CONFIDENCE_LEVEL_OPTIONS,
  EVENT_TYPE_OPTIONS,
  EVIDENCE_STATUS_OPTIONS,
  PROVENANCE_TYPE_OPTIONS,
} from "@/lib/admin-form-options-client";

type Props = {
  vehicleId: string;
  event: VehicleEvent;
  descriptionValue: string;
};

function dateInputValue(value: Date): string {
  return new Date(value).toISOString().slice(0, 10);
}

export function AdminEditEventForm({ vehicleId, event, descriptionValue }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const payload = {
      eventType: String(formData.get("eventType") ?? ""),
      eventDate: String(formData.get("eventDate") ?? ""),
      mileage: String(formData.get("mileage") ?? ""),
      sourceSystem: String(formData.get("sourceSystem") ?? ""),
      description: String(formData.get("description") ?? ""),
      provenanceType: String(formData.get("provenanceType") ?? ""),
      confidenceLevel: String(formData.get("confidenceLevel") ?? ""),
      status: String(formData.get("status") ?? ""),
    };
    try {
      const res = await fetch(`/api/admin/vehicles/${vehicleId}/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not update event.");
        return;
      }
      router.push(`/admin/vehicles/${vehicleId}?event=updated`);
      router.refresh();
    } catch {
      setError("Network error — try again.");
    } finally {
      setSaving(false);
    }
  }

  async function onArchive() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/vehicles/${vehicleId}/events/${event.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not archive event.");
        return;
      }
      router.push(`/admin/vehicles/${vehicleId}?event=archived`);
      router.refresh();
    } catch {
      setError("Network error — try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-inline-form" onSubmit={onSave}>
      <label>
        Event type
        <select name="eventType" defaultValue={event.eventType}>
          {EVENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Event date
        <input name="eventDate" type="date" defaultValue={dateInputValue(event.eventDate)} />
      </label>
      <label>
        Mileage
        <input name="mileage" type="number" min={0} defaultValue={event.mileage ?? ""} />
      </label>
      <label>
        Source system
        <input name="sourceSystem" type="text" defaultValue={event.sourceSystem ?? ""} />
      </label>
      <label>
        Description
        <input name="description" type="text" defaultValue={descriptionValue} />
      </label>
      <label>
        Provenance
        <select name="provenanceType" defaultValue={event.provenanceType}>
          {PROVENANCE_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Confidence
        <select name="confidenceLevel" defaultValue={event.confidenceLevel}>
          {CONFIDENCE_LEVEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Status
        <select name="status" defaultValue={event.status as EvidenceStatus}>
          {EVIDENCE_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      {error ? <p className="alert error">{error}</p> : null}
      <div className="admin-inline-actions">
        <button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save event edits"}
        </button>
        <button type="button" className="admin-danger-btn" onClick={onArchive} disabled={saving}>
          Archive event
        </button>
      </div>
    </form>
  );
}
