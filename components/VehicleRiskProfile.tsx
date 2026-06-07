import {
  formatRiskProfileHeadline,
  RISK_PROFILE_DISCLAIMER,
  RISK_PROFILE_TRUST_NOTE,
  type VehicleRiskProfile,
} from "@/lib/vehicle-risk-profile";

type VehicleRiskProfileProps = {
  riskProfile: VehicleRiskProfile;
  variant?: "public" | "admin";
};

function levelClassName(level: VehicleRiskProfile["level"]): string {
  switch (level) {
    case "Low":
      return "risk-profile-low";
    case "Moderate":
      return "risk-profile-moderate";
    case "Elevated":
      return "risk-profile-elevated";
    default:
      return "risk-profile-high";
  }
}

export function VehicleRiskProfilePanel({ riskProfile, variant = "public" }: VehicleRiskProfileProps) {
  return (
    <section
      className={`report-section vehicle-risk-profile ${levelClassName(riskProfile.level)}`}
      aria-labelledby={variant === "admin" ? "admin-risk-profile-heading" : "risk-profile-heading"}
    >
      <h3
        id={variant === "admin" ? "admin-risk-profile-heading" : "risk-profile-heading"}
        className="report-section-title"
      >
        {variant === "admin" ? "Vehicle risk profile" : "Vehicle risk profile"}
      </h3>

      <div className="risk-profile-header">
        <p className="risk-profile-value">
          {formatRiskProfileHeadline(riskProfile)}
        </p>
        <p className="risk-profile-trust-note">{RISK_PROFILE_TRUST_NOTE}</p>
      </div>

      {riskProfile.riskFactors.length > 0 ? (
        <div className="risk-profile-block">
          <h4 className="risk-profile-subtitle">Risk factors</h4>
          <ul className="plain-list risk-profile-list">
            {riskProfile.riskFactors.map((factor) => (
              <li key={factor}>{factor}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {riskProfile.positiveSignals.length > 0 ? (
        <div className="risk-profile-block">
          <h4 className="risk-profile-subtitle">Positive signals</h4>
          <ul className="plain-list risk-profile-list risk-profile-positive">
            {riskProfile.positiveSignals.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {riskProfile.recommendations.length > 0 ? (
        <div className="risk-profile-block">
          <h4 className="risk-profile-subtitle">Recommendations</h4>
          <ul className="plain-list risk-profile-list">
            {riskProfile.recommendations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {riskProfile.cautions.length > 0 ? (
        <div className="risk-profile-block">
          <h4 className="risk-profile-subtitle">Caution</h4>
          <ul className="plain-list risk-profile-list risk-profile-cautions">
            {riskProfile.cautions.map((caution) => (
              <li key={caution}>{caution}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="risk-profile-disclaimer" role="note">
        {RISK_PROFILE_DISCLAIMER}
      </p>
    </section>
  );
}
