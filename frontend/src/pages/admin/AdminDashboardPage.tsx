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
        <strong>{source === "api" ? "后台模块列表来自后端" : "后台模块列表来自本地 mock"}</strong>
        <p>
          {isLoading
            ? "正在同步后台模块..."
            : error || "管理员首页已经预留真实接口读取能力。"}
        </p>
      </article>

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
        <article className="surface-card">
          <span className="section-block__eyebrow">首版建设顺序</span>
          <ul className="plain-list">
            <li>先完成主题、关卡和题库录入界面。</li>
            <li>再补 AI 文案模板配置和预览。</li>
            <li>最后接入用户管理与数据统计接口。</li>
          </ul>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">联调提醒</span>
          <ul className="plain-list">
            <li>字段命名优先和 `docs/v1-contracts.md` 保持一致。</li>
            <li>后台原型允许先用 localStorage 持久化，后续再换真实接口。</li>
            <li>AI 文案管理页中的模板结构应和后端代理接口保持可映射关系。</li>
          </ul>
        </article>
      </section>
    </div>
  );
}
