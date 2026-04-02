import { adminModules } from "../../data/mockData";

export function AdminDashboardPage() {
  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">管理员后台</span>
          <h1>内容维护、用户管理与数据统计入口</h1>
          <p>当前先用模块卡片串起主题管理、关卡管理、题库、AI 文案、用户和数据统计。</p>
        </div>
      </section>

      <section className="card-grid card-grid--three">
        {adminModules.map((module) => (
          <article key={module.id} className="surface-card">
            <span className="surface-tag">{module.status}</span>
            <h2>{module.title}</h2>
            <p>{module.description}</p>
            <p className="muted-copy">建议 owner：{module.ownerSuggestion}</p>
          </article>
        ))}
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card">
          <span className="section-block__eyebrow">首版建设顺序</span>
          <ul className="plain-list">
            <li>先完成主题、关卡和题库录入界面</li>
            <li>再补 AI 文案模板配置</li>
            <li>最后接用户管理和统计接口</li>
          </ul>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">接口准备</span>
          <ul className="plain-list">
            <li>主题管理：名称、封面、开放状态、排序</li>
            <li>关卡管理：场景、任务、反馈、奖励</li>
            <li>题库管理：题干、选项、答案、解析</li>
            <li>AI 文案管理：欢迎语、提示语、鼓励语、结果卡片模板</li>
          </ul>
        </article>
      </section>
    </div>
  );
}

