import { useMemo } from "react";
import { Link } from "react-router-dom";
import { examQuestions } from "../../data/mockData";
import { useAppState } from "../../state/AppState";

export function StudentAiReportPage() {
  const { state } = useAppState();
  const completedLevels = state.progress.levels.filter(
    (level) => level.status === "completed",
  ).length;

  const wrongQuestionDetails = useMemo(
    () =>
      examQuestions.filter((question) =>
        state.progress.exam.wrongQuestionIds.includes(question.id),
      ),
    [state.progress.exam.wrongQuestionIds],
  );

  const reviewTargets = useMemo(
    () => Array.from(new Set(wrongQuestionDetails.map((question) => question.reviewLabel))),
    [wrongQuestionDetails],
  );

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--report">
        <div>
          <span className="hero-banner__eyebrow">AI 学习结果卡片</span>
          <h1>把“完成了什么、做得如何、下一步做什么”放在一页里</h1>
          <p>
            当前结果页继续采用“数据 + 模板”的轻量方式生成，方便后续无缝替换成真实后端接口。
          </p>
        </div>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card report-card report-card--blue">
          <span className="section-block__eyebrow">完成情况</span>
          <h2>{completedLevels} / 3 关已完成</h2>
          <p>
            主题考试
            {state.progress.exam.status === "completed"
              ? "已完成"
              : state.progress.exam.status === "available"
                ? "已解锁"
                : "未解锁"}
            ，当前积分为 {state.progress.points}。
          </p>
        </article>

        <article className="surface-card report-card report-card--mint">
          <span className="section-block__eyebrow">表现情况</span>
          <h2>
            {state.progress.exam.score === null
              ? "已建立闯关基础"
              : `考试成绩 ${state.progress.exam.score} 分`}
          </h2>
          <p>
            {wrongQuestionDetails.length === 0
              ? "你在交通观察、路线判断和乘车安全上的表现都比较稳定。"
              : `建议优先回顾：${wrongQuestionDetails.map((question) => question.prompt).join("、")}`}
          </p>
        </article>

        <article className="surface-card report-card report-card--orange">
          <span className="section-block__eyebrow">下一步建议</span>
          <h2>推荐的后续动作</h2>
          <ul className="plain-list">
            <li>如果考试未完成，先完成主题考试</li>
            <li>
              {reviewTargets.length > 0
                ? `优先回看：${reviewTargets.join("、")}`
                : "如果有错题，先查看解析再回到对应关卡复习"}
            </li>
            <li>继续提问 AI 助手，巩固“斑马线、盲区、头盔”三个重点</li>
          </ul>
        </article>

        <article className="surface-card report-card report-card--green">
          <span className="section-block__eyebrow">激励展示</span>
          <h2>已获得徽章</h2>
          <div className="chip-row">
            {state.progress.badges.map((badge) => (
              <span key={badge} className="quick-chip quick-chip--static">
                {badge}
              </span>
            ))}
          </div>
        </article>
      </section>

      <div className="button-row">
        <Link className="ghost-button link-button" to="/student/theme/road-safety">
          返回主题页
        </Link>
        <Link className="ghost-button link-button" to="/student/records">
          查看学习记录
        </Link>
      </div>
    </div>
  );
}
