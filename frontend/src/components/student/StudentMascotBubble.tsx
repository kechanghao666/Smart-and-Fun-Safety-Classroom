import type { ReactNode } from "react";

type StudentBubbleAccent = "sky" | "mint" | "orange";

interface StudentMascotBubbleProps {
  eyebrow: string;
  title: string;
  message: string;
  accent?: StudentBubbleAccent;
  notice?: string;
  actions?: ReactNode;
}

export function StudentMascotBubble({
  eyebrow,
  title,
  message,
  accent = "sky",
  notice,
  actions,
}: StudentMascotBubbleProps) {
  return (
    <article className={`student-mascot-bubble student-mascot-bubble--${accent}`}>
      <div className="student-mascot-bubble__icon">
        <span />
        <span />
        <span />
      </div>
      <div className="student-mascot-bubble__content">
        <span className="student-mascot-bubble__eyebrow">{eyebrow}</span>
        <h3>{title}</h3>
        <p>{message}</p>
        {notice ? <p className="student-mascot-bubble__notice">{notice}</p> : null}
        {actions ? <div className="student-mascot-bubble__actions">{actions}</div> : null}
      </div>
    </article>
  );
}
