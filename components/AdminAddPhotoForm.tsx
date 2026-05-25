"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PHOTO_SOURCE_TYPE_OPTIONS } from "@/lib/admin-form-options-client";

type Props = {
  vehicleId: string;
};

export function AdminAddPhotoForm({ vehicleId }: Props) {
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
      url: String(formData.get("url") ?? ""),
      caption: String(formData.get("caption") ?? ""),
      sourceType: String(formData.get("sourceType") ?? ""),
      sourceLabel: String(formData.get("sourceLabel") ?? ""),
      takenAt: String(formData.get("takenAt") ?? ""),
    };

    try {
      const res = await fetch(`/api/admin/vehicles/${vehicleId}/photos`, {
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
        setError(data.error ?? "Could not add photo.");
        return;
      }

      form.reset();
      router.push(`/admin/vehicles/${vehicleId}?photo=added`);
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
          Photo URL <span className="admin-required">*</span>
          <input
            name="url"
            type="text"
            required
            placeholder="/demo-photos/toyota-tema-port-import.svg"
            spellCheck={false}
          />
          <span className="admin-field-hint">Must start with /demo-photos/, http://, or https://</span>
        </label>
        <label>
          Source type <span className="admin-required">*</span>
          <select name="sourceType" required defaultValue="OTHER">
            {PHOTO_SOURCE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Caption
          <input name="caption" type="text" placeholder="What does this image show?" />
        </label>
        <label>
          Source label
          <input name="sourceLabel" type="text" placeholder="e.g. Partner intake (sample)" />
        </label>
        <label>
          Taken at
          <input name="takenAt" type="date" />
        </label>
      </div>
      {error ? (
        <p className="alert error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={loading}>
        {loading ? "Adding…" : "Add visual evidence"}
      </button>
    </form>
  );
}
