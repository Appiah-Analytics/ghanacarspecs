import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page">
      <h1>Vehicle not found</h1>
      <p style={{ color: "var(--muted)" }}>That ID is not in the database.</p>
      <p>
        <Link href="/">Return home</Link>
      </p>
    </main>
  );
}
