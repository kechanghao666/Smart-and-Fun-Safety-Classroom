import { Link } from "react-router-dom";
import { adminModules } from "../../data/mockData";
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
    fallbackData: adminModules,
    fetcher: () => fetchAdminModules(state.authToken ?? ""),
    dependencies: [state.authToken],
  });
  const startedCount = data.filter((module) => module.status !== "待接口").length;
  const pendingCount = data.length - startedCount;
  const topPriorityModule =
    data.find((module) => module.id === "levels") ?? data[0] ?? null;
  const localEditableCount = data.filter((module) =>
    ["theme", "levels", "question-bank", "ai-copy"].includes(module.id),
  ).length;

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
        <strong>{source === "api" ? "后台模块列表已接入服务数据" : "后台模块列表当前使用预置数据"}</strong>
        <p>
          {isLoading
            ? "正在同步后台模块..."
            : error || "后台首页会根据当前数据来源自动更新模块状态。"}
        </p>
      </article>

      <section className="card-grid card-grid--four">
        <article className="surface-card stat-card admin-summary-card">
          <span>模块总数</span>
          <strong>{data.length}</strong>
          <p>当前后台统一承接主题、关卡、题库、AI 文案、用户和统计六个模块。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>已进入实施</span>
          <strong>{startedCount}</strong>
          <p>这些模块已经具备正式页面结构，适合继续做字段冻结和数据接入。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>本地可编辑</span>
          <strong>{localEditableCount}</strong>
          <p>主题、关卡、题库和 AI 文案已具备显式保存与预览流程。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>待接入数据</span>
          <strong>{pendingCount}</strong>
          <p>用户管理和统计页已留好读取接口，后续可直接切真实数据源。</p>
        </article>
      </section>

      <section className="card-grid card-grid--three">
        {data.map((module) => (
          <article key={module.id} className="surface-card module-link-card">
            <span className="surface-tag">{module.status}</span>
            <h2>{module.title}</h2>
            <p>{module.description}</p>
            <p className="muted-copy">建议 owner：{module.ownerSuggestion}</p>
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
                后台首页现在不仅是入口页，也承担“看清当前模块成熟度、谁来接手、下一步先做什么”的指挥板作用。
              </p>
            </article>
          </div>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">首版建设顺序</span>
          <ul className="plain-list">
            <li>先完成主题、关卡和题库录入界面。</li>
            <li>再补 AI 文案模板配置和预览。</li>
            <li>最后接入用户管理与数据统计接口。</li>
          </ul>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">数据说明</span>
          <ul className="plain-list">
            <li>字段命名优先和 `docs/v1-contracts.md` 保持一致。</li>
            <li>后台原型允许先用 localStorage 持久化，后续再换真实接口。</li>
            <li>AI 文案管理页中的模板结构应和后端代理接口保持可映射关系。</li>
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
