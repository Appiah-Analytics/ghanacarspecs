"use client";

import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="mt-2 text-sm text-zinc-700">
        We could not complete that action. Please try again. If the issue keeps happening, share the request ID
        with support.
      </p>
      {error.digest ? (
        <p className="mt-3 rounded bg-zinc-100 px-3 py-2 text-xs text-zinc-700">
          Request ID: <span className="font-mono">{error.digest}</span>
        </p>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Retry
      </button>
    </main>
  );
}
