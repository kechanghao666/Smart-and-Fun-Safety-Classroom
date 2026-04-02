import { Link, useNavigate } from "react-router-dom";
import { StatusBadge } from "../../components/StatusBadge";
import { useAppState } from "../../state/AppState";

export function StudentThemePage() {
  const navigate = useNavigate();
  const { state } = useAppState();
  const completedLevels = state.progress.levels.filter(
    (level) => level.status === "completed",
  ).length;
  const examUnlocked = state.progress.exam.status !== "locked";

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--theme">
        <div>
          <span className="hero-banner__eyebrow">道路安全教育主题</span>
          <h1>三关闯关学习 + 主题考试</h1>
          <p>
            在开始前先明确完整路径：完成三关闯关学习后，系统会自动解锁主题考试，
            然后再生成错题反馈和 AI 学习结果卡片。
          </p>
        </div>
        <div className="progress-ring">
          <strong>{Math.round((completedLevels / 3) * 100)}%</strong>
          <span>主题完成度</span>
        </div>
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">流程区</span>
            <h2>学习流程总览</h2>
          </div>
        </div>

        <div className="flow-strip">
          <div className="flow-step flow-step--done">三关闯关学习</div>
          <div className={`flow-step ${examUnlocked ? "flow-step--active" : ""}`}>
            主题考试
          </div>
          <div
            className={`flow-step ${
              state.progress.exam.status === "completed" ? "flow-step--done" : ""
            }`}
          >
            结果反馈
          </div>
        </div>
      </section>

      <section className="card-grid card-grid--three">
        {state.progress.levels.map((level) => (
          <article key={level.id} className="surface-card level-card">
            <div className="level-card__header">
              <div>
                <span className="surface-tag">{level.focus}</span>
                <h3>{level.title}</h3>
              </div>
              <StatusBadge status={level.status} />
            </div>
            <p>{level.description}</p>
            <p className="muted-copy">预计时长：{level.duration}</p>
            <button
              type="button"
              className={level.status === "locked" ? "ghost-button" : "primary-button"}
              disabled={level.status === "locked"}
              onClick={() => navigate(`/student/theme/road-safety/level/${level.id}`)}
            >
              {level.status === "completed" ? "再次查看" : "进入本关"}
            </button>
          </article>
        ))}
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card exam-card">
          <div className="level-card__header">
            <div>
              <span className="surface-tag">主题考试</span>
              <h3>考试入口</h3>
            </div>
            <StatusBadge status={state.progress.exam.status} />
          </div>
          <p>
            {examUnlocked
              ? "三关已完成，可以进入考试巩固知识点。"
              : "需要先完成三关闯关学习，考试入口才会点亮。"}
          </p>
          <button
            type="button"
            className={examUnlocked ? "primary-button" : "ghost-button"}
            disabled={!examUnlocked}
            onClick={() => navigate("/student/theme/road-safety/exam")}
          >
            {state.progress.exam.status === "completed" ? "查看考试结果" : "进入考试"}
          </button>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">辅助入口</span>
          <h3>快速查看学习记录与结果页</h3>
          <ul className="plain-list">
            <li>
              <Link to="/student/records">学习记录页</Link>
            </li>
            <li>
              <Link to="/student/ai-report">AI 学习结果卡片</Link>
            </li>
          </ul>
        </article>
      </section>
    </div>
  );
}

