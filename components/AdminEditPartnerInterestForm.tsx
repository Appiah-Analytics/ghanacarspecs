"use client";

import type { PartnerInterest } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PARTNER_INTEREST_STATUS_OPTIONS } from "@/lib/partner-interest-options";

type Props = {
  submission: PartnerInterest;
};

function dateInputValue(value: Date | null | undefined): string {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export function AdminEditPartnerInterestForm({ submission }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      status: String(formData.get("status") ?? ""),
      internalNotes: String(formData.get("internalNotes") ?? ""),
      lastContactedAt: String(formData.get("lastContactedAt") ?? ""),
      nextFollowUpAt: String(formData.get("nextFollowUpAt") ?? ""),
    };

    try {
      const res = await fetch(`/api/admin/partner-interest/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (res.status === 401) {
        router.push(`/admin/login?from=/admin/partner-interest/${submission.id}`);
        return;
      }

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not update partner interest.");
        return;
      }

      router.push(`/admin/partner-interest/${submission.id}?updated=1`);
      router.refresh();
    } catch {
      setError("Network error — try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-record-form" onSubmit={onSave}>
      <h3 className="admin-form-section-title">Pipeline tracking</h3>
      <p className="admin-form-help">
        Internal fields for outreach and market discovery. Not visible on the public partner interest form.
      </p>

      <div className="admin-form-grid">
        <label>
          Status <span className="admin-required">*</span>
          <select name="status" required defaultValue={submission.status}>
            {PARTNER_INTEREST_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Last contacted
          <input name="lastContactedAt" type="date" defaultValue={dateInputValue(submission.lastContactedAt)} />
        </label>

        <label>
          Next follow-up
          <input name="nextFollowUpAt" type="date" defaultValue={dateInputValue(submission.nextFollowUpAt)} />
        </label>
      </div>

      <label className="admin-form-full-width">
        Internal notes
        <textarea
          name="internalNotes"
          rows={6}
          defaultValue={submission.internalNotes ?? ""}
          placeholder="Outreach summary, objections, pricing sensitivity, market discovery learnings…"
        />
      </label>

      {error ? (
        <p className="alert error" role="alert">
          {error}
        </p>
      ) : null}

      <p className="admin-form-actions">
        <button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save pipeline updates"}
        </button>
      </p>
    </form>
  );
}
