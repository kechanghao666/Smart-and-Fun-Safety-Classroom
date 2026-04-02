import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { examQuestions } from "../../data/mockData";
import { ApiError } from "../../services/http";
import { submitStudentExam } from "../../services/student";
import { useAppState } from "../../state/AppState";

export function StudentExamPage() {
  const navigate = useNavigate();
  const { replaceProgress, state, submitExam } = useAppState();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const answeredCount = Object.keys(answers).length;
  const activeQuestion = examQuestions[activeQuestionIndex];

  if (state.progress.exam.status === "locked") {
    return (
      <section className="surface-card empty-state-card">
        <span className="section-block__eyebrow">主题考试</span>
        <h2>主题考试还没有解锁</h2>
        <p>请先完成道路安全主题的三关学习，系统才会点亮考试入口。</p>
        <button
          type="button"
          className="primary-button"
          onClick={() => navigate("/student/theme/road-safety")}
        >
          返回主题页
        </button>
      </section>
    );
  }

  if (state.progress.exam.status === "completed") {
    return (
      <section className="surface-card empty-state-card">
        <span className="section-block__eyebrow">主题考试</span>
        <h2>本轮考试已经提交</h2>
        <p>请前往独立结果页和错题回看页查看正式反馈，不再在本页重复展示结果。</p>
        <div className="button-row">
          <Link
            className="primary-button link-button"
            to="/student/theme/road-safety/exam/result"
          >
            查看考试结果
          </Link>
          <Link
            className="ghost-button link-button"
            to="/student/theme/road-safety/wrong-questions"
          >
            查看错题回看
          </Link>
        </div>
      </section>
    );
  }

  async function handleSubmit() {
    if (answeredCount !== examQuestions.length) {
      return;
    }

    setSubmitError("");
    const wrongQuestionIds = examQuestions
      .filter((question) => answers[question.id] !== question.correctIndex)
      .map((question) => question.id);
    const score = Math.round(
      ((examQuestions.length - wrongQuestionIds.length) / examQuestions.length) * 100,
    );

    if (canUseApi && state.authToken) {
      setIsSubmitting(true);

      try {
        const progress = await submitStudentExam(
          state.authToken,
          examQuestions.map((question) => ({
            questionId: question.id,
            selectedIndex: answers[question.id],
          })),
        );

        replaceProgress(progress);
        navigate("/student/theme/road-safety/exam/result");
      } catch (error) {
        setSubmitError(
          error instanceof ApiError
            ? error.message
            : "考试提交失败，请稍后重试。",
        );
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    submitExam(score, wrongQuestionIds);
    navigate("/student/theme/road-safety/exam/result");
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--exam">
        <div>
          <span className="hero-banner__eyebrow">主题考试</span>
          <h1>道路安全主题知识检测</h1>
          <p>
            考试页严格采用题号导航、题面区域和统一提交结构。请按顺序完成作答，再前往独立结果页查看反馈。
          </p>
        </div>

        <div className="progress-ring">
          <strong>{answeredCount}/{examQuestions.length}</strong>
          <span>已作答题数</span>
        </div>
      </section>

      {submitError ? (
        <article className="feedback-box">
          <strong>提交提醒</strong>
          <p>{submitError}</p>
        </article>
      ) : null}

      <section className="card-grid card-grid--two">
        <article className="surface-card exam-summary-card">
          <span className="section-block__eyebrow">答题进度</span>
          <h2>先完成全部题目，再统一提交</h2>
          <ul className="plain-list">
            <li>当前题号：第 {activeQuestionIndex + 1} 题</li>
            <li>已作答：{answeredCount} 题</li>
            <li>未作答：{examQuestions.length - answeredCount} 题</li>
          </ul>
        </article>

        <article className="surface-card exam-summary-card">
          <span className="section-block__eyebrow">答题提示</span>
          <h2>回到三关里学过的关键规则</h2>
          <p>
            优先回想斑马线与信号灯、公交车盲区、乘车安全带与头盔这几个重点，再作答会更稳。
          </p>
        </article>
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">题号导航</span>
            <h2>点击题号切换当前作答位置</h2>
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
        <div className="row-between">
          <div>
            <span className="surface-tag">第 {activeQuestionIndex + 1} 题</span>
            <h2>{activeQuestion.prompt}</h2>
          </div>
          <span className="surface-tag">{activeQuestion.reviewLabel}</span>
        </div>

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
          <strong>对应复习模块</strong>
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
          disabled={answeredCount !== examQuestions.length || isSubmitting}
          onClick={() => {
            void handleSubmit();
          }}
        >
          {isSubmitting ? "提交中..." : "提交考试"}
        </button>
      </div>
    </div>
  );
}
