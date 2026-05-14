"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EXTERNAL_LOOKUP_STORAGE_KEY } from "@/lib/lookup-storage";

export function LookupForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vinOrPlate: value }),
      });
      const data: unknown = await res.json();

      if (res.ok && data && typeof data === "object" && "found" in data && (data as { found: boolean }).found) {
        const d = data as { recordSource?: string; vehicle?: { id?: string } };
        if (d.recordSource === "external") {
          sessionStorage.setItem(EXTERNAL_LOOKUP_STORAGE_KEY, JSON.stringify(data));
          router.push("/decoded");
          return;
        }
        const id = d.vehicle?.id;
        if (id) {
          router.push(`/vehicles/${id}`);
          return;
        }
      }

      if (res.status === 404) {
        const msg =
          data && typeof data === "object" && "message" in data
            ? String((data as { message?: string }).message)
            : "No record found for that VIN or plate.";
        setMessage(msg);
        return;
      }

      if (res.status === 502) {
        const base =
          data && typeof data === "object" && "message" in data
            ? String((data as { message?: string }).message)
            : "External VIN decode failed.";
        const detail =
          data && typeof data === "object" && "detail" in data
            ? String((data as { detail?: string }).detail)
            : "";
        setError(detail ? `${base} (${detail})` : base);
        return;
      }

      const errMsg =
        data && typeof data === "object" && "error" in data
          ? String((data as { error?: string }).error)
          : `Request failed (${res.status})`;
      setError(errMsg);
    } catch {
      setError("Network error - try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form className="lookup-form" onSubmit={onSubmit} aria-label="Vehicle lookup">
        <input
          name="vinOrPlate"
          placeholder="e.g. 4T1BE46K37U123456 or GR-1234-21"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          disabled={loading}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Look up"}
        </button>
      </form>
      {message ? (
        <div className="alert alert-not-found" role="status">
          <p className="alert-title">No record found</p>
          <p className="alert-body">{message}</p>
        </div>
      ) : null}
      {error ? (
        <div className="alert error" role="alert">
          <p className="alert-title">Something went wrong</p>
          <p className="alert-body">{error}</p>
        </div>
      ) : null}
    </>
  );
}
