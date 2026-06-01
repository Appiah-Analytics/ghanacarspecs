"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type IngestError = {
  row: number;
  field?: string;
  message: string;
};

type IngestSummary = {
  vehiclesCreated: number;
  vehiclesUpdated: number;
  eventsInserted: number;
  rowsProcessed: number;
};

type ImportValidationReport = {
  rowsProcessed: number;
  imported: number;
  skipped: number;
  warnings: IngestError[];
  errors: IngestError[];
};

type ImportQualityResult = {
  score: number;
  status: "Excellent" | "Good" | "Needs Review" | "Poor";
};

type IngestResponse =
  | { ok: true; summary: IngestSummary; report: ImportValidationReport; quality: ImportQualityResult }
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
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<IngestSummary | null>(null);
  const [report, setReport] = useState<ImportValidationReport | null>(null);
  const [quality, setQuality] = useState<ImportQualityResult | null>(null);
  const [errors, setErrors] = useState<IngestError[]>([]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSummary(null);
    setReport(null);
    setQuality(null);
    setErrors([]);

    const form = e.currentTarget;
    const formData = new FormData(form);

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
        return;
      }

      setReport(data.report);
      setQuality(data.quality);

      if (data.ok) {
        setSummary(data.summary);
        form.reset();
        router.refresh();
        return;
      }

      setErrors(data.errors);
    } catch {
      setErrors([{ row: 1, message: "Upload failed. Check that the dev server is still running and try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="admin-card" aria-labelledby="csv-upload-heading">
      <h2 id="csv-upload-heading">Upload CSV</h2>
      <p className="admin-help">
        Requires an admin session (sign in at /admin/login). Rows are validated first; hard errors block the import.
        Duplicate plate/chassis signals are reported as warnings and do not block import.
      </p>

      <form className="csv-upload-form" onSubmit={onSubmit}>
        <label className="file-label">
          CSV file
          <input name="file" type="file" accept=".csv,text/csv" required disabled={loading} />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Importing..." : "Import CSV"}
        </button>
      </form>

      {report ? (
        <div className="import-results-panel" role="status">
          <h3 className="import-results-title">Import summary</h3>
          <dl className="summary-grid">
            <div>
              <dt>Rows processed</dt>
              <dd>{report.rowsProcessed}</dd>
            </div>
            <div>
              <dt>Imported</dt>
              <dd>{report.imported}</dd>
            </div>
            <div>
              <dt>Skipped</dt>
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

          {summary ? (
            <dl className="summary-grid import-vehicle-summary">
              <div>
                <dt>Vehicles created</dt>
                <dd>{summary.vehiclesCreated}</dd>
              </div>
              <div>
                <dt>Vehicles updated</dt>
                <dd>{summary.vehiclesUpdated}</dd>
              </div>
              <div>
                <dt>Events inserted</dt>
                <dd>{summary.eventsInserted}</dd>
              </div>
            </dl>
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
          <p className="alert-body">Fix these issues and upload the file again. No records were imported.</p>
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

      {summary ? (
        <div className="alert alert-success" role="status">
          <p className="alert-title">CSV imported successfully</p>
          <p className="alert-body">Review warnings above if any duplicate signals were detected.</p>
        </div>
      ) : null}
    </section>
  );
}
