"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  EXTERNAL_DECODE_FAILED_MESSAGE,
  EXTERNAL_DECODE_FAILED_TITLE,
  LOCAL_NOT_FOUND_MESSAGE,
  LOCAL_NOT_FOUND_TITLE,
  LOOKUP_UNAVAILABLE_MESSAGE,
  LOOKUP_UNAVAILABLE_TITLE,
} from "@/lib/lookup-messages";
import { EXTERNAL_LOOKUP_STORAGE_KEY } from "@/lib/lookup-storage";

export const FILL_LOOKUP_EVENT = "ghanacarspecs:fill-lookup";

type LookupAlertPayload = {
  title?: string;
  message?: string;
  error?: string;
};

function alertFromPayload(
  data: unknown,
  fallback: { title: string; body: string },
): { title: string; body: string } {
  const d = (data && typeof data === "object" ? data : {}) as LookupAlertPayload;
  const title = typeof d.title === "string" ? d.title : fallback.title;
  const body =
    typeof d.message === "string"
      ? d.message
      : typeof d.error === "string"
        ? d.error
        : fallback.body;
  return { title, body };
}

export function LookupForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState<{ title: string; body: string } | null>(null);
  const [error, setError] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    function onFill(event: Event) {
      const detail = (event as CustomEvent<{ value?: string }>).detail;
      if (typeof detail?.value === "string") {
        setValue(detail.value);
        setNotFound(null);
        setError(null);
      }
    }
    window.addEventListener(FILL_LOOKUP_EVENT, onFill);
    return () => window.removeEventListener(FILL_LOOKUP_EVENT, onFill);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotFound(null);
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
        setNotFound(
          alertFromPayload(data, {
            title: LOCAL_NOT_FOUND_TITLE,
            body: LOCAL_NOT_FOUND_MESSAGE,
          }),
        );
        return;
      }

      if (res.status === 502) {
        setError(
          alertFromPayload(data, {
            title: EXTERNAL_DECODE_FAILED_TITLE,
            body: EXTERNAL_DECODE_FAILED_MESSAGE,
          }),
        );
        return;
      }

      if (res.status >= 500) {
        setError(
          alertFromPayload(data, {
            title: LOOKUP_UNAVAILABLE_TITLE,
            body: LOOKUP_UNAVAILABLE_MESSAGE,
          }),
        );
        return;
      }

      setError(
        alertFromPayload(data, {
          title: LOOKUP_UNAVAILABLE_TITLE,
          body: LOOKUP_UNAVAILABLE_MESSAGE,
        }),
      );
    } catch {
      setError({
        title: LOOKUP_UNAVAILABLE_TITLE,
        body: LOOKUP_UNAVAILABLE_MESSAGE,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form className="lookup-form" onSubmit={onSubmit} aria-label="Vehicle lookup">
        <input
          id="vehicle-lookup-input"
          name="vinOrPlate"
          placeholder="e.g. 4T1BE46K37U123456, GR-1234-21, or BE46K37U123456"
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
      {notFound ? (
        <div className="alert alert-not-found" role="status">
          <p className="alert-title">{notFound.title}</p>
          <p className="alert-body">{notFound.body}</p>
        </div>
      ) : null}
      {error ? (
        <div className="alert error" role="alert">
          <p className="alert-title">{error.title}</p>
          <p className="alert-body">{error.body}</p>
        </div>
      ) : null}
    </>
  );
}
