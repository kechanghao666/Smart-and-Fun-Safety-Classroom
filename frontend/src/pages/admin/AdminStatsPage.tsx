import { adminStatMetrics, teacherClassSummaries } from "../../data/mockData";

export function AdminStatsPage() {
  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">数据统计</span>
          <h1>查看访问量、完成率、成绩和班级表现</h1>
          <p>当前为轻量图表原型，后续可直接替换成真实统计接口返回。</p>
        </div>
      </section>

      <section className="card-grid card-grid--three">
        {adminStatMetrics.map((metric) => (
          <article
            key={metric.id}
            className={`surface-card report-card report-card--${metric.accent}`}
          >
            <span className="section-block__eyebrow">{metric.label}</span>
            <h2>{metric.value}</h2>
            <p>{metric.trend}</p>
          </article>
        ))}
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">班级趋势</span>
            <h2>按班级查看三关完成率与考试完成率</h2>
          </div>
        </div>

        <div className="bar-list">
          {teacherClassSummaries.map((classroom) => (
            <article key={classroom.id} className="bar-item">
              <div className="row-between">
                <strong>{classroom.name}</strong>
                <span>三关 {classroom.completedRate}% · 考试 {classroom.examCompletionRate}%</span>
              </div>
              <div className="bar-item__track">
                <span
                  className="bar-item__fill"
                  style={{ width: `${classroom.completedRate}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
