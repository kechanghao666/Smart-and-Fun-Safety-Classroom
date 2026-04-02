import { Link } from "react-router-dom";
import { useAppState } from "../../state/AppState";
import { buildStudentAiReport } from "../../utils/studentAiReport";

export function StudentAiReportPage() {
  const { state } = useAppState();
  const report = buildStudentAiReport(state);

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--report">
        <div>
          <span className="hero-banner__eyebrow">AI 学习结果卡片</span>
          <h1>{report.headline}</h1>
          <p>{report.summary}</p>
        </div>
        <div className="result-medal result-medal--report">
          <strong>{report.scoreLabel}</strong>
          <span>{report.scoreCaption}</span>
        </div>
      </section>

      <section className="card-grid card-grid--three">
        <article className="surface-card report-card report-card--blue">
          <span className="section-block__eyebrow">学习进度</span>
          <h2>{report.progressLabel}</h2>
          <p>{report.encouragement}</p>
        </article>

        <article className="surface-card report-card report-card--mint">
          <span className="section-block__eyebrow">成长结果</span>
          <h2>{report.growthLabel}</h2>
          <p>当前积分 {state.progress.points}，成长值、星级和徽章都会继续累计。</p>
        </article>

        <article className="surface-card report-card report-card--orange">
          <span className="section-block__eyebrow">激励展示</span>
          <h2>已获得徽章</h2>
          <ul className="plain-list">
            {report.badges.map((badge) => (
              <li key={badge}>{badge}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card report-panel">
          <span className="section-block__eyebrow">这轮亮点</span>
          <h2>你已经做得不错的地方</h2>
          <div className="page-stack page-stack--compact">
            {report.strengths.map((strength) => (
              <article key={strength} className="feedback-box">
                <strong>亮点</strong>
                <p>{strength}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="surface-card report-panel">
          <span className="section-block__eyebrow">需要补强</span>
          <h2>把下一步复习说清楚</h2>
          <div className="page-stack page-stack--compact">
            {report.focusAreas.map((item) => (
              <article key={item.id} className="report-focus-item">
                <div className="row-between">
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.suggestion}</p>
                  </div>
                  <Link className="ghost-button link-button" to={item.href}>
                    {item.ctaLabel}
                  </Link>
                </div>
                <ul className="plain-list">
                  {item.prompts.map((prompt) => (
                    <li key={prompt}>{prompt}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">学习里程碑</span>
            <h2>把结果、成长和激励放到同一页</h2>
          </div>
        </div>

        <div className="card-grid card-grid--two">
          {report.milestones.map((milestone) => (
            <article key={milestone.id} className="report-milestone-card">
              <span className="section-block__eyebrow">{milestone.label}</span>
              <h3>{milestone.value}</h3>
              <p>{milestone.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">后续动作</span>
            <h2>看完结果页之后，下一步怎么走</h2>
          </div>
        </div>

        <div className="card-grid card-grid--three">
          {report.actions.map((action) => (
            <article key={action.id} className="report-action-card">
              <strong>{action.title}</strong>
              <p>{action.detail}</p>
              <Link className="ghost-button link-button" to={action.href}>
                {action.ctaLabel}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <div className="button-row">
        <Link className="ghost-button link-button" to="/student/theme/road-safety">
          返回主题页
        </Link>
        <Link className="ghost-button link-button" to="/student/records">
          查看学习记录
        </Link>
      </div>
    </div>
  );
}
