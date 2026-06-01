import type { ImportHistoryEntry } from "@/lib/import-history";

type ImportHistoryPanelProps = {
  entries: ImportHistoryEntry[];
};

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ImportHistoryPanel({ entries }: ImportHistoryPanelProps) {
  return (
    <section className="admin-card" aria-labelledby="import-history-heading">
      <h2 id="import-history-heading">Recent import history</h2>
      <p className="admin-help">Last 10 CSV imports recorded on this server (stored in prisma/data/import-history.json).</p>

      {entries.length === 0 ? (
        <p className="admin-help">No imports recorded yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">File</th>
                <th scope="col">Rows</th>
                <th scope="col">Imported</th>
                <th scope="col">Skipped</th>
                <th scope="col">Warnings</th>
                <th scope="col">Quality</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatTimestamp(entry.timestamp)}</td>
                  <td>{entry.filename}</td>
                  <td>{entry.rowsProcessed}</td>
                  <td>{entry.imported}</td>
                  <td>{entry.skipped}</td>
                  <td>{entry.warnings}</td>
                  <td>{entry.qualityScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
