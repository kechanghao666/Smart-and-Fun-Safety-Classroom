import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { examQuestions } from "../../data/mockData";
import {
  completeStudentWrongQuestionReview as completeStudentWrongQuestionReviewToApi,
  fetchStudentExamReview,
  fetchStudentProgress,
} from "../../services/student";
import { useAppState } from "../../state/AppState";
import type { StudentExamReviewResponse } from "../../types";
import { WRONG_QUESTION_REVIEW_REWARD } from "../../utils/studentRewards";

export function StudentWrongQuestionsPage() {
  const navigate = useNavigate();
  const {
    completeWrongQuestionReview,
    replaceProgress,
    state,
  } = useAppState();
  const apiEnabled = state.authSource === "api" && Boolean(state.authToken);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(apiEnabled && state.progress.exam.status === "completed");
  const [submittingQuestionId, setSubmittingQuestionId] = useState<string | null>(null);

  const fallbackReview = useMemo<StudentExamReviewResponse>(
    () => ({
      totalWrongQuestions: state.progress.exam.wrongQuestionIds.length,
      suggestion:
        state.progress.exam.wrongQuestionIds.length > 0
          ? "建议先查看错题解析，再回到对应关卡完成重学。"
          : "本轮没有错题，可以直接查看 AI 结果卡和成长档案。",
      items: examQuestions
        .filter((question) => state.progress.exam.wrongQuestionIds.includes(question.id))
        .map((question) => ({
          questionId: question.id,
          prompt: question.prompt,
          studentAnswer:
            typeof state.progress.exam.studentAnswers?.[question.id] === "number"
              ? question.options[state.progress.exam.studentAnswers[question.id] ?? 0] ?? null
              : null,
          correctAnswer: question.options[question.correctIndex] ?? "",
          explanation: question.explanation,
          reviewLevelId: question.reviewLevelId,
          reviewLabel: question.reviewLabel,
          reviewSuggestion: question.reviewSuggestion,
          reviewed: state.progress.rewardProgress.reviewedWrongQuestionIds.includes(question.id),
          reviewedAt: null,
        })),
    }),
    [state.progress.exam.studentAnswers, state.progress.exam.wrongQuestionIds, state.progress.rewardProgress.reviewedWrongQuestionIds],
  );
  const [reviewData, setReviewData] = useState<StudentExamReviewResponse>(fallbackReview);

  useEffect(() => {
    setReviewData(fallbackReview);
  }, [fallbackReview]);

  useEffect(() => {
    let cancelled = false;

    if (!apiEnabled || !state.authToken || state.progress.exam.status !== "completed") {
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    setError("");

    void fetchStudentExamReview(state.authToken)
      .then((result) => {
        if (!cancelled) {
          setReviewData(result);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "错题回看暂时无法更新，当前展示已保存的复习内容。",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiEnabled, state.authToken, state.progress.exam.status]);

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

  const reviewedCount = reviewData.items.filter((item) => item.reviewed).length;
  const remainingCount = reviewData.items.length - reviewedCount;

  async function handleComplete(questionId: string) {
    if (submittingQuestionId) {
      return;
    }

    setError("");
    setSubmittingQuestionId(questionId);

    try {
      if (apiEnabled && state.authToken) {
        await completeStudentWrongQuestionReviewToApi(state.authToken, questionId);
        const [nextReview, nextProgress] = await Promise.all([
          fetchStudentExamReview(state.authToken),
          fetchStudentProgress(state.authToken),
        ]);
        setReviewData(nextReview);
        replaceProgress(nextProgress);
      } else {
        completeWrongQuestionReview(questionId);
        setReviewData((current) => ({
          ...current,
          items: current.items.map((item) =>
            item.questionId === questionId
              ? {
                  ...item,
                  reviewed: true,
                  reviewedAt: new Date().toISOString(),
                }
              : item,
          ),
        }));
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "错题重学状态保存失败，请稍后重试。",
      );
    } finally {
      setSubmittingQuestionId(null);
    }
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--report">
        <div>
          <span className="hero-banner__eyebrow">错题回看页</span>
          <h1>把错题、作答记录、解析和重学奖励放在同一页里</h1>
          <p>
            你可以先看自己当时的答案，再看正确答案和解析，最后回到对应关卡完成重学并刷新成长奖励。
          </p>
          {error ? <p className="inline-note">{error}</p> : null}
        </div>

        <div className="progress-ring">
          <strong>{reviewData.totalWrongQuestions}</strong>
          <span>{isLoading ? "同步中" : "当前错题数"}</span>
        </div>
      </section>

      <section className="card-grid card-grid--three">
        <article className="surface-card">
          <span className="section-block__eyebrow">回看概览</span>
          <h2>本轮最该补强什么？</h2>
          <ul className="plain-list">
            <li>错题数量：{reviewData.totalWrongQuestions} 题</li>
            <li>已完成重学：{reviewedCount} 题</li>
            <li>仍待回看：{remainingCount} 题</li>
          </ul>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">重学奖励</span>
          <h2>完成回看也会继续点亮成长值</h2>
          <ul className="plain-list">
            <li>每完成 1 道错题重学：+{WRONG_QUESTION_REVIEW_REWARD} 成长值</li>
            <li>当前积分累计：{state.progress.points}</li>
            <li>已登记回看题目：{state.progress.rewardProgress.reviewedWrongQuestionIds.length} 题</li>
          </ul>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">回看顺序</span>
          <h2>建议按这三个步骤复习</h2>
          <ul className="plain-list">
            <li>先看自己当时的作答，找到判断偏差点。</li>
            <li>再看正确答案和简短解析，补回知识点。</li>
            <li>最后回到对应关卡，完成一次重学并刷新成长档案。</li>
          </ul>
        </article>
      </section>

      {reviewData.items.length > 0 ? (
        <section className="page-stack exam-review-list">
          {reviewData.items.map((item, index) => {
            const isReviewed = item.reviewed;
            const isSubmittingCurrent = submittingQuestionId === item.questionId;

            return (
              <article key={item.questionId} className="surface-card exam-review-card">
                <div className="exam-review-card__header">
                  <div>
                    <span className="surface-tag">错题 {index + 1}</span>
                    <h2>{item.prompt}</h2>
                  </div>
                  <span className="exam-review-chip">{item.reviewLabel}</span>
                </div>

                <div className="card-grid card-grid--three">
                  <article className="feedback-box">
                    <strong>你的作答</strong>
                    <p>{item.studentAnswer ?? "当前没有记录到本地作答结果"}</p>
                  </article>
                  <article className="feedback-box">
                    <strong>正确答案</strong>
                    <p>{item.correctAnswer}</p>
                  </article>
                  <article className="feedback-box">
                    <strong>简短解析</strong>
                    <p>{item.explanation}</p>
                  </article>
                </div>

                <article className="feedback-box">
                  <strong>建议回看</strong>
                  <p>{item.reviewSuggestion}</p>
                </article>

                <article
                  className={
                    isReviewed
                      ? "feedback-box reward-feedback-box reward-feedback-box--claimed"
                      : "feedback-box reward-feedback-box"
                  }
                >
                  <strong>错题重学奖励</strong>
                  <p>
                    {isReviewed
                      ? "这道错题的重学奖励已经领取，成长档案已同步刷新。"
                      : `完成这道错题的回看与重学后，可获得 +${WRONG_QUESTION_REVIEW_REWARD} 成长值。`}
                  </p>
                </article>

                <div className="button-row">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => navigate(`/student/theme/road-safety/level/${item.reviewLevelId}`)}
                  >
                    回看对应关卡
                  </button>
                  <button
                    type="button"
                    className={isReviewed ? "ghost-button" : "primary-button"}
                    disabled={isReviewed || isSubmittingCurrent}
                    onClick={() => {
                      void handleComplete(item.questionId);
                    }}
                  >
                    {isReviewed ? "已完成本次重学" : isSubmittingCurrent ? "提交中..." : `完成本次重学并领取 +${WRONG_QUESTION_REVIEW_REWARD}`}
                  </button>
                  <Link className="ghost-button link-button" to="/student/theme/road-safety/exam/result">
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
          <p>可以直接进入 AI 学习结果页，完成本轮学习总结与成长回看。</p>
          <div className="button-row">
            <Link className="primary-button link-button" to="/student/ai-report">
              查看 AI 结果卡
            </Link>
            <Link className="ghost-button link-button" to="/student/theme/road-safety/exam/result">
              返回考试结果页
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
