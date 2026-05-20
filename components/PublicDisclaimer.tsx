export function PublicDisclaimer() {
  return (
    <aside className="public-disclaimer" aria-label="Demo disclaimer">
      <h2>Public demo notice</h2>
      <p>
        Reports marked <strong>Local GhanaCarSpecs record</strong> use <strong>sample demonstration data</strong>{" "}
        only. They are not sourced from DVLA, insurers, police, garages, or other official Ghana records.
      </p>
      <p>
        Results labeled <strong>External VIN decoded record</strong> use the public US NHTSA vPIC API for manufacturer
        specifications on valid 17-character VINs. They do not include Ghana import, registration, service, accident, or
        other history held by GhanaCarSpecs.
      </p>
      <p>
        This demonstration build is intended for evaluation and product testing only. Production launch will require
        verified data partnerships and field-level provenance.
      </p>
    </aside>
  );
}
