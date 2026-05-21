"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminSignOut() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    try {
      await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" className="link-button" onClick={signOut} disabled={loading}>
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
