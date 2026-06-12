import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>
        GhanaCarSpecs — Ghana vehicle trust and verification platform. Demo build: sample local records plus public VIN
        decoding when no local history is on file.
      </p>
      <p className="site-footer-links">
        <Link href="/partners">Partners</Link>
      </p>
    </footer>
  );
}
