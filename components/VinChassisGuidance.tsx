export function VinChassisGuidance() {
  return (
    <section className="lookup-guidance" aria-labelledby="vin-chassis-guidance-heading">
      <h2 id="vin-chassis-guidance-heading">Where do I find my VIN or chassis number?</h2>
      <p className="lookup-guidance-intro">
        Many vehicles in Ghana, especially Japanese imports, may be identified by <strong>chassis or frame number</strong>{" "}
        rather than a U.S.-style 17-character VIN. GhanaCarSpecs supports <strong>VIN</strong>,{" "}
        <strong>plate number</strong>, and <strong>chassis</strong> lookup — a vehicle without a 17-character VIN is
        not invalid; it may simply use a different identifier on file.
      </p>
      <p className="lookup-guidance-intro">
        Check the car itself or your paperwork for whichever identifier you have. Plate numbers are also supported when
        registration details are available.
      </p>

      <div className="lookup-guidance-grid">
        <div>
          <h3>On the vehicle</h3>
          <ul className="plain-list">
            <li>
              <strong>Driver-side door frame</strong> — open the door and check the sticker or metal plate on the frame
              (common on many imports and locally assembled cars).
            </li>
            <li>
              <strong>Windshield or dashboard area</strong> — some vehicles show the VIN through the windscreen at the
              base of the dashboard on the driver&apos;s side.
            </li>
            <li>
              <strong>Engine bay or chassis rail</strong> — on older or commercial vehicles, the chassis number may be
              stamped on the frame; a mechanic or inspector can help you locate it.
            </li>
          </ul>
        </div>
        <div>
          <h3>On documents</h3>
          <ul className="plain-list">
            <li>Vehicle registration or renewal paperwork</li>
            <li>Customs or import clearance documents (especially for used imports)</li>
            <li>Insurance or finance paperwork (where the insurer listed the vehicle identifiers)</li>
            <li>Bill of sale or dealer invoice (if available)</li>
          </ul>
        </div>
      </div>

      <div className="lookup-guidance-try">
        <h3>What you can enter here</h3>
        <ul className="lookup-options">
          <li>
            <strong>VIN</strong> — usually 17 characters (letters and numbers)
          </li>
          <li>
            <strong>Ghana plate number</strong> — e.g. formats like <span className="mono">GR-1234-21</span>
          </li>
          <li>
            <strong>Chassis number</strong> — as printed on the vehicle or documents (spacing and capitals usually do not
            matter)
          </li>
        </ul>
      </div>

      <p className="lookup-guidance-note">
        GhanaCarSpecs does not yet connect to DVLA, insurers, police, garages, or dealer systems. This demonstration uses
        a limited sample database.{" "}
        <strong>
          If your real Ghana vehicle is not found, it may simply mean the demo database does not contain that record
          yet.
        </strong>
      </p>
    </section>
  );
}
