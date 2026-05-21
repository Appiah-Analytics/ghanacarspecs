type Props = {
  adminConfigured: boolean;
};

/** Temporary dev diagnostic — shows whether admin env is loaded, never the secret. */
export function AdminEnvDiagnostic({ adminConfigured }: Props) {
  let message: string;
  if (adminConfigured) {
    message = "Admin environment: configured (ADMIN_API_KEY or ADMIN_PASSWORD has a non-empty value).";
  } else {
    message =
      "Admin environment: not configured. Add an uncommented ADMIN_API_KEY=... or ADMIN_PASSWORD=... line in .env at the repo root, then restart npm run dev.";
  }

  return (
    <aside className="admin-env-diagnostic" aria-label="Admin environment status">
      <p className="admin-help">
        <strong>Env check:</strong> {message}
      </p>
    </aside>
  );
}
