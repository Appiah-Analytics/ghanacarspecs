"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type IngestError = {
  row: number;
  field?: string;
  message: string;
};

type IngestSummary = {
  vehiclesCreated: number;
  vehiclesUpdated: number;
  eventsInserted: number;
  eventsSkipped: number;
  duplicateEventsSkipped: number;
  rowsProcessed: number;
};

type ImportValidationReport = {
  rowsProcessed: number;
  imported: number;
  skipped: number;
  eventsInserted: number;
  eventsSkipped: number;
  duplicateEventsSkipped: number;
  vehiclesCreated: number;
  vehiclesUpdated: number;
  warnings: IngestError[];
  errors: IngestError[];
  mode: "preview" | "commit";
};

type ImportQualityResult = {
  score: number;
  status: "Excellent" | "Good" | "Needs Review" | "Poor";
};

type IngestResponse =
  | { ok: true; summary: IngestSummary; report: ImportValidationReport; quality: ImportQualityResult; preview?: boolean }
  | { ok: false; errors: IngestError[]; report: ImportValidationReport; quality: ImportQualityResult };

function qualityClassName(status: ImportQualityResult["status"]): string {
  switch (status) {
    case "Excellent":
      return "import-quality-excellent";
    case "Good":
      return "import-quality-good";
    case "Needs Review":
      return "import-quality-review";
    default:
      return "import-quality-poor";
  }
}

