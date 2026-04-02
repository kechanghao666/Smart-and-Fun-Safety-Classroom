import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { examQuestions } from "../../data/mockData";
import { useAppState } from "../../state/AppState";

export function StudentExamPage() {
  const { state, submitExam } = useAppState();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);

  const wrongQuestionDetails = useMemo(
    () =>
      examQuestions.filter((question) =>
        state.progress.exam.wrongQuestionIds.includes(question.id),
      ),
    [state.progress.exam.wrongQuestionIds],
  );

  if (state.progress.exam.status === "locked") {
    return (
      <section className="surface-card">
        <h2>主题考试尚未解锁</h2>
        <p>请先完成三关闯关学习，再回来参加考试。</p>
      </section>
    );
  }

  function handleSubmit() {
    const wrongQuestionIds = examQuestions
      .filter((question) => answers[question.id] !== question.correctIndex)
      .map((question) => question.id);
    const score = Math.round(
      ((examQuestions.length - wrongQuestionIds.length) / examQuestions.length) * 100,
    );

    submitExam(score, wrongQuestionIds);
    setSubmittedScore(score);
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--exam">
        <div>
          <span className="hero-banner__eyebrow">主题考试</span>
          <h1>道路安全知识检测</h1>
          <p>三关完成后自动解锁，考试结束后会展示错题和 AI 学习结果卡片。</p>
        </div>
        <div className="progress-ring">
          <strong>{state.progress.exam.totalQuestions}</strong>
          <span>总题数</span>
        </div>
      </section>

      <section className="page-stack">
        {examQuestions.map((question, index) => (
          <article key={question.id} className="surface-card">
            <span className="surface-tag">第 {index + 1} 题</span>
            <h3>{question.prompt}</h3>
            <div className="option-grid">
              {question.options.map((option, optionIndex) => (
                <button
                  key={option}
                  type="button"
                  className={
                    answers[question.id] === optionIndex
                      ? "option-card option-card--selected"
                      : "option-card"
                  }
                  onClick={() =>
                    setAnswers((current) => ({
                      ...current,
                      [question.id]: optionIndex,
                    }))
                  }
                >
                  {option}
                </button>
              ))}
            </div>
          </article>
        ))}

        <button
          type="button"
          className="primary-button"
          disabled={Object.keys(answers).length !== examQuestions.length}
          onClick={handleSubmit}
        >
          提交考试
        </button>
      </section>

      {state.progress.exam.status === "completed" || submittedScore !== null ? (
        <section className="surface-card">
          <span className="section-block__eyebrow">考试结果</span>
          <h2>本次得分：{state.progress.exam.score ?? submittedScore} 分</h2>
          <p>
            {wrongQuestionDetails.length === 0
              ? "本次没有错题，说明你已经较好掌握了道路安全主题。"
              : "你可以先回顾错题，再前往 AI 结果卡片查看下一步建议。"}
          </p>

          {wrongQuestionDetails.length > 0 ? (
            <div className="page-stack">
              {wrongQuestionDetails.map((question) => (
                <article key={question.id} className="feedback-box">
                  <strong>{question.prompt}</strong>
                  <p>{question.explanation}</p>
                </article>
              ))}
            </div>
          ) : null}

          <Link className="primary-button link-button" to="/student/ai-report">
            查看 AI 学习结果卡片
          </Link>
        </section>
      ) : null}
    </div>
  );
}
