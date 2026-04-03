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
  const continueRoute =
    growth.journal.find((item) => item.status === "current")?.href ??
    state.progress.lastVisitedRoute;

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--record">
        <div>
          <span className="hero-banner__eyebrow">学习记录页</span>
          <h1>把主题进度、结算回看、错题和成长放在一起</h1>
          <p>
            学习记录页承担“快捷续学 + 主题进度 + 结算回看 + 错题入口 + 成长快照”的中转功能，方便学生快速回到下一步。
          </p>
        </div>
        <div className="hero-banner__actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate(continueRoute)}
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
              ? `当前共有 ${wrongQuestionDetails.length} 道题可继续回看`
              : "完成三关后主题考试会自动点亮。"}
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
            <span className="section-block__eyebrow">主题进度</span>
            <h2>每一关的状态和结算入口</h2>
          </div>
        </div>

        <div className="card-grid card-grid--three">
          {state.progress.levels.map((level) => {
            const result = state.progress.levelResults[level.id];
            const target = result
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
                  <li>
                    本关得分：
                    {result ? `${result.score} 分` : "尚未生成结算"}
                  </li>
                  <li>
                    星级表现：
                    {result ? `${result.stars} 星` : "完成后显示"}
                  </li>
                </ul>
                <button
                  type="button"
                  className={level.status === "locked" ? "ghost-button" : "primary-button"}
                  disabled={level.status === "locked"}
                  onClick={() => navigate(target)}
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
          <h2>考试页、结果页与错题页入口</h2>
          {state.progress.exam.status === "completed" ? (
            <div className="page-stack page-stack--compact">
              <div className="button-row">
                <Link
                  className="primary-button link-button"
                  to="/student/theme/road-safety/exam/result"
                >
                  查看考试结果页
                </Link>
                <Link
                  className="ghost-button link-button"
                  to="/student/theme/road-safety/wrong-questions"
                >
                  查看错题回看页
                </Link>
              </div>
              <article className="feedback-box">
                <strong>本轮考试已收口</strong>
                <p>
                  当前得分 {state.progress.exam.score ?? 0} 分，错题 {wrongQuestionDetails.length} 道。
                  接下来建议先看错题，再返回对应关卡复练。
                </p>
              </article>
            </div>
          ) : state.progress.exam.status === "available" ? (
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate("/student/theme/road-safety/exam")}
            >
              进入主题考试
            </button>
          ) : (
            <p>先完成三关学习，考试入口才会解锁。</p>
          )}
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">成长快照</span>
          <h2>本轮学习带来的变化</h2>
          <ul className="plain-list">
            <li>成长值：{growth.points}</li>
            <li>累计星级：{growth.totalStars} 星</li>
            <li>当前外观：{growth.selectedAppearance}</li>
            <li>当前场景：{growth.selectedScene}</li>
            <li>已获得徽章：{state.progress.badges.join(" / ")}</li>
          </ul>
        </article>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card admin-preview-card">
          <span className="section-block__eyebrow">结果回看</span>
          <h2>把每一关结算和考试结果放进同一张总账单</h2>
          <div className="page-stack page-stack--compact">
            {state.progress.levels.map((level) => {
              const result = state.progress.levelResults[level.id];

              return (
                <article key={`${level.id}-recap`} className="teacher-analysis-card">
                  <div className="row-between">
                    <strong>{level.title}</strong>
                    <StatusBadge status={level.status} />
                  </div>
                  <p>
                    {result
                      ? `得分 ${result.score} 分，${result.stars} 星，亮点：${result.highlight}`
                      : "当前还没有生成本关结算，可先进入本关继续学习。"}
                  </p>
                  <Link
                    className="ghost-button link-button"
                    to={
                      result
                        ? `/student/theme/road-safety/level/${level.id}/result`
                        : `/student/theme/road-safety/level/${level.id}`
                    }
                  >
                    {result ? "查看结算" : "进入本关"}
                  </Link>
                </article>
              );
            })}
          </div>
        </article>

        <article className="surface-card admin-preview-card">
          <span className="section-block__eyebrow">下一步入口</span>
          <h2>记录页也承担继续学习与复盘中转</h2>
          <div className="button-row">
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate(continueRoute)}
            >
              继续当前学习
            </button>
            <Link className="ghost-button link-button" to="/student/ai-report">
              查看 AI 结果卡
            </Link>
          </div>
          <ul className="plain-list">
            <li>如果考试已完成，优先看结果卡和错题页。</li>
            <li>如果考试已解锁但未完成，建议直接进入主题考试收口。</li>
            <li>如果仍在闯关阶段，就从这里返回当前可学关卡继续推进。</li>
          </ul>
        </article>
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">学习轨迹</span>
            <h2>从资料设置到结果反馈的完整路线</h2>
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
