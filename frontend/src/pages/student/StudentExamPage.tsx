import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { examQuestions } from "../../data/mockData";
import { useAppState } from "../../state/AppState";

interface ExamResultSnapshot {
  score: number;
  wrongQuestionIds: string[];
  answers: Record<string, number>;
}

export function StudentExamPage() {
  const navigate = useNavigate();
  const { state, submitExam } = useAppState();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [examResult, setExamResult] = useState<ExamResultSnapshot | null>(null);
  const answeredCount = Object.keys(answers).length;
  const activeQuestion = examQuestions[activeQuestionIndex];

  const reviewSource = useMemo<ExamResultSnapshot | null>(() => {
    if (examResult) {
      return examResult;
    }

    if (state.progress.exam.status !== "completed") {
      return null;
    }

    return {
      score: state.progress.exam.score ?? 0,
      wrongQuestionIds: state.progress.exam.wrongQuestionIds,
      answers: {},
    };
  }, [
    examResult,
    state.progress.exam.score,
    state.progress.exam.status,
    state.progress.exam.wrongQuestionIds,
  ]);

  const reviewAnswers = reviewSource?.answers ?? {};
  const wrongQuestionDetails = useMemo(
    () =>
      examQuestions.filter((question) =>
        reviewSource?.wrongQuestionIds.includes(question.id),
      ),
    [reviewSource],
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
    if (answeredCount !== examQuestions.length) {
      return;
    }

    const wrongQuestionIds = examQuestions
      .filter((question) => answers[question.id] !== question.correctIndex)
      .map((question) => question.id);
    const score = Math.round(
      ((examQuestions.length - wrongQuestionIds.length) / examQuestions.length) * 100,
    );

    submitExam(score, wrongQuestionIds);
    setExamResult({
      score,
      wrongQuestionIds,
      answers,
    });
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--exam">
        <div>
          <span className="hero-banner__eyebrow">主题考试</span>
          <h1>{reviewSource ? "考试已完成，查看本次结果反馈" : "道路安全知识检测"}</h1>
          <p>
            {reviewSource
              ? "结果页会集中展示得分、错题、正确答案、解析和建议回看的关卡。"
              : "按题号依次完成作答，支持上一题、下一题和统一提交。"}
          </p>
        </div>
        <div className="progress-ring">
          <strong>
            {reviewSource
              ? `${reviewSource.score}`
              : `${answeredCount}/${state.progress.exam.totalQuestions}`}
          </strong>
          <span>{reviewSource ? "考试得分" : "已答题数"}</span>
        </div>
      </section>

      {!reviewSource ? (
        <>
          <section className="card-grid card-grid--two">
            <article className="surface-card exam-summary-card">
              <span className="section-block__eyebrow">答题状态</span>
              <h2>先完成全部题目，再统一提交</h2>
              <ul className="plain-list">
                <li>当前进度：第 {activeQuestionIndex + 1} / {examQuestions.length} 题</li>
                <li>已作答：{answeredCount} 题</li>
                <li>未作答：{examQuestions.length - answeredCount} 题</li>
              </ul>
            </article>

            <article className="surface-card exam-summary-card">
              <span className="section-block__eyebrow">答题提示</span>
              <h2>先判断场景，再选择最安全的行为</h2>
              <p>
                建议把题目和三关中的学习内容对应起来：斑马线与信号灯、路线判断、
                乘车防护，这样更容易稳定拿分。
              </p>
            </article>
          </section>

          <section className="surface-card">
            <div className="section-block__header">
              <div>
                <span className="section-block__eyebrow">题号导航</span>
                <h2>按题号切换当前作答位置</h2>
              </div>
            </div>

            <div className="exam-nav">
              {examQuestions.map((question, index) => (
                <button
                  key={question.id}
                  type="button"
                  className={
                    index === activeQuestionIndex
                      ? "exam-nav__button exam-nav__button--active"
                      : answers[question.id] !== undefined
                        ? "exam-nav__button exam-nav__button--done"
                        : "exam-nav__button"
                  }
                  onClick={() => setActiveQuestionIndex(index)}
                >
                  第 {index + 1} 题
                </button>
              ))}
            </div>
          </section>

          <section className="surface-card exam-question-card">
            <span className="surface-tag">第 {activeQuestionIndex + 1} 题</span>
            <h2>{activeQuestion.prompt}</h2>
            <div className="exam-option-grid">
              {activeQuestion.options.map((option, optionIndex) => (
                <button
                  key={option}
                  type="button"
                  className={
                    answers[activeQuestion.id] === optionIndex
                      ? "option-card option-card--selected"
                      : "option-card"
                  }
                  onClick={() =>
                    setAnswers((current) => ({
                      ...current,
                      [activeQuestion.id]: optionIndex,
                    }))
                  }
                >
                  <strong>{String.fromCharCode(65 + optionIndex)}.</strong>
                  <span>{option}</span>
                </button>
              ))}
            </div>

            <article className="feedback-box">
              <strong>对应复习模块：{activeQuestion.reviewLabel}</strong>
              <p>{activeQuestion.reviewSuggestion}</p>
            </article>
          </section>

          <div className="button-row">
            <button
              type="button"
              className="ghost-button"
              disabled={activeQuestionIndex === 0}
              onClick={() => setActiveQuestionIndex((current) => Math.max(0, current - 1))}
            >
              上一题
            </button>
            <button
              type="button"
              className="ghost-button"
              disabled={activeQuestionIndex === examQuestions.length - 1}
              onClick={() =>
                setActiveQuestionIndex((current) =>
                  Math.min(examQuestions.length - 1, current + 1),
                )
              }
            >
              下一题
            </button>
            <button
              type="button"
              className="primary-button"
              disabled={answeredCount !== examQuestions.length}
              onClick={handleSubmit}
            >
              提交考试
            </button>
          </div>
        </>
      ) : (
        <section className="surface-card">
          <span className="section-block__eyebrow">考试结果</span>
          <h2>本次得分：{reviewSource.score} 分</h2>
          <p>
            {wrongQuestionDetails.length === 0
              ? "本次没有错题，说明你已经较好掌握了道路安全主题，可以直接查看 AI 结果卡片。"
              : "你可以先回顾错题解析和正确答案，再按建议回看对应关卡。"}
          </p>

          <section className="card-grid card-grid--two">
            <article className="surface-card exam-summary-card">
              <span className="section-block__eyebrow">成绩概览</span>
              <h3>{examQuestions.length - wrongQuestionDetails.length} 题答对</h3>
              <ul className="plain-list">
                <li>总题数：{examQuestions.length}</li>
                <li>错题数：{wrongQuestionDetails.length}</li>
                <li>当前积分：{state.progress.points}</li>
              </ul>
            </article>

            <article className="surface-card exam-summary-card">
              <span className="section-block__eyebrow">结果去向</span>
              <h3>继续完成结果反馈</h3>
              <p>
                错题回顾后，可以进入 AI 学习结果卡片查看总结，也可以先回到主题页继续复习三关。
              </p>
            </article>
          </section>

          {wrongQuestionDetails.length > 0 ? (
            <div className="page-stack exam-review-list">
              {wrongQuestionDetails.map((question) => (
                <article key={question.id} className="surface-card exam-review-card">
                  <div className="exam-review-card__header">
                    <div>
                      <span className="surface-tag">错题回看</span>
                      <h3>{question.prompt}</h3>
                    </div>
                    <span className="exam-review-chip">{question.reviewLabel}</span>
                  </div>
                  <ul className="plain-list">
                    <li>
                      你的选择：
                      {reviewAnswers[question.id] !== undefined
                        ? question.options[reviewAnswers[question.id]]
                        : " 当前设备未保留本次作答选项记录"}
                    </li>
                    <li>正确答案：{question.options[question.correctIndex]}</li>
                    <li>解析说明：{question.explanation}</li>
                    <li>建议回看：{question.reviewSuggestion}</li>
                  </ul>
                  <div className="button-row">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() =>
                        navigate(`/student/theme/road-safety/level/${question.reviewLevelId}`)
                      }
                    >
                      回看对应关卡
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <article className="feedback-box">
              <strong>没有错题，继续保持。</strong>
              <p>
                你已经顺利完成主题考试，可以直接进入结果反馈页查看本次学习总结和徽章变化。
              </p>
            </article>
          )}

          <div className="button-row">
            <button
              type="button"
              className="ghost-button"
              onClick={() => navigate("/student/theme/road-safety")}
            >
              返回主题页
            </button>
            <Link className="primary-button link-button" to="/student/ai-report">
              查看 AI 学习结果卡片
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
