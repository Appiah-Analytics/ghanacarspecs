"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalVinReport } from "@/components/ExternalVinReport";
import { EXTERNAL_LOOKUP_STORAGE_KEY } from "@/lib/lookup-storage";
import type { ExternalVinSpecs } from "@/lib/nhtsa-vin";

type ReadyPayload = {
  vin: string;
  decoded: ExternalVinSpecs;
  dataProvider: string;
};

function parseStoredPayload(raw: string): ReadyPayload | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (d.found !== true || d.recordSource !== "external") return null;
  if (typeof d.vin !== "string" || typeof d.dataProvider !== "string") return null;
  if (!d.decoded || typeof d.decoded !== "object") return null;
  return { vin: d.vin, decoded: d.decoded as ExternalVinSpecs, dataProvider: d.dataProvider };
}

export default function DecodedVinPage() {
  const [phase, setPhase] = useState<"loading" | "ready" | "missing">("loading");
  const [payload, setPayload] = useState<ReadyPayload | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(EXTERNAL_LOOKUP_STORAGE_KEY);
    if (!raw) {
      setPhase("missing");
      return;
    }
    const parsed = parseStoredPayload(raw);
    if (!parsed) {
      setPhase("missing");
      return;
    }
    setPayload(parsed);
    setPhase("ready");
  }, []);

  if (phase === "loading") {
    return (
      <main className="page">
        <p className="report-section-lead">Loading decode...</p>
      </main>
    );
  }

  if (phase === "missing" || !payload) {
    return (
      <main className="page">
        <article className="report">
          <h1 className="report-title">External decode not available</h1>
          <p className="report-section-lead">
            This page shows the result of a lookup that used the external VIN decoder. Open the home page, enter a
            17-character VIN that is not in the local database, and submit the form. You will be redirected here
            automatically.
          </p>
          <p>
            <Link href="/">Back to lookup</Link>
          </p>
        </article>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="back-row">
        <Link href="/">Back to lookup</Link>
      </div>
      <ExternalVinReport vin={payload.vin} specs={payload.decoded} dataProvider={payload.dataProvider} />
    </main>
  );
}
