import { TRUST_SCORE_DISCLAIMER, type VehicleTrustScore } from "@/lib/vehicle-trust-score";

type VehicleTrustScoreProps = {
  trustScore: VehicleTrustScore;
  variant?: "public" | "admin";
};

function bandClassName(band: VehicleTrustScore["band"]): string {
  switch (band) {
    case "Strong":
      return "trust-score-strong";
    case "Moderate":
      return "trust-score-moderate";
    case "Limited":
      return "trust-score-limited";
    default:
      return "trust-score-weak";
  }
}

export function VehicleTrustScorePanel({ trustScore, variant = "public" }: VehicleTrustScoreProps) {
  const lead = trustScore.reasons[0] ?? "Record confidence summary";
  const reasons = trustScore.reasons.slice(1);

  return (
    <section
      className={`report-section vehicle-trust-score ${bandClassName(trustScore.band)}`}
      aria-labelledby={variant === "admin" ? "admin-trust-score-heading" : "trust-score-heading"}
    >
      <h3
        id={variant === "admin" ? "admin-trust-score-heading" : "trust-score-heading"}
        className="report-section-title"
      >
        {variant === "admin" ? "Vehicle trust score" : "Trust score"}
      </h3>

      <div className="trust-score-header">
        <p className="trust-score-value">
          Trust score: <strong>{trustScore.score}</strong> / 100
        </p>
        <p className="trust-score-band">{lead}</p>
      </div>

      {reasons.length > 0 ? (
        <div className="trust-score-block">
          <h4 className="trust-score-subtitle">Why</h4>
          <ul className="plain-list trust-score-list">
            {reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {trustScore.cautions.length > 0 ? (
        <div className="trust-score-block">
          <h4 className="trust-score-subtitle">Caution</h4>
          <ul className="plain-list trust-score-list trust-score-cautions">
            {trustScore.cautions.map((caution) => (
              <li key={caution}>{caution}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="trust-score-disclaimer" role="note">
        {TRUST_SCORE_DISCLAIMER}
      </p>
    </section>
  );
}
