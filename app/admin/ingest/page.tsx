import { AdminNav } from "@/components/AdminNav";
import { AdminSignOut } from "@/components/AdminSignOut";
import { CsvUploadForm } from "@/components/CsvUploadForm";
import { ImportHistoryPanel } from "@/components/ImportHistoryPanel";
import { getRecentImportHistory } from "@/lib/import-history";

export const dynamic = "force-dynamic";

const CSV_TEMPLATE = `vin,plateNumber,chassisNumber,make,model,year,eventType,eventDate,mileage,sourceSystem,description
JTDKN3DU0A0123456,GR-9000-24,JTDKN3DU0A0123456,Toyota,Prius,2010,IMPORT,2024-01-12,87000,Tema Port,Imported from Japan
JTDKN3DU0A0123456,GR-9000-24,JTDKN3DU0A0123456,Toyota,Prius,2010,SERVICE,2024-05-03,90120,Accra Hybrid Care,Hybrid battery inspected`;

export default async function AdminIngestPage() {
  const importHistory = await getRecentImportHistory(10);

  return (
    <main className="page">
      <div className="back-row">
        <AdminNav current="ingest" />
        <span className="back-row-sep" aria-hidden="true">
          ·
        </span>
        <AdminSignOut />
      </div>

      <section className="hero">
        <h1>CSV ingestion</h1>
        <p>
          Import vehicle and event records from CSV with preview-first workflow. Requires an admin session — public
          lookup is unchanged.
        </p>
      </section>

      <CsvUploadForm />

      <ImportHistoryPanel entries={importHistory} />

      <section className="admin-card" aria-labelledby="csv-template-heading">
        <h2 id="csv-template-heading">CSV template</h2>
        <p className="admin-help">
          Required columns: <span className="mono">vin</span>, <span className="mono">make</span>,{" "}
          <span className="mono">model</span>, <span className="mono">year</span>,{" "}
          <span className="mono">eventType</span>, <span className="mono">eventDate</span>. Optional columns:{" "}
          <span className="mono">plateNumber</span>, <span className="mono">chassisNumber</span>,{" "}
          <span className="mono">mileage</span>,{" "}
          <span className="mono">sourceSystem</span>, <span className="mono">description</span>.
        </p>
        <pre className="csv-template">
          <code>{CSV_TEMPLATE}</code>
        </pre>
      </section>

      <section className="admin-card" aria-labelledby="validation-heading">
        <h2 id="validation-heading">Validation rules</h2>
        <ul className="plain-list">
          <li>VIN must be exactly 17 characters.</li>
          <li>Year must be a whole number between 1886 and next year.</li>
          <li>Event type must match one of the Prisma event enum values.</li>
          <li>Event date must be a valid date, for example <span className="mono">2024-05-03</span>.</li>
          <li>Mileage is optional, but when present must be a whole number.</li>
          <li>Rows with the same VIN must not conflict on make, model, year, plate, or chassis number.</li>
          <li>
            The same plate or chassis on different VINs in one file produces a <strong>warning</strong> (import still
            proceeds).
          </li>
          <li>Existing VIN, plate, or chassis matches in the database are reported as duplicate warnings.</li>
        </ul>
      </section>
    </main>
  );
}
