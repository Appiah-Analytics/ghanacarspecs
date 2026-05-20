"use client";

import { FILL_LOOKUP_EVENT } from "@/components/LookupForm";
import { EXTERNAL_DEMO_VIN } from "@/lib/lookup-messages";

type Example = {
  label: string;
  value: string;
  outcome: string;
  kind: "local" | "external" | "miss" | "error";
};

const EXAMPLES: Example[] = [
  {
    label: "Toyota Camry (local record)",
    value: "4T1BE46K37U123456",
    outcome: "Full GhanaCarSpecs report with sample history and intelligence",
    kind: "local",
  },
  {
    label: "Plate lookup",
    value: "GR-1234-21",
    outcome: "Same Toyota record via Ghana plate number",
    kind: "local",
  },
  {
    label: "Chassis lookup",
    value: "BE46K37U123456",
    outcome: "Same Toyota record via chassis number",
    kind: "local",
  },
  {
    label: "Volkswagen Golf (accident flag)",
    value: "WVWZZZ3CZWE123456",
    outcome: "Local report with accident/claim indicators in intelligence",
    kind: "local",
  },
  {
    label: "External VIN decode",
    value: EXTERNAL_DEMO_VIN,
    outcome:
      "Public NHTSA vPIC manufacturer specs only (17-character VIN) — clearly labeled, no GhanaCarSpecs history",
    kind: "external",
  },
  {
    label: "Real Ghana plate (not in demo DB)",
    value: "GR-9999-99",
    outcome:
      "Explains no local record yet — demo has limited sample data only; not DVLA or official Ghana sources",
    kind: "miss",
  },
  {
    label: "Demo plate (not found)",
    value: "XX-0000-00",
    outcome: "Same no-local-record message — plates never trigger external VIN decode",
    kind: "miss",
  },
];

function fillLookup(value: string) {
  window.dispatchEvent(new CustomEvent(FILL_LOOKUP_EVENT, { detail: { value } }));
  const input = document.getElementById("vehicle-lookup-input");
  input?.focus();
}

export function DemoExamples() {
  return (
    <section className="demo-section" aria-labelledby="demo-examples-heading">
      <h2 id="demo-examples-heading">Try the demo</h2>
      <p className="demo-intro">
        These examples use the same sample data as our internal QA guide. Click <strong>Try</strong> to fill the
        lookup box, then press <strong>Look up</strong>.
      </p>

      <ul className="demo-list">
        {EXAMPLES.map((example) => (
          <li key={example.value} className={`demo-item demo-item-${example.kind}`}>
            <div className="demo-item-main">
              <h3>{example.label}</h3>
              <p className="demo-outcome">{example.outcome}</p>
              <code className="demo-value mono">{example.value}</code>
            </div>
            <button type="button" className="demo-try-btn" onClick={() => fillLookup(example.value)}>
              Try
            </button>
          </li>
        ))}
      </ul>

      <p className="demo-footnote">
        More test values (including invalid VIN for error handling) are listed in{" "}
        <code className="mono">docs/sample_data.md</code> in the repository.
      </p>
    </section>
  );
}
