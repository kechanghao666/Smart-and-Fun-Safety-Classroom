import type { ReactNode } from "react";

type WorkbenchTone = "teacher" | "admin" | "neutral";

interface DataWorkbenchProps {
  eyebrow: string;
  title: string;
  description?: string;
  tone?: WorkbenchTone;
  toolbar?: ReactNode;
  children: ReactNode;
}

export function DataWorkbench({
  eyebrow,
  title,
  description,
  tone = "neutral",
  toolbar,
  children,
}: DataWorkbenchProps) {
  return (
    <section className={`data-workbench data-workbench--${tone}`}>
      <div className="data-workbench__header">
        <div>
          <span className="section-block__eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {toolbar ? <div className="data-workbench__toolbar">{toolbar}</div> : null}
      </div>
      <div className="data-workbench__content">{children}</div>
    </section>
  );
}
