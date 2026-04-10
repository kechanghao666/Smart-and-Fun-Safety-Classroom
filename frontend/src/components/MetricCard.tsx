type MetricTone = "student" | "teacher" | "admin" | "neutral";

interface MetricCardProps {
  label: string;
  value: string;
  description: string;
  tone?: MetricTone;
}

export function MetricCard({
  label,
  value,
  description,
  tone = "neutral",
}: MetricCardProps) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <span className="metric-card__label">{label}</span>
      <strong className="metric-card__value">{value}</strong>
      <p className="metric-card__description">{description}</p>
    </article>
  );
}