export function CsvUploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<"preview" | "commit" | null>(null);
  const [summary, setSummary] = useState<IngestSummary | null>(null);
  const [report, setReport] = useState<ImportValidationReport | null>(null);
  const [quality, setQuality] = useState<ImportQualityResult | null>(null);
  const [errors, setErrors] = useState<IngestError[]>([]);
  const [previewReady, setPreviewReady] = useState(false);
  const [committed, setCommitted] = useState(false);

  async function submitImport(mode: "preview" | "commit") {
    const form = formRef.current;
    if (!form) return;

    const fileInput = form.elements.namedItem("file") as HTMLInputElement | null;
    if (!fileInput?.files?.length) {
      setErrors([{ row: 1, message: "Choose a CSV file first." }]);
      return;
    }

    setLoading(true);
    setLoadingMode(mode);
    if (mode === "preview") {
      setSummary(null);
      setCommitted(false);
    }
    setReport(null);
    setQuality(null);
    setErrors([]);

    const formData = new FormData(form);
    formData.set("mode", mode);

    try {
      const res = await fetch("/api/admin/ingest", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });
      const data = (await res.json()) as IngestResponse;

      if (res.status === 401) {
        router.push("/admin/login?from=/admin/ingest");
        return;
      }

      if (res.status === 503) {
        setErrors([{ row: 1, message: "Admin protection is not configured on this server." }]);
        setPreviewReady(false);
        return;
      }

      setReport(data.report);
      setQuality(data.quality);

      if (data.ok) {
        setSummary(data.summary);
        if (mode === "preview" || data.preview) {
          setPreviewReady(true);
          return;
        }

        setPreviewReady(false);
        setCommitted(true);
        form.reset();
        router.refresh();
        return;
      }

      setPreviewReady(false);
      setErrors(data.errors);
    } catch {
      setPreviewReady(false);
      setErrors([{ row: 1, message: "Upload failed. Check that the dev server is still running and try again." }]);
    } finally {
      setLoading(false);
      setLoadingMode(null);
    }
  }

  function onPreview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void submitImport("preview");
  }

  const isPreviewResult = report?.mode === "preview";
  const canCommit = previewReady && errors.length === 0 && (report?.errors.length ?? 0) === 0;

  return (
    <section className="admin-card" aria-labelledby="csv-upload-heading">
      <h2 id="csv-upload-heading">Upload CSV</h2>
      <p className="admin-help">
        Step 1: choose a file and click <strong>Preview import</strong> (no database writes). Step 2: review the
        summary. Step 3: re-select the same file if needed, then click <strong>Commit import</strong> to write records.
        Hard validation errors block commit; duplicate events are skipped with warnings.
      </p>

      <form ref={formRef} className="csv-upload-form" onSubmit={onPreview}>
        <label className="file-label">
          CSV file
          <input name="file" type="file" accept=".csv,text/csv" required disabled={loading} />
        </label>
        <div className="admin-search-row">
          <button type="submit" disabled={loading}>
            {loading && loadingMode === "preview" ? "Previewing..." : "Preview import"}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={loading || !canCommit}
            onClick={() => void submitImport("commit")}
          >
            {loading && loadingMode === "commit" ? "Committing..." : "Commit import"}
          </button>
        </div>
      </form>

      {!canCommit && !committed ? (
        <p className="admin-help">Commit is enabled after a successful preview with no fatal errors.</p>
      ) : null}

      {report ? (
        <div className="import-results-panel" role="status">
          <h3 className="import-results-title">
            {isPreviewResult ? "Import preview" : "Import summary"}
          </h3>
          <dl className="summary-grid">
            <div>
              <dt>Rows processed</dt>
              <dd>{report.rowsProcessed}</dd>
            </div>
            <div>
              <dt>{isPreviewResult ? "Vehicles to create" : "Vehicles created"}</dt>
              <dd>{report.vehiclesCreated}</dd>
            </div>
            <div>
              <dt>{isPreviewResult ? "Vehicles to update" : "Vehicles updated"}</dt>
              <dd>{report.vehiclesUpdated}</dd>
            </div>
            <div>
              <dt>{isPreviewResult ? "Events to insert" : "Events inserted"}</dt>
              <dd>{report.eventsInserted}</dd>
            </div>
            <div>
              <dt>{isPreviewResult ? "Events to skip" : "Events skipped"}</dt>
              <dd>{report.eventsSkipped}</dd>
            </div>
            <div>
              <dt>Duplicate events skipped</dt>
              <dd>{report.duplicateEventsSkipped}</dd>
            </div>
            <div>
              <dt>Validation rows skipped</dt>
              <dd>{report.skipped}</dd>
            </div>
            <div>
              <dt>Warnings</dt>
              <dd>{report.warnings.length}</dd>
            </div>
            <div>
              <dt>Errors</dt>
              <dd>{report.errors.length}</dd>
            </div>
          </dl>

          {quality ? (
            <div className={`import-quality ${qualityClassName(quality.status)}`}>
              <p className="import-quality-score">
                Quality score: <strong>{quality.score}</strong>
              </p>
              <p className="import-quality-status">Status: {quality.status}</p>
            </div>
          ) : null}

          {report.warnings.length > 0 ? (
            <div className="alert alert-warning" role="status">
              <p className="alert-title">Warnings</p>
              <ul className="error-list">
                {report.warnings.map((warning, index) => (
                  <li key={`warn-${warning.row}-${warning.field ?? "row"}-${index}`}>
                    {warning.row > 0 ? (
                      <>
                        <strong>Row {warning.row}</strong>
                        {warning.field ? ` (${warning.field})` : ""}:{" "}
                      </>
                    ) : null}
                    {warning.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {errors.length > 0 ? (
        <div className="alert error" role="alert">
          <p className="alert-title">CSV validation failed</p>
          <p className="alert-body">Fix these issues and preview again. No records were imported.</p>
          <ul className="error-list">
            {errors.map((error, index) => (
              <li key={`${error.row}-${error.field ?? "row"}-${index}`}>
                <strong>Row {error.row}</strong>
                {error.field ? ` (${error.field})` : ""}: {error.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {isPreviewResult && previewReady && errors.length === 0 ? (
        <div className="alert alert-not-found" role="status">
          <p className="alert-title">Preview complete — no database writes</p>
          <p className="alert-body">
            Re-select the same CSV file if the browser cleared it, then click Commit import to apply these changes.
          </p>
        </div>
      ) : null}

      {committed && summary ? (
        <div className="alert alert-success" role="status">
          <p className="alert-title">CSV imported successfully</p>
          <p className="alert-body">
            {summary.eventsInserted} event(s) inserted, {summary.duplicateEventsSkipped} duplicate event(s) skipped.
          </p>
        </div>
      ) : null}
    </section>
  );
}
