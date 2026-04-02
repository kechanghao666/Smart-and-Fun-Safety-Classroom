import { Link, useNavigate } from "react-router-dom";
import { examQuestions } from "../../data/mockData";
import { useAppState } from "../../state/AppState";

export function StudentWrongQuestionsPage() {
  const navigate = useNavigate();
  const { state } = useAppState();

  if (state.progress.exam.status !== "completed") {
    return (
      <section className="surface-card empty-state-card">
        <span className="section-block__eyebrow">错题回看页</span>
        <h2>当前还没有可回看的错题</h2>
        <p>请先完成主题考试，系统才会生成错题解析和建议回看的关卡入口。</p>
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

  const wrongQuestionDetails = examQuestions.filter((question) =>
    state.progress.exam.wrongQuestionIds.includes(question.id),
  );

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--report">
        <div>
          <span className="hero-banner__eyebrow">错题回看页</span>
          <h1>把错题、解析和复习入口放在同一页里</h1>
          <p>
            错题页只围绕当前道路安全主题考试展开，用来帮助学生快速回看正确答案并回到对应关卡补强。
          </p>
        </div>

        <div className="progress-ring">
          <strong>{wrongQuestionDetails.length}</strong>
          <span>当前错题数</span>
        </div>
      </section>

      {wrongQuestionDetails.length > 0 ? (
        <section className="page-stack exam-review-list">
          {wrongQuestionDetails.map((question, index) => (
            <article key={question.id} className="surface-card exam-review-card">
              <div className="exam-review-card__header">
                <div>
                  <span className="surface-tag">错题 {index + 1}</span>
                  <h2>{question.prompt}</h2>
                </div>
                <span className="exam-review-chip">{question.reviewLabel}</span>
              </div>

              <div className="card-grid card-grid--two">
                <article className="feedback-box">
                  <strong>正确答案</strong>
                  <p>{question.options[question.correctIndex]}</p>
                </article>
                <article className="feedback-box">
                  <strong>解析说明</strong>
                  <p>{question.explanation}</p>
                </article>
              </div>

              <article className="feedback-box">
                <strong>建议回看</strong>
                <p>{question.reviewSuggestion}</p>
              </article>

              <div className="button-row">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() =>
                    navigate(`/student/theme/road-safety/level/${question.reviewLevelId}`)
                  }
                >
                  回看对应关卡
                </button>
                <Link
                  className="ghost-button link-button"
                  to="/student/theme/road-safety/exam/result"
                >
                  返回考试结果页
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="surface-card empty-state-card">
          <span className="section-block__eyebrow">当前状态</span>
          <h2>本轮考试没有错题</h2>
          <p>可以直接进入 AI 学习结果卡页，完成本轮学习总结与成长回看。</p>
          <div className="button-row">
            <Link className="primary-button link-button" to="/student/ai-report">
              查看 AI 结果卡
            </Link>
            <Link
              className="ghost-button link-button"
              to="/student/theme/road-safety/exam/result"
            >
              返回考试结果页
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
