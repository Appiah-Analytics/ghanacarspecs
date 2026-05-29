import { TRANSPARENCY_STATEMENT } from "@/lib/trust-content";

export function TransparencyStatement() {
  return (
    <aside className="transparency-statement" aria-label="Transparency statement">
      <p>{TRANSPARENCY_STATEMENT}</p>
    </aside>
  );
}
