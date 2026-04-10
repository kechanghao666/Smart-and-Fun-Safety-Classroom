import { Link } from "react-router-dom";
import { DataWorkbench } from "../../components/DataWorkbench";
import { EmptyState } from "../../components/EmptyState";
import { InsightList } from "../../components/InsightList";
import { MetricCard } from "../../components/MetricCard";
import { PageHero } from "../../components/PageHero";
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
  const { data, error, isLoading } = useApiResource({
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
  const workSuggestions = [
    {
      title: "先核内容链路",
      detail: "优先检查主题、关卡和题库是否一致，避免学生端看到错位内容。",
    },
    {
      title: "再看 AI 与用户",
      detail: "统一核对 AI 文案、用户状态和成长规则，降低运营噪音。",
    },
    {
      title: "最后看数据趋势",
      detail: "从统计页回看完成率和异常列表，再决定下一轮配置重点。",
    },
  ];

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="管理员后台"
        title="把内容、用户和统计放进同一张控制台"
        description="后台首页不只是入口集合，而是先告诉你哪里最关键、哪个模块最值得先点开。"
        tone="admin"
        stats={[
          { label: "模块总数", value: `${data.length}` },
          { label: "内容模块", value: `${contentModuleCount}` },
          { label: "运营模块", value: `${operationModuleCount}` },
        ]}
        actions={
          topPriorityModule ? (
            <Link
              className="primary-button link-button"
              to={routeByModule[topPriorityModule.id]}
            >
              先打开 {topPriorityModule.title}
            </Link>
          ) : null
        }
        aside={
          <div className="admin-hero-priority">
            <span className="section-block__eyebrow">当前优先模块</span>
            <strong>{topPriorityModule?.title ?? "等待模块同步"}</strong>
            <p>{topPriorityModule?.description ?? "模块同步完成后，这里会自动出现重点入口。"}</p>
          </div>
        }
      />

      <section className="card-grid card-grid--four">
        <MetricCard
          label="模块总数"
          value={`${data.length}`}
          description="当前后台统一承接主题、关卡、题库、AI 文案、用户和统计六个模块。"
          tone="admin"
        />
        <MetricCard
          label="内容配置"
          value={`${contentModuleCount}`}
          description="主题、关卡、题库和 AI 文案都集中在这一组模块里。"
          tone="admin"
        />
        <MetricCard
          label="运营管理"
          value={`${operationModuleCount}`}
          description="用户管理与数据统计共同支撑平台运营观察与账号维护。"
          tone="admin"
        />
        <MetricCard
          label="当前优先"
          value={topPriorityModule?.title ?? "--"}
          description={topPriorityModule?.description ?? "当前暂无模块数据。"}
          tone="admin"
        />
      </section>

      <section className="card-grid card-grid--two">
        <DataWorkbench
          eyebrow="模块工作台"
          title="先看模块职责，再决定点哪一块"
          description="把模块状态、用途和角色建议放在同一张后台工作表里。"
          tone="admin"
        >
          {data.length > 0 ? (
            <div className="admin-module-grid">
              {data.map((module) => (
                <article
                  key={module.id}
                  className="module-link-card module-link-card--compact"
                >
                  <div className="row-between">
                    <strong>{module.title}</strong>
                    <span className="surface-tag">{module.status}</span>
                  </div>
                  <p>{module.description}</p>
                  <span className="muted-copy">建议负责人：{module.ownerSuggestion}</span>
                  <Link className="ghost-button link-button" to={routeByModule[module.id]}>
                    进入模块
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="当前还没有后台模块数据"
              description="等待后台模块同步完成后，这里会自动出现完整入口。"
            />
          )}
        </DataWorkbench>

        <div className="page-stack">
          <InsightList
            eyebrow="工作建议"
            title="这一轮先这样推进最稳"
            items={workSuggestions}
          />

          <DataWorkbench
            eyebrow="控制台说明"
            title="后台首页应该解决哪三件事"
            tone="admin"
          >
            <div className="admin-guideline-grid">
              <article className="admin-preview-card admin-preview-card--compact">
                <strong>先看哪里</strong>
                <p>用当前优先模块快速决定今天要先修配置还是先看统计。</p>
              </article>
              <article className="admin-preview-card admin-preview-card--compact">
                <strong>谁来处理</strong>
                <p>每个模块都保留负责人建议，减少后台协作时的信息断层。</p>
              </article>
              <article className="admin-preview-card admin-preview-card--compact">
                <strong>做完看什么</strong>
                <p>修改完内容后，再回统计页和用户页确认学生端是否同步正确。</p>
              </article>
            </div>
          </DataWorkbench>
        </div>
      </section>

      <DataWorkbench
        eyebrow="模块成熟度"
        title="把当前状态、职责和下一步动作放进同一张工作表"
        tone="admin"
      >
        {data.length > 0 ? (
          <div className="module-status-grid">
            {data.map((module, index) => (
              <article
                key={`${module.id}-status`}
                className="module-status-card module-status-card--compact"
              >
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
        ) : (
          <EmptyState
            title="当前还没有模块状态"
            description="模块同步完成后，这里会自动生成完整的后台工作表。"
          />
        )}
      </DataWorkbench>

      <article className="feedback-box feedback-box--compact">
        <strong>{error ? "后台模块同步失败" : "后台模块已从后端加载"}</strong>
        <p>
          {isLoading
            ? "正在同步后台模块..."
            : error || "后台首页会根据内容状态自动更新优先级、模块入口和工作建议。"}
        </p>
      </article>
    </div>
  );
}
