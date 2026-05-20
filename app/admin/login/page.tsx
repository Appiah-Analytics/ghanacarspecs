import Link from "next/link";
import { Suspense } from "react";
import { AdminEnvDiagnostic } from "@/components/AdminEnvDiagnostic";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { isAdminConfigured } from "@/lib/admin-auth";

export default function AdminLoginPage() {
  const adminConfigured = isAdminConfigured();

  return (
    <main className="page">
      <div className="back-row">
        <Link href="/">Back to lookup</Link>
      </div>

      <section className="hero">
        <h1>Admin sign-in</h1>
        <p>
          GhanaCarSpecs admin routes require a deployment secret. Public vehicle lookup does not use this sign-in.
        </p>
      </section>

      <AdminEnvDiagnostic adminConfigured={adminConfigured} />

      <Suspense fallback={<p className="admin-help">Loading…</p>}>
        <AdminLoginForm adminConfigured={adminConfigured} />
      </Suspense>
    </main>
  );
}
