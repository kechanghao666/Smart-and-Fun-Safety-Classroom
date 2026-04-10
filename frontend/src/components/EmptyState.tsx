import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <article className="empty-state">
      <span className="empty-state__icon">·</span>
      <strong>{title}</strong>
      <p>{description}</p>
      {action ? <div className="empty-state__action">{action}</div> : null}
    </article>
  );
}
