export function HowItWorks() {
  return (
    <section className="how-it-works" aria-labelledby="how-it-works-heading">
      <h2 id="how-it-works-heading">How lookup works</h2>
      <ol className="how-steps">
        <li>
          <h3>Search by VIN, plate, or chassis</h3>
          <p>
            We normalize your input and search the GhanaCarSpecs database first — the same path used for Ghana-focused
            vehicle intelligence and event history.
          </p>
        </li>
        <li>
          <h3>Local report when we have a match</h3>
          <p>
            A hit returns specs plus timeline events and risk-style signals (imports, accidents, service continuity,
            mileage checks) built from records on file.
          </p>
        </li>
        <li>
          <h3>Public VIN decode as fallback</h3>
          <p>
            If there is no local row and you entered a valid <strong>17-character VIN</strong>, we may call the public
            US NHTSA vPIC API and show manufacturer specifications on a separate page, clearly labeled as an external
            decode with no GhanaCarSpecs history. Plate and chassis searches never use this fallback.
          </p>
        </li>
      </ol>
    </section>
  );
}
