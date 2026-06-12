"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  MONTHLY_VEHICLE_VOLUME_OPTIONS,
  PARTNER_TYPE_OPTIONS,
} from "@/lib/partner-interest-options";

export function PartnerInterestForm() {
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
      partnerType: String(formData.get("partnerType") ?? ""),
      businessName: String(formData.get("businessName") ?? ""),
      contactPerson: String(formData.get("contactPerson") ?? ""),
      whatsappNumber: String(formData.get("whatsappNumber") ?? ""),
      email: String(formData.get("email") ?? ""),
      city: String(formData.get("city") ?? ""),
      monthlyVehicleVolume: String(formData.get("monthlyVehicleVolume") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    };

    try {
      const res = await fetch("/api/partners/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not submit your interest. Please try again.");
        return;
      }

      router.push("/partners/apply?submitted=1");
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="partner-interest-form" onSubmit={onSubmit}>
      <div className="partner-interest-grid">
        <label>
          Partner type <span className="admin-required">*</span>
          <select name="partnerType" required defaultValue="">
            <option value="" disabled>
              Select partner type
            </option>
            {PARTNER_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Business name <span className="admin-required">*</span>
          <input name="businessName" type="text" required autoComplete="organization" />
        </label>

        <label>
          Contact person <span className="admin-required">*</span>
          <input name="contactPerson" type="text" required autoComplete="name" />
        </label>

        <label>
          WhatsApp number <span className="admin-required">*</span>
          <input name="whatsappNumber" type="tel" required placeholder="e.g. +233..." autoComplete="tel" />
        </label>

        <label>
          Email
          <input name="email" type="email" autoComplete="email" placeholder="Optional" />
        </label>

        <label>
          City <span className="admin-required">*</span>
          <input name="city" type="text" required placeholder="e.g. Accra" autoComplete="address-level2" />
        </label>

        <label>
          Monthly vehicle volume
          <select name="monthlyVehicleVolume" defaultValue="">
            {MONTHLY_VEHICLE_VOLUME_OPTIONS.map((option) => (
              <option key={option.value || "none"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="partner-interest-notes">
        Notes
        <textarea
          name="notes"
          rows={4}
          placeholder="Tell us about your business and how you would like to participate."
        />
      </label>

      {error ? (
        <p className="alert error" role="alert">
          {error}
        </p>
      ) : null}

      <p className="partner-interest-submit-row">
        <button type="submit" disabled={loading}>
          {loading ? "Submitting…" : "Submit interest"}
        </button>
      </p>

      <p className="partner-interest-footnote" role="note">
        This form records interest only. It does not create an account or activate a partnership.
      </p>
    </form>
  );
}
