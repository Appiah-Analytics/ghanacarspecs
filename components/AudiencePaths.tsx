import Link from "next/link";

type AudienceCard = {
  title: string;
  highlights: string[];
  href?: string;
  linkLabel?: string;
};

const AUDIENCE_CARDS: AudienceCard[] = [
  {
    title: "Check a vehicle before you buy",
    highlights: [
      "Review available history",
      "Compare vehicles",
      "Check mileage signals",
      "Review available evidence",
      "Print or download reports",
    ],
    href: "/compare",
    linkLabel: "Compare vehicles",
  },
  {
    title: "Provide trusted vehicle information",
    highlights: [
      "Share vehicle reports",
      "Build buyer confidence",
      "Present vehicle documentation",
      "Support transparent sales",
    ],
    href: "/partners",
    linkLabel: "Learn about partnerships",
  },
  {
    title: "Build digital vehicle history",
    highlights: [
      "Record service history",
      "Improve customer trust",
      "Create long-term maintenance records",
      "Support future resale value",
    ],
    href: "/partners",
    linkLabel: "Learn about partnerships",
  },
];

const AUDIENCE_LABELS = ["For Buyers", "For Dealers & Importers", "For Garages"] as const;

export function AudiencePaths() {
  return (
    <section className="audience-paths" aria-labelledby="audience-paths-heading">
      <h2 id="audience-paths-heading">Who GhanaCarSpecs is for</h2>
      <p className="audience-paths-intro">
        GhanaCarSpecs helps people verify what is known about a vehicle before money changes hands — with clear
        evidence, cautious risk signals, and honest limits on what the platform can confirm today.
      </p>

      <div className="audience-paths-grid">
        {AUDIENCE_CARDS.map((card, index) => (
          <article key={card.title} className="audience-card">
            <p className="audience-card-label">{AUDIENCE_LABELS[index]}</p>
            <h3>{card.title}</h3>
            <ul className="plain-list audience-card-list">
              {card.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {card.href && card.linkLabel ? (
              <p className="audience-card-link">
                <Link href={card.href}>{card.linkLabel}</Link>
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
