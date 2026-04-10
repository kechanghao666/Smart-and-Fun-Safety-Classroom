export interface InsightListItem {
  title: string;
  detail: string;
}

interface InsightListProps {
  eyebrow: string;
  title: string;
  items: InsightListItem[];
}

export function InsightList({ eyebrow, title, items }: InsightListProps) {
  return (
    <section className="insight-list">
      <div className="insight-list__header">
        <span className="section-block__eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <div className="insight-list__items">
        {items.map((item) => (
          <article key={`${item.title}-${item.detail}`} className="insight-list__item">
            <strong>{item.title}</strong>
            <p>{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
