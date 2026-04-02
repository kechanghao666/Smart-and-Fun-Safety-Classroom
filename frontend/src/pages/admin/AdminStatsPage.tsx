import { adminStatMetrics, teacherClassSummaries } from "../../data/mockData";
import { fetchAdminStats } from "../../services/admin";
import { useAppState } from "../../state/AppState";
import { useApiResource } from "../../utils/useApiResource";

const fallbackStats = {
  metrics: adminStatMetrics,
  classSummaries: teacherClassSummaries,
};

export function AdminStatsPage() {
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const { data, error, isLoading, source } = useApiResource({
    enabled: canUseApi,
    fallbackData: fallbackStats,
    fetcher: () => fetchAdminStats(state.authToken ?? ""),
    dependencies: [state.authToken],
  });

  const trackedClassCount = data.classSummaries.length;
  const topMetric = data.metrics[0] ?? null;
  const topClass =
    data.classSummaries
      .slice()
      .sort((left, right) => right.completedRate - left.completedRate)[0] ?? null;
  const watchClass =
    data.classSummaries
      .slice()
      .sort((left, right) => left.examCompletionRate - right.examCompletionRate)[0] ?? null;

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">数据统计</span>
          <h1>查看访问量、完成率、成绩和班级趋势</h1>
          <p>这一页继续保持轻量图表工作台定位，把关键指标、班级对比和运营观察整理成更清晰的后台统计页。</p>
        </div>
      </section>

      <article className="feedback-box">
        <strong>{source === "api" ? "统计数据来自后端" : "统计数据来自本地 mock"}</strong>
        <p>
          {isLoading
            ? "正在同步统计数据..."
            : error || "数据统计页已经预留真实接口读取能力。"}
        </p>
      </article>

      <section className="card-grid card-grid--four">
        {data.metrics.map((metric) => (
          <article
            key={metric.id}
            className={`surface-card report-card report-card--${metric.accent}`}
          >
            <span className="section-block__eyebrow">{metric.label}</span>
            <h2>{metric.value}</h2>
            <p>{metric.trend}</p>
          </article>
        ))}
        <article className="surface-card stat-card admin-summary-card">
          <span>跟踪班级</span>
          <strong>{trackedClassCount}</strong>
          <p>{topMetric ? `当前优先关注：${topMetric.label}` : "当前暂无统计指标。"}</p>
        </article>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card admin-preview-card">
          <span className="section-block__eyebrow">运营观察</span>
          <h2>当前最值得关注的两个点</h2>
          <div className="page-stack page-stack--compact">
            <article className="feedback-box">
              <strong>完成率最高班级</strong>
              <p>
                {topClass
                  ? `${topClass.name}，三关完成率 ${topClass.completedRate}%。`
                  : "当前暂无班级统计数据。"}
              </p>
            </article>
            <article className="feedback-box">
              <strong>考试完成率偏低班级</strong>
              <p>
                {watchClass
                  ? `${watchClass.name}，考试完成率 ${watchClass.examCompletionRate}%，建议优先跟进。`
                  : "当前暂无班级统计数据。"}
              </p>
            </article>
          </div>
        </article>

        <article className="surface-card admin-preview-card">
          <span className="section-block__eyebrow">指标说明</span>
          <h2>当前统计页展示口径</h2>
          <ul className="plain-list">
            <li>主题访问量：反映学生进入主题页的整体热度。</li>
            <li>三关完成率：反映学生端主链路推进情况。</li>
            <li>考试平均分：反映主题考试的整体学习效果。</li>
            <li>班级对比：帮助教师和管理员快速识别需要优先支持的班级。</li>
          </ul>
        </article>
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">班级趋势</span>
            <h2>按班级对比三关完成率和考试完成率</h2>
          </div>
        </div>

        {data.classSummaries.length > 0 ? (
          <div className="trend-bars">
            {data.classSummaries.map((classroom) => (
              <article key={classroom.id} className="trend-bars__item">
                <div className="row-between">
                  <div>
                    <strong>{classroom.name}</strong>
                    <p className="teacher-analysis-card__meta">{classroom.focusLabel}</p>
                  </div>
                  <span className="surface-tag">{classroom.studentCount} 人</span>
                </div>

                <div className="bar-item__track">
                  <span
                    className="bar-item__fill"
                    style={{ width: `${classroom.completedRate}%` }}
                  />
                </div>
                <div className="row-between">
                  <span className="data-table__muted">三关完成率</span>
                  <strong>{classroom.completedRate}%</strong>
                </div>

                <div className="bar-item__track">
                  <span
                    className="bar-item__fill bar-item__fill--exam"
                    style={{ width: `${classroom.examCompletionRate}%` }}
                  />
                </div>
                <div className="row-between">
                  <span className="data-table__muted">考试完成率</span>
                  <strong>{classroom.examCompletionRate}%</strong>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <article className="feedback-box empty-state-card">
            <strong>当前没有班级统计</strong>
            <p>等待后端返回统计数据，或先使用本地演示数据初始化图表。</p>
          </article>
        )}
      </section>
    </div>
  );
}
