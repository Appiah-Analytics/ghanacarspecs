"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto max-w-2xl p-6">
          <h2 className="text-xl font-semibold">Application error</h2>
          <p className="mt-2 text-sm text-zinc-700">
            GhanaCarSpecs hit an unexpected issue. Please retry. If the problem persists, check server logs and include
            the request ID.
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
      </body>
    </html>
  );
}
