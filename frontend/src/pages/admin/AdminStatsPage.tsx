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

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">数据统计</span>
          <h1>查看访问量、完成率、成绩和班级表现</h1>
          <p>当前是轻量图表工作台，后续可以直接切换成真实统计接口返回。</p>
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

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">班级趋势</span>
            <h2>按班级查看三关完成率与考试完成率</h2>
          </div>
        </div>

        {data.classSummaries.length > 0 ? (
          <div className="bar-list">
            {data.classSummaries.map((classroom) => (
              <article key={classroom.id} className="bar-item">
                <div className="row-between">
                  <strong>{classroom.name}</strong>
                  <span>三关 {classroom.completedRate}% / 考试 {classroom.examCompletionRate}%</span>
                </div>
                <div className="bar-item__track">
                  <span
                    className="bar-item__fill"
                    style={{ width: `${classroom.completedRate}%` }}
                  />
                </div>
                <p>{classroom.focusLabel}</p>
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
