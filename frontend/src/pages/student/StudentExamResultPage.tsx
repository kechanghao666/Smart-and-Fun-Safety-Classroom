import { Link, useNavigate } from "react-router-dom";
import { examQuestions } from "../../data/mockData";
import { useAppState } from "../../state/AppState";

export function StudentExamResultPage() {
  const navigate = useNavigate();
  const { state } = useAppState();

  if (state.progress.exam.status !== "completed") {
    return (
      <section className="surface-card empty-state-card">
        <span className="section-block__eyebrow">考试结果页</span>
        <h2>还没有可展示的考试结果</h2>
        <p>请先完成三关学习并提交主题考试，系统才会生成正式的结果反馈。</p>
        <div className="button-row">
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate("/student/theme/road-safety")}
          >
            返回主题页
          </button>
          {state.progress.exam.status === "available" ? (
            <button
              type="button"
              className="ghost-button"
              onClick={() => navigate("/student/theme/road-safety/exam")}
            >
              进入考试
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  const score = state.progress.exam.score ?? 0;
  const wrongCount = state.progress.exam.wrongQuestionIds.length;
  const correctCount = examQuestions.length - wrongCount;
  const performanceLabel =
    wrongCount === 0 ? "表现稳定" : score >= 80 ? "基础扎实" : "需要继续巩固";

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--exam">
        <div>
          <span className="hero-banner__eyebrow">主题考试结果</span>
          <h1>本轮道路安全主题考试已经完成</h1>
          <p>
            结果页集中展示分数、答题表现、错题入口和后续学习去向，方便你继续回看和收口。
          </p>
        </div>

        <div className="result-medal result-medal--report">
          <strong>{score} 分</strong>
          <span>{performanceLabel}</span>
        </div>
      </section>

      <section className="card-grid card-grid--three">
        <article className="surface-card stat-card">
          <span>答对题数</span>
          <strong>{correctCount}</strong>
          <p>总题数 {examQuestions.length} 题，当前答题表现会同步进入学习结果页和成长档案。</p>
        </article>

        <article className="surface-card stat-card">
          <span>错题数量</span>
          <strong>{wrongCount}</strong>
          <p>
            {wrongCount > 0
              ? "建议优先进入错题回看页，逐题查看解析并回到对应关卡复习。"
              : "本轮没有错题，可以直接查看 AI 学习结果卡片。"}
          </p>
        </article>

        <article className="surface-card stat-card">
          <span>当前积分</span>
          <strong>{state.progress.points}</strong>
          <p>考试得分、关卡完成和徽章变化都已经计入学生成长档案。</p>
        </article>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card report-panel">
          <span className="section-block__eyebrow">结果说明</span>
          <h2>接下来最建议做什么</h2>
          <div className="page-stack page-stack--compact">
            <article className="feedback-box">
              <strong>第一步</strong>
              <p>
                {wrongCount > 0
                  ? "先看错题解析和建议回看的关卡，把薄弱点补齐。"
                  : "先查看 AI 学习结果卡页，完成本轮学习总结。"}
              </p>
            </article>
            <article className="feedback-box">
              <strong>第二步</strong>
              <p>再回到学习记录或成长档案，确认这轮学习带来的成长变化和下一步重点。</p>
            </article>
          </div>
        </article>

        <article className="surface-card report-panel">
          <span className="section-block__eyebrow">结果去向</span>
          <h2>从结果页继续进入后续页面</h2>
          <div className="card-grid card-grid--two">
            <article className="report-action-card">
              <strong>错题回看</strong>
              <p>逐题查看正确答案、解析和建议回看的关卡。</p>
              <Link
                className="ghost-button link-button"
                to="/student/theme/road-safety/wrong-questions"
              >
                打开错题页
              </Link>
            </article>
            <article className="report-action-card">
              <strong>AI 结果卡</strong>
              <p>查看亮点、补强重点、成长结果和下一步动作。</p>
              <Link className="ghost-button link-button" to="/student/ai-report">
                查看结果卡
              </Link>
            </article>
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
