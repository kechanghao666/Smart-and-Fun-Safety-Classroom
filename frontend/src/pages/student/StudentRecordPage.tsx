import { Link, useNavigate } from "react-router-dom";
import { StatusBadge } from "../../components/StatusBadge";
import { examQuestions } from "../../data/mockData";
import { useAppState } from "../../state/AppState";
import { buildGrowthSnapshot } from "../../utils/studentGrowth";

export function StudentRecordPage() {
  const navigate = useNavigate();
  const { state } = useAppState();
  const growth = buildGrowthSnapshot(state);
  const wrongQuestionDetails = examQuestions.filter((question) =>
    state.progress.exam.wrongQuestionIds.includes(question.id),
  );

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--record">
        <div>
          <span className="hero-banner__eyebrow">学习记录</span>
          <h1>继续学习入口与阶段性学习档案</h1>
          <p>
            这里集中展示当前主题进度、关卡结算、考试反馈和成长快照，方便你快速回到最近的学习节点。
          </p>
        </div>
        <div className="hero-banner__actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate(state.progress.lastVisitedRoute)}
          >
            继续学习
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={() => navigate("/student/growth")}
          >
            查看成长档案
          </button>
        </div>
      </section>

      <section className="card-grid card-grid--three">
        <article className="surface-card stat-card">
          <span>当前主题</span>
          <strong>{state.progress.themeTitle}</strong>
          <p>最近学习位置：{state.progress.lastVisitedRoute}</p>
        </article>
        <article className="surface-card stat-card">
          <span>考试状态</span>
          <strong>
            {state.progress.exam.status === "completed"
              ? `${state.progress.exam.score ?? 0} 分`
              : state.progress.exam.status === "available"
                ? "已解锁"
                : "未解锁"}
          </strong>
          <p>
            {state.progress.exam.status === "completed"
              ? `当前有 ${wrongQuestionDetails.length} 道题可以继续回看`
              : "完成三关后会自动解锁主题考试"}
          </p>
        </article>
        <article className="surface-card stat-card">
          <span>成长阶段</span>
          <strong>{growth.currentTier.title}</strong>
          <p>{growth.nextFocus}</p>
        </article>
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">关卡记录</span>
            <h2>每一关的完成状态与独立结算页入口</h2>
          </div>
        </div>

        <div className="card-grid card-grid--three">
          {state.progress.levels.map((level) => {
            const result = state.progress.levelResults[level.id];
            const levelTarget = result
              ? `/student/theme/road-safety/level/${level.id}/result`
              : `/student/theme/road-safety/level/${level.id}`;

            return (
              <article key={level.id} className="surface-card result-card">
                <div className="level-card__header">
                  <div>
                    <span className="surface-tag">{level.focus}</span>
                    <h3>{level.title}</h3>
                  </div>
                  <StatusBadge status={level.status} />
                </div>
                <ul className="plain-list">
                  <li>预计时长：{level.duration}</li>
                  <li>当前状态：{level.status}</li>
                  <li>本关得分：{result ? `${result.score} 分` : "尚未生成结算"}</li>
                  <li>星级表现：{result ? `${result.stars} 星` : "待完成后显示"}</li>
                </ul>
                <button
                  type="button"
                  className={level.status === "locked" ? "ghost-button" : "primary-button"}
                  disabled={level.status === "locked"}
                  onClick={() => navigate(levelTarget)}
                >
                  {result ? "查看本关结算" : "进入本关"}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card">
          <span className="section-block__eyebrow">考试与错题</span>
          <h2>本轮知识检测回顾</h2>
          {state.progress.exam.status === "completed" ? (
            <>
              <p>考试已完成，得分为 {state.progress.exam.score ?? 0} 分。</p>
              {wrongQuestionDetails.length > 0 ? (
                <ul className="plain-list">
                  {wrongQuestionDetails.map((question) => (
                    <li key={question.id}>
                      {question.prompt}
                      <button
                        type="button"
                        className="ghost-button inline-action-button"
                        onClick={() =>
                          navigate(`/student/theme/road-safety/level/${question.reviewLevelId}`)
                        }
                      >
                        回看关卡
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>本次没有错题，可以直接查看 AI 学习结果卡片。</p>
              )}
            </>
          ) : (
            <p>
              {state.progress.exam.status === "available"
                ? "主题考试已经解锁，进入考试后会在这里生成错题回顾和解析记录。"
                : "先完成三关学习，考试记录区域会在解锁后点亮。"}
            </p>
          )}
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">成长快照</span>
          <h2>本轮学习带来的成长变化</h2>
          <ul className="plain-list">
            <li>成长值：{growth.points}</li>
            <li>累计星级：{growth.totalStars} 星</li>
            <li>当前外观：{growth.currentTier.appearance}</li>
            <li>已获徽章：{state.progress.badges.join(" / ")}</li>
          </ul>
          <Link className="ghost-button link-button" to="/student/growth">
            打开成长档案
          </Link>
        </article>
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">学习轨迹</span>
            <h2>从资料设置到考试反馈的完整路径</h2>
          </div>
        </div>

        <div className="timeline-list">
          {growth.journal.map((item) => (
            <article key={item.id} className={`timeline-item timeline-item--${item.status}`}>
              <span className="timeline-item__dot" />
              <div className="timeline-item__content">
                <div className="row-between">
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.detail}</p>
                  </div>
                  <Link className="ghost-button link-button" to={item.href}>
                    {item.ctaLabel}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
