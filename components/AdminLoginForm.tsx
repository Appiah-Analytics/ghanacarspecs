"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Props = {
  adminConfigured: boolean;
};

export function AdminLoginForm({ adminConfigured }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = searchParams.get("from") || "/admin";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ secret }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (res.ok && data.ok) {
        router.push(redirectTo.startsWith("/admin") ? redirectTo : "/admin");
        router.refresh();
        return;
      }

      if (res.status === 503) {
        setError(data.error ?? "Admin protection is not configured on this server.");
        return;
      }

      setError(data.error ?? "Sign-in failed. Check your admin secret and try again.");
    } catch {
      setError("Could not reach the server. Is the dev server running?");
    } finally {
      setLoading(false);
    }
  }

  if (!adminConfigured) {
    return (
      <div className="alert error" role="alert">
        <p className="alert-title">Admin protection not configured</p>
        <p className="admin-help">
          Set an <strong>uncommented</strong> <span className="mono">ADMIN_API_KEY=...</span> or{" "}
          <span className="mono">ADMIN_PASSWORD=...</span> line in <span className="mono">.env</span> at the repo root
          (see <span className="mono">.env.example</span>), restart <span className="mono">npm run dev</span>, then
          reload this page.
        </p>
      </div>
    );
  }

  return (
    <section className="admin-card" aria-labelledby="admin-login-heading">
      <h2 id="admin-login-heading">Sign in</h2>
      <p className="admin-help">
        Enter the value of <span className="mono">ADMIN_API_KEY</span> or <span className="mono">ADMIN_PASSWORD</span>{" "}
        from your environment. This is not a user account — one shared secret per deployment.
      </p>

      <form className="lookup-form admin-login-form" onSubmit={onSubmit}>
        <label className="admin-login-label">
          Admin secret
          <input
            type="password"
            name="secret"
            autoComplete="current-password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="From ADMIN_API_KEY or ADMIN_PASSWORD"
            required
            disabled={loading}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {error ? (
        <div className="alert error" role="alert">
          <p className="alert-body">{error}</p>
        </div>
      ) : null}
    </section>
  );
}
