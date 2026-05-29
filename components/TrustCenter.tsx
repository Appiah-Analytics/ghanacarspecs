import { CONFIDENCE_HELP, PROVENANCE_HELP, VISIBILITY_RULES } from "@/lib/trust-content";

const PROVENANCE_ORDER = [
  "IMPORTER",
  "DEALER",
  "AUCTION",
  "USER_SUBMITTED",
  "GOVERNMENT",
  "INSURER",
  "POLICE",
  "INTERNAL",
  "OTHER",
  "DEMO",
] as const;

export function TrustCenter() {
  return (
    <section className="report-section trust-center" aria-labelledby="trust-center-heading">
      <h3 id="trust-center-heading" className="report-section-title">
        Trust center
      </h3>
      <p className="report-section-lead">
        How to read confidence and provenance on this report. These labels help you judge evidence quality — they are
        not legal verdicts.
      </p>

      <div className="trust-center-block">
        <h4 className="trust-center-subtitle">How confidence works</h4>
        <dl className="trust-def-list">
          {(Object.keys(CONFIDENCE_HELP) as Array<keyof typeof CONFIDENCE_HELP>).map((level) => {
            const item = CONFIDENCE_HELP[level];
            return (
              <div key={level} className="trust-def-item">
                <dt>{level}</dt>
                <dd>
                  {item.summary}
                  {item.note ? <p className="trust-def-note">{item.note}</p> : null}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>

      <div className="trust-center-block">
        <h4 className="trust-center-subtitle">How provenance works</h4>
        <p className="trust-center-intro">
          Provenance describes where evidence was attributed to come from. It explains category — not automatic
          official confirmation.
        </p>
        <dl className="trust-def-list">
          {PROVENANCE_ORDER.map((key) => {
            const item = PROVENANCE_HELP[key];
            return (
              <div key={key} className="trust-def-item">
                <dt>{key.replace(/_/g, " ")}</dt>
                <dd>
                  {item.means}
                  <p className="trust-def-caveat">Not guaranteed: {item.doesNotGuarantee}</p>
                </dd>
              </div>
            );
          })}
        </dl>
      </div>

      <div className="trust-center-block">
        <h4 className="trust-center-subtitle">Visibility rules</h4>
        <ul className="trust-bullet-list">
          {VISIBILITY_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
