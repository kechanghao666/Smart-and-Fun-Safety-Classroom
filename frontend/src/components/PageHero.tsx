import type { ReactNode } from "react";

type PageHeroTone = "student" | "teacher" | "admin" | "neutral";

export interface PageHeroStat {
  label: string;
  value: string;
}

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  tone?: PageHeroTone;
  stats?: PageHeroStat[];
  actions?: ReactNode;
  aside?: ReactNode;
}

export function PageHero({
  eyebrow,
  title,
  description,
  tone = "neutral",
  stats = [],
  actions,
  aside,
}: PageHeroProps) {
  return (
    <section className={`page-hero page-hero--${tone}`}>
      <div className="page-hero__main">
        <span className="page-hero__eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>

        {stats.length > 0 ? (
          <div className="page-hero__stats">
            {stats.map((item) => (
              <article key={`${item.label}-${item.value}`} className="page-hero__stat">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>
        ) : null}

        {actions ? <div className="page-hero__actions">{actions}</div> : null}
      </div>

      {aside ? <aside className="page-hero__aside">{aside}</aside> : null}
    </section>
  );
}
