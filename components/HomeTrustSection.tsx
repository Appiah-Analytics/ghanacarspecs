export function HomeTrustSection() {
  return (
    <section className="home-trust" aria-labelledby="home-trust-heading">
      <h2 id="home-trust-heading">Trust and transparency first</h2>
      <p className="home-trust-lead">
        GhanaCarSpecs is designed as a Ghana vehicle trust and verification platform — not a black-box score or official
        registry replacement. Reports explain what evidence is on file, how confident we are, and what is still unknown.
      </p>
      <ul className="plain-list home-trust-list">
        <li>
          <strong>Published evidence only</strong> — public reports show moderated, published records with provenance and
          confidence context.
        </li>
        <li>
          <strong>Explainable signals</strong> — trust score, risk profile, and intelligence summaries include reasons you
          can read and question.
        </li>
        <li>
          <strong>Honest limits</strong> — we do not claim DVLA, insurer, police, or garage integration in this
          demonstration build.
        </li>
        <li>
          <strong>Shareable references</strong> — report references and print/PDF exports help buyers, sellers, and
          partners discuss the same vehicle record.
        </li>
      </ul>
    </section>
  );
}
