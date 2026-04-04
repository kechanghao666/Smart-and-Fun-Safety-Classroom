import { Link } from "react-router-dom";
import { fetchAdminModules } from "../../services/admin";
import { useAppState } from "../../state/AppState";
import { useApiResource } from "../../utils/useApiResource";

const routeByModule: Record<string, string> = {
  theme: "/admin/themes",
  levels: "/admin/levels",
  "question-bank": "/admin/question-bank",
  "ai-copy": "/admin/ai-copy",
  users: "/admin/users",
  stats: "/admin/stats",
};

export function AdminDashboardPage() {
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const { data, error, isLoading, source } = useApiResource({
    enabled: canUseApi,
    fallbackData: [],
    fetcher: () => fetchAdminModules(state.authToken ?? ""),
    dependencies: [state.authToken],
  });
  const topPriorityModule =
    data.find((module) => module.id === "levels") ?? data[0] ?? null;
  const contentModuleCount = data.filter((module) =>
    ["theme", "levels", "question-bank", "ai-copy"].includes(module.id),
  ).length;
  const operationModuleCount = data.length - contentModuleCount;

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">管理员后台</span>
          <h1>内容维护、用户管理与数据统计入口</h1>
          <p>后台首页先用模块入口串起主题管理、关卡管理、题库、AI 文案、用户和统计。</p>
        </div>
      </section>

      <article className="feedback-box">
        <strong>{error ? "后台模块同步失败" : "后台模块已从后端加载"}</strong>
        <p>
          {isLoading
            ? "正在同步后台模块..."
            : error || "后台首页会根据当前内容状态自动更新模块概览。"}
        </p>
      </article>

      <section className="card-grid card-grid--four">
        <article className="surface-card stat-card admin-summary-card">
          <span>模块总数</span>
          <strong>{data.length}</strong>
          <p>当前后台统一承接主题、关卡、题库、AI 文案、用户和统计六个模块。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>内容配置模块</span>
          <strong>{contentModuleCount}</strong>
          <p>主题、关卡、题库和 AI 文案都集中在这一组模块里。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>运营管理模块</span>
          <strong>{operationModuleCount}</strong>
          <p>用户管理与数据统计共同支撑平台运营观察与账号维护。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>当前优先模块</span>
          <strong>{topPriorityModule?.title ?? "--"}</strong>
          <p>{topPriorityModule?.description ?? "当前暂无模块数据。"}</p>
        </article>
      </section>

      <section className="card-grid card-grid--three">
        {data.map((module) => (
          <article key={module.id} className="surface-card module-link-card">
            <span className="surface-tag">{module.status}</span>
            <h2>{module.title}</h2>
            <p>{module.description}</p>
            <p className="muted-copy">适用角色：{module.ownerSuggestion}</p>
            <Link className="ghost-button link-button" to={routeByModule[module.id]}>
              进入模块
            </Link>
          </article>
        ))}
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card admin-preview-card">
          <span className="section-block__eyebrow">当前优先级</span>
          <h2>先把最影响学生闭环的后台模块收稳</h2>
          <div className="page-stack page-stack--compact">
            <article className="feedback-box">
              <strong>当前最高优先：{topPriorityModule?.title ?? "--"}</strong>
              <p>
                {topPriorityModule
                  ? `${topPriorityModule.description}，建议负责人：${topPriorityModule.ownerSuggestion}。`
                  : "当前暂无模块数据。"}
              </p>
            </article>
            <article className="inline-summary-card">
              <strong>工作台状态</strong>
              <p>
                后台首页不仅是入口页，也承担“先看哪里、先做什么、先关注什么”的总览作用。
              </p>
            </article>
          </div>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">工作建议</span>
          <ul className="plain-list">
            <li>优先检查主题、关卡和题库内容是否完整、顺序是否正确。</li>
            <li>再统一核对 AI 文案、用户状态和统计口径。</li>
            <li>最后从后台回看学生端展示是否和配置保持一致。</li>
          </ul>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">使用提示</span>
          <ul className="plain-list">
            <li>主题、关卡、题库和 AI 文案建议按同一轮课程目标一起核对。</li>
            <li>用户管理页适合处理异常账号、备注说明和状态确认。</li>
            <li>统计页适合快速查看完成率、考试表现和成长趋势变化。</li>
          </ul>
        </article>
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">模块成熟度</span>
            <h2>把模块状态、职责和下一步动作放进同一张工作表</h2>
          </div>
        </div>

        <div className="module-status-grid">
          {data.map((module, index) => (
            <article key={`${module.id}-status`} className="module-status-card">
              <div className="row-between">
                <strong>{module.title}</strong>
                <span className="surface-tag">步骤 {index + 1}</span>
              </div>
              <p>{module.description}</p>
              <div className="chip-row">
                <span className="surface-tag">{module.status}</span>
                <span className="surface-tag">{module.ownerSuggestion}</span>
              </div>
              <Link className="ghost-button link-button" to={routeByModule[module.id]}>
                进入该模块
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
