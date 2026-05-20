import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-brand">
          <span className="site-brand-name">GhanaCarSpecs</span>
          <span className="site-brand-tagline">Vehicle intelligence for Ghana</span>
        </Link>
      </div>
    </header>
  );
}
