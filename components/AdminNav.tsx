import Link from "next/link";

type AdminNavProps = {
  current?: "dashboard" | "ingest" | "manage" | "partner-interest";
};

const LINKS = [
  { href: "/admin", key: "dashboard" as const, label: "Dashboard" },
  { href: "/admin/ingest", key: "ingest" as const, label: "CSV ingestion" },
  { href: "/admin/partner-interest", key: "partner-interest" as const, label: "Partner interest" },
];

export function AdminNav({ current }: AdminNavProps) {
  return (
    <nav className="admin-nav" aria-label="Admin">
      <Link href="/">Public lookup</Link>
      {LINKS.map((link) => (
        <span key={link.key}>
          <span className="back-row-sep" aria-hidden="true">
            ·
          </span>
          {current === link.key ? (
            <span className="admin-nav-current" aria-current="page">
              {link.label}
            </span>
          ) : (
            <Link href={link.href}>{link.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}
