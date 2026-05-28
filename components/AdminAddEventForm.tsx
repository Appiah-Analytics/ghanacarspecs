"use client";

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
};

export function AdminAddEventForm({ vehicleId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      eventType: String(formData.get("eventType") ?? ""),
      eventDate: String(formData.get("eventDate") ?? ""),
      mileage: String(formData.get("mileage") ?? ""),
      sourceSystem: String(formData.get("sourceSystem") ?? ""),
      description: String(formData.get("description") ?? ""),
      provenanceType: String(formData.get("provenanceType") ?? ""),
      confidenceLevel: String(formData.get("confidenceLevel") ?? ""),
      status: String(formData.get("status") ?? "PUBLISHED"),
    };

    try {
      const res = await fetch(`/api/admin/vehicles/${vehicleId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (res.status === 401) {
        router.push(`/admin/login?from=/admin/vehicles/${vehicleId}`);
        return;
      }

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not add event.");
        return;
      }

      form.reset();
      router.push(`/admin/vehicles/${vehicleId}?event=added`);
      router.refresh();
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="admin-record-form" onSubmit={onSubmit}>
      <div className="admin-form-grid">
        <label>
          Event type <span className="admin-required">*</span>
          <select name="eventType" required defaultValue="SERVICE">
            {EVENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Event date <span className="admin-required">*</span>
          <input name="eventDate" type="date" required />
        </label>
        <label>
          Source system <span className="admin-required">*</span>
          <input name="sourceSystem" type="text" required placeholder="Who reported this event?" />
        </label>
        <label>
          Provenance <span className="admin-required">*</span>
          <select name="provenanceType" required defaultValue="OTHER">
            {PROVENANCE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Confidence <span className="admin-required">*</span>
          <select name="confidenceLevel" required defaultValue="LOW">
            {CONFIDENCE_LEVEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Moderation status <span className="admin-required">*</span>
          <select name="status" required defaultValue="PUBLISHED">
            {EVIDENCE_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Mileage (km)
          <input name="mileage" type="number" min={0} step={1} placeholder="Optional" />
        </label>
        <label className="admin-form-span">
          Description
          <textarea name="description" rows={3} placeholder="Optional notes stored with the event" />
        </label>
      </div>
      {error ? (
        <p className="alert error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={loading}>
        {loading ? "Adding…" : "Add timeline event"}
      </button>
    </form>
  );
}
