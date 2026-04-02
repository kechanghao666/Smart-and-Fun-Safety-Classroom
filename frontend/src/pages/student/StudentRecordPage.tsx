import { useNavigate } from "react-router-dom";
import { StatusBadge } from "../../components/StatusBadge";
import { useAppState } from "../../state/AppState";

export function StudentRecordPage() {
  const navigate = useNavigate();
  const { state } = useAppState();

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--record">
        <div>
          <span className="hero-banner__eyebrow">学习记录</span>
          <h1>继续学习入口与轻量进度档案</h1>
          <p>记录当前主题完成情况、最近停留位置、考试状态和激励信息。</p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => navigate(state.progress.lastVisitedRoute)}
        >
          继续学习
        </button>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card">
          <span className="section-block__eyebrow">主题进度</span>
          <h2>{state.progress.themeTitle}</h2>
          <ul className="plain-list">
            {state.progress.levels.map((level) => (
              <li key={level.id} className="row-between">
                <span>{level.title}</span>
                <StatusBadge status={level.status} />
              </li>
            ))}
          </ul>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">考试与激励</span>
          <h2>学习成果</h2>
          <ul className="plain-list">
            <li>考试状态：{state.progress.exam.status}</li>
            <li>考试分数：{state.progress.exam.score ?? "未完成"}</li>
            <li>最近位置：{state.progress.lastVisitedRoute}</li>
            <li>已获徽章：{state.progress.badges.join(" / ")}</li>
          </ul>
        </article>
      </section>
    </div>
  );
}

