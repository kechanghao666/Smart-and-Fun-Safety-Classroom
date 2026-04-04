import type { ReactNode } from "react";

type StudentHeroAccent = "sky" | "mint" | "orange";
type StudentHeroVariant = "home" | "theme" | "level" | "exam" | "result" | "profile";

interface StudentHeroStat {
  label: string;
  value: string;
  accent?: StudentHeroAccent;
}

interface StudentAdventureHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  bubbleTitle: string;
  bubbleText: string;
  mascotLabel: string;
  mascotHint?: string;
  accent?: StudentHeroAccent;
  variant?: StudentHeroVariant;
  stats?: StudentHeroStat[];
  actions?: ReactNode;
  aside?: ReactNode;
}

export function StudentAdventureHero({
  eyebrow,
  title,
  description,
  bubbleTitle,
  bubbleText,
  mascotLabel,
  mascotHint,
  accent = "sky",
  variant = "home",
  stats = [],
  actions,
  aside,
}: StudentAdventureHeroProps) {
  return (
    <section
      className={`student-adventure-hero student-adventure-hero--${variant} student-adventure-hero--${accent}`}
    >
      <div className="student-adventure-hero__copy">
        <span className="student-adventure-hero__eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>

        {stats.length > 0 ? (
          <div className="student-adventure-hero__stats">
            {stats.map((item) => (
              <article
                key={`${item.label}-${item.value}`}
                className={`student-adventure-stat student-adventure-stat--${item.accent ?? accent}`}
              >
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>
        ) : null}

        {actions ? <div className="student-adventure-hero__actions">{actions}</div> : null}
      </div>

      <div className="student-adventure-hero__scene">
        <div className="student-adventure-hero__cloud student-adventure-hero__cloud--one" />
        <div className="student-adventure-hero__cloud student-adventure-hero__cloud--two" />
        <div className="student-adventure-hero__spark student-adventure-hero__spark--one" />
        <div className="student-adventure-hero__spark student-adventure-hero__spark--two" />
        <div className="student-adventure-hero__spark student-adventure-hero__spark--three" />
        <div className="student-adventure-hero__road" />
        <div className="student-adventure-hero__sign" />

        <div className={`student-mascot student-mascot--${accent}`}>
          <div className="student-mascot__head">
            <span className="student-mascot__eye" />
            <span className="student-mascot__eye" />
            <span className="student-mascot__smile" />
          </div>
          <div className="student-mascot__body">
            <span className="student-mascot__badge">{mascotLabel}</span>
          </div>
        </div>

        <article className="student-adventure-bubble">
          <span className="student-adventure-bubble__eyebrow">{bubbleTitle}</span>
          <strong>{bubbleText}</strong>
          {mascotHint ? <p>{mascotHint}</p> : null}
        </article>

        {aside ? <div className="student-adventure-hero__aside">{aside}</div> : null}
      </div>
    </section>
  );
}
