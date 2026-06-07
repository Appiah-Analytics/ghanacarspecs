"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type VehicleComparisonFormProps = {
  initialA?: string;
  initialB?: string;
};

export function VehicleComparisonForm({ initialA = "", initialB = "" }: VehicleComparisonFormProps) {
  const router = useRouter();
  const [vehicleA, setVehicleA] = useState(initialA);
  const [vehicleB, setVehicleB] = useState(initialB);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const a = vehicleA.trim();
    const b = vehicleB.trim();

    if (!a || !b) {
      setError("Enter an identifier for both Vehicle A and Vehicle B.");
      return;
    }

    if (a.toLowerCase() === b.toLowerCase()) {
      setError("Choose two different vehicles to compare.");
      return;
    }

    setError(null);
    const params = new URLSearchParams({ a, b });
    router.push(`/compare?${params.toString()}`);
  }

  return (
    <form className="compare-form admin-card" onSubmit={onSubmit} aria-labelledby="compare-form-heading">
      <h2 id="compare-form-heading">Compare two vehicles</h2>
      <p className="admin-help">
        Enter a VIN, Ghana plate number, or chassis number for each vehicle. Comparison uses published GhanaCarSpecs
        records only.
      </p>

      <div className="compare-form-grid">
        <label className="compare-field">
          Vehicle A
          <input
            type="text"
            name="vehicleA"
            value={vehicleA}
            onChange={(e) => setVehicleA(e.target.value)}
            placeholder="VIN, plate, or chassis"
            autoComplete="off"
            spellCheck={false}
            required
          />
        </label>
        <label className="compare-field">
          Vehicle B
          <input
            type="text"
            name="vehicleB"
            value={vehicleB}
            onChange={(e) => setVehicleB(e.target.value)}
            placeholder="VIN, plate, or chassis"
            autoComplete="off"
            spellCheck={false}
            required
          />
        </label>
      </div>

      {error ? (
        <p className="alert error compare-form-error" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit">Compare vehicles</button>
    </form>
  );
}
