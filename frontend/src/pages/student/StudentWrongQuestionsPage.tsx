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
        <p>请先完成主题考试，系统才会生成错题解析、学生作答记录和建议回看的关卡入口。</p>
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
  const studentAnswers = state.progress.exam.studentAnswers ?? {};
  const reviewHighlights = wrongQuestionDetails.map((question) => question.reviewLabel);

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--report">
        <div>
          <span className="hero-banner__eyebrow">错题回看页</span>
          <h1>把错题、作答记录、解析和复习入口放在同一页里</h1>
          <p>
            错题页会集中展示本轮主题考试中答错的题目，帮助学生先看清自己当时的选择，再看正确答案、
            简短解析和对应关卡复习入口。
          </p>
        </div>

        <div className="progress-ring">
          <strong>{wrongQuestionDetails.length}</strong>
          <span>当前错题数</span>
        </div>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card">
          <span className="section-block__eyebrow">回看概览</span>
          <h2>先确认这一轮最该补强什么</h2>
          <ul className="plain-list">
            <li>错题数量：{wrongQuestionDetails.length} 题</li>
            <li>推荐回看：{reviewHighlights.length > 0 ? reviewHighlights.join(" / ") : "暂无"}</li>
            <li>当前考试分数：{state.progress.exam.score ?? "--"} 分</li>
          </ul>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">回看顺序</span>
          <h2>建议按这三个步骤复习</h2>
          <ul className="plain-list">
            <li>先看自己当时的作答，找到判断偏差点。</li>
            <li>再看正确答案和简短解析，补回知识点。</li>
            <li>最后回到对应关卡，重新练一次相关场景。</li>
          </ul>
        </article>
      </section>

      {wrongQuestionDetails.length > 0 ? (
        <section className="page-stack exam-review-list">
          {wrongQuestionDetails.map((question, index) => {
            const selectedIndex = studentAnswers[question.id];
            const selectedAnswer =
              selectedIndex !== undefined ? question.options[selectedIndex] : "当前没有记录到本地作答结果";

            return (
              <article key={question.id} className="surface-card exam-review-card">
                <div className="exam-review-card__header">
                  <div>
                    <span className="surface-tag">错题 {index + 1}</span>
                    <h2>{question.prompt}</h2>
                  </div>
                  <span className="exam-review-chip">{question.reviewLabel}</span>
                </div>

                <div className="card-grid card-grid--three">
                  <article className="feedback-box">
                    <strong>你的作答</strong>
                    <p>{selectedAnswer}</p>
                  </article>
                  <article className="feedback-box">
                    <strong>正确答案</strong>
                    <p>{question.options[question.correctIndex]}</p>
                  </article>
                  <article className="feedback-box">
                    <strong>简短解析</strong>
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
            );
          })}
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
