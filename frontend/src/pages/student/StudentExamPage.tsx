import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StudentAdventureHero } from "../../components/student/StudentAdventureHero";
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
        <h2>考试宝箱还没有打开</h2>
        <p>先完成三关学习，再回来挑战考试宝箱。</p>
        <button
          type="button"
          className="primary-button"
          onClick={() => navigate("/student/theme/road-safety")}
        >
          返回主题地图
        </button>
      </section>
    );
  }

  if (state.progress.exam.status === "completed") {
    return (
      <section className="surface-card empty-state-card">
        <span className="section-block__eyebrow">主题考试</span>
        <h2>这一轮考试已经完成</h2>
        <p>去看结果页和错题页，继续把这一轮学习收口吧。</p>
        <div className="button-row">
          <Link
            className="primary-button link-button"
            to="/student/theme/road-safety/exam/result"
          >
            看考试结果
          </Link>
          <Link
            className="ghost-button link-button"
            to="/student/theme/road-safety/wrong-questions"
          >
            错题回看
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

        replaceProgress({
          ...progress,
          exam: {
            ...progress.exam,
            studentAnswers: answers,
          },
        });
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

    submitExam(score, wrongQuestionIds, answers);
    navigate("/student/theme/road-safety/exam/result");
  }

  return (
    <div className="page-stack student-page student-page--exam">
      <StudentAdventureHero
        eyebrow="考试宝箱"
        title="道路安全挑战开始啦"
        description="一题一题慢慢做，先想想学过的安全规则，再选最稳妥的做法。"
        bubbleTitle="答题规则"
        bubbleText="先看清题目，再选最安全的做法。全部答完后，结果宝箱就会打开。"
        mascotLabel={`${answeredCount}/${examQuestions.length}`}
        mascotHint="答完全部题目后，提交按钮就会亮起来。"
        variant="exam"
        accent="orange"
        stats={[
          { label: "已完成", value: `${answeredCount} 题`, accent: "sky" },
          { label: "当前题号", value: `第 ${activeQuestionIndex + 1} 题`, accent: "orange" },
          {
            label: "剩余题目",
            value: `${examQuestions.length - answeredCount} 题`,
            accent: "mint",
          },
        ]}
      />

      {submitError ? (
        <article className="feedback-box">
          <strong>提交提醒</strong>
          <p>{submitError}</p>
        </article>
      ) : null}

      <section className="student-card-grid student-card-grid--two">
        <article className="surface-card student-exam-panel">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">题号导航</span>
            <h2>先把进度点亮</h2>
          </div>
          <div className="student-exam-nav">
            {examQuestions.map((question, index) => (
              <button
                key={question.id}
                type="button"
                className={
                  index === activeQuestionIndex
                    ? "student-exam-nav__button student-exam-nav__button--active"
                    : answers[question.id] !== undefined
                      ? "student-exam-nav__button student-exam-nav__button--done"
                      : "student-exam-nav__button"
                }
                onClick={() => setActiveQuestionIndex(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </article>

        <article className="surface-card student-exam-panel">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">答题提醒</span>
            <h2>先想起这几个安全规则</h2>
          </div>
          <div className="student-checklist">
            <div className="student-checklist__item">
              <span className="student-checklist__dot" />
              <span>先看斑马线、信号灯和来车。</span>
            </div>
            <div className="student-checklist__item">
              <span className="student-checklist__dot" />
              <span>看到大车时，要特别注意盲区。</span>
            </div>
            <div className="student-checklist__item">
              <span className="student-checklist__dot" />
              <span>上车前要记得安全带和头盔。</span>
            </div>
          </div>
        </article>
      </section>

      <section className="surface-card student-question-stage">
        <div className="student-question-stage__top">
          <div>
            <span className="surface-tag">第 {activeQuestionIndex + 1} 题</span>
            <h2>{activeQuestion.prompt}</h2>
          </div>
          <span className="surface-tag">{activeQuestion.reviewLabel}</span>
        </div>

        <div className="student-answer-grid">
          {activeQuestion.options.map((option, optionIndex) => (
            <button
              key={option}
              type="button"
              className={
                answers[activeQuestion.id] === optionIndex
                  ? "student-answer-card student-answer-card--selected"
                  : "student-answer-card"
              }
              onClick={() =>
                setAnswers((current) => ({
                  ...current,
                  [activeQuestion.id]: optionIndex,
                }))
              }
            >
              <span className="student-answer-card__label">
                {String.fromCharCode(65 + optionIndex)}
              </span>
              <strong>{option}</strong>
            </button>
          ))}
        </div>

        <article className="student-inline-tip">
          <strong>提示</strong>
          <p>{activeQuestion.reviewSuggestion}</p>
        </article>
      </section>

      <div className="button-row button-row--wide">
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
          className="primary-button primary-button--playful"
          disabled={answeredCount !== examQuestions.length || isSubmitting}
          onClick={() => {
            void handleSubmit();
          }}
        >
          {isSubmitting ? "提交中..." : "打开结果宝箱"}
        </button>
      </div>
    </div>
  );
}
