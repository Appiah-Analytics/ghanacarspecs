import { VERIFICATION_CAPABILITIES, VERIFICATION_NOT_YET } from "@/lib/trust-content";

export function VerificationStatus() {
  return (
    <section className="report-section verification-status" aria-labelledby="verification-status-heading">
      <h3 id="verification-status-heading" className="report-section-title">
        What GhanaCarSpecs can verify today
      </h3>
      <p className="report-section-lead">Realistic expectations for this platform version.</p>

      <div className="verification-columns">
        <div className="verification-column">
          <h4 className="verification-column-title">Current capabilities</h4>
          <ul className="verification-list verification-list-yes">
            {VERIFICATION_CAPABILITIES.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="verification-column">
          <h4 className="verification-column-title">Not yet available</h4>
          <ul className="verification-list verification-list-no">
            {VERIFICATION_NOT_YET.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
