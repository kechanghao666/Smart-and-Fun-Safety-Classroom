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
  const flowLearningClass =
    completedLevels === 3 ? "flow-step flow-step--done" : "flow-step flow-step--active";
  const flowExamClass =
    state.progress.exam.status === "completed"
      ? "flow-step flow-step--done"
      : examUnlocked
        ? "flow-step flow-step--active"
        : "flow-step";
  const flowResultClass =
    state.progress.exam.status === "completed" ? "flow-step flow-step--done" : "flow-step";

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

      <section className="card-grid card-grid--two">
        <article className="surface-card theme-overview-card">
          <span className="section-block__eyebrow">主题头图区</span>
          <h2>学习目标与当前状态</h2>
          <ul className="plain-list">
            <li>当前主题：道路安全教育</li>
            <li>当前完成：{completedLevels} / 3 关</li>
            <li>
              考试状态：
              {state.progress.exam.status === "completed"
                ? "已完成"
                : examUnlocked
                  ? "已解锁"
                  : "未解锁"}
            </li>
            <li>最近学习位置：{state.progress.lastVisitedRoute}</li>
          </ul>
        </article>

        <article className="surface-card theme-overview-card">
          <span className="section-block__eyebrow">主题简介</span>
          <h2>开始前先了解这节课会学什么</h2>
          <p>
            本主题采用“三关闯关学习 + 主题考试”的结构。三关分别聚焦交通观察、
            放学路线判断和安全出行守护，全部完成后自动解锁考试。
          </p>
        </article>
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">流程区</span>
            <h2>学习流程总览</h2>
          </div>
        </div>

        <div className="flow-strip">
          <div className={flowLearningClass}>三关闯关学习</div>
          <div className={flowExamClass}>主题考试</div>
          <div className={flowResultClass}>结果反馈</div>
        </div>
      </section>

      <section className="card-grid card-grid--three">
        {state.progress.levels.map((level) => {
          const hasLevelResult = Boolean(state.progress.levelResults[level.id]);
          const levelTarget =
            level.status === "completed" && hasLevelResult
              ? `/student/theme/road-safety/level/${level.id}/result`
              : `/student/theme/road-safety/level/${level.id}`;
          const levelButtonLabel =
            level.status === "completed"
              ? hasLevelResult
                ? "查看结算"
                : "再次练习"
              : "进入本关";

          return (
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
              <p className="muted-copy">
                {level.status === "locked"
                  ? "当前尚未解锁，请先完成前一关。"
                  : level.status === "completed"
                    ? hasLevelResult
                      ? "本关已完成，可直接查看独立结算页，也可以重新进入复习。"
                      : "本关已完成，但当前设备还没有保存结算页记录，可重新进入补齐结算。"
                    : "当前可进入学习，完成后将进入独立结算页。"}
              </p>
              <button
                type="button"
                className={level.status === "locked" ? "ghost-button" : "primary-button"}
                disabled={level.status === "locked"}
                onClick={() => navigate(levelTarget)}
              >
                {levelButtonLabel}
              </button>
            </article>
          );
        })}
      </section>

      <section className="card-grid card-grid--two">
        <article
          className={`surface-card exam-card ${
            examUnlocked ? "exam-card--unlocked" : "exam-card--locked"
          }`}
        >
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
          <h3>返回或查看当前学习记录</h3>
          <div className="button-row">
            <button
              type="button"
              className="ghost-button"
              onClick={() => navigate("/student/home")}
            >
              返回首页
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => navigate("/student/records")}
            >
              查看学习记录
            </button>
            <Link className="ghost-button link-button" to="/student/ai-report">
              查看结果页
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
