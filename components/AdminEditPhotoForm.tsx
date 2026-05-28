"use client";

import type { EvidenceStatus, VehiclePhoto } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CONFIDENCE_LEVEL_OPTIONS,
  EVIDENCE_STATUS_OPTIONS,
  PROVENANCE_TYPE_OPTIONS,
} from "@/lib/admin-form-options-client";

type Props = {
  vehicleId: string;
  photo: VehiclePhoto;
  captionValue: string;
};

function dateInputValue(value: Date | null): string {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export function AdminEditPhotoForm({ vehicleId, photo, captionValue }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const payload = {
      caption: String(formData.get("caption") ?? ""),
      sourceLabel: String(formData.get("sourceLabel") ?? ""),
      provenanceType: String(formData.get("provenanceType") ?? ""),
      confidenceLevel: String(formData.get("confidenceLevel") ?? ""),
      takenAt: String(formData.get("takenAt") ?? ""),
      status: String(formData.get("status") ?? ""),
    };
    try {
      const res = await fetch(`/api/admin/vehicles/${vehicleId}/photos/${photo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not update photo.");
        return;
      }
      router.push(`/admin/vehicles/${vehicleId}?photo=updated`);
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
      const res = await fetch(`/api/admin/vehicles/${vehicleId}/photos/${photo.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not archive photo.");
        return;
      }
      router.push(`/admin/vehicles/${vehicleId}?photo=archived`);
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
        Caption
        <input name="caption" type="text" defaultValue={captionValue} />
      </label>
      <label>
        Source label
        <input name="sourceLabel" type="text" defaultValue={photo.sourceLabel ?? ""} />
      </label>
      <label>
        Provenance
        <select name="provenanceType" defaultValue={photo.provenanceType}>
          {PROVENANCE_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Confidence
        <select name="confidenceLevel" defaultValue={photo.confidenceLevel}>
          {CONFIDENCE_LEVEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Status
        <select name="status" defaultValue={photo.status as EvidenceStatus}>
          {EVIDENCE_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Taken at
        <input name="takenAt" type="date" defaultValue={dateInputValue(photo.takenAt)} />
      </label>
      {error ? <p className="alert error">{error}</p> : null}
      <div className="admin-inline-actions">
        <button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save photo edits"}
        </button>
        <button type="button" className="admin-danger-btn" onClick={onArchive} disabled={saving}>
          Archive photo
        </button>
      </div>
    </form>
  );
}
