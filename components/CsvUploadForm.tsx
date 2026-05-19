"use client";

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

type IngestResponse =
  | { ok: true; summary: IngestSummary }
  | { ok: false; errors: IngestError[] };

export function CsvUploadForm() {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<IngestSummary | null>(null);
  const [errors, setErrors] = useState<IngestError[]>([]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setSummary(null);
    setErrors([]);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/admin/ingest", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as IngestResponse;

      if (data.ok) {
        setSummary(data.summary);
        form.reset();
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
        Local admin tool only. The file is validated first; if any row has an error, no records are written.
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

      {summary ? (
        <div className="alert alert-success" role="status">
          <p className="alert-title">CSV imported successfully</p>
          <dl className="summary-grid">
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
            <div>
              <dt>Rows processed</dt>
              <dd>{summary.rowsProcessed}</dd>
            </div>
          </dl>
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
    </section>
  );
}
