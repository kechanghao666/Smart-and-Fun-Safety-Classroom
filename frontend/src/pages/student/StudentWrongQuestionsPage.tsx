import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StudentAdventureHero } from "../../components/student/StudentAdventureHero";
import { StudentMascotBubble } from "../../components/student/StudentMascotBubble";
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
  const { completeWrongQuestionReview, replaceProgress, state } = useAppState();
  const apiEnabled = state.authSource === "api" && Boolean(state.authToken);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(
    apiEnabled && state.progress.exam.status === "completed",
  );
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
              ? question.options[state.progress.exam.studentAnswers[question.id] ?? 0] ??
                null
              : null,
          correctAnswer: question.options[question.correctIndex] ?? "",
          explanation: question.explanation,
          reviewLevelId: question.reviewLevelId,
          reviewLabel: question.reviewLabel,
          reviewSuggestion: question.reviewSuggestion,
          reviewed: state.progress.rewardProgress.reviewedWrongQuestionIds.includes(
            question.id,
          ),
          reviewedAt: null,
        })),
    }),
    [
      state.progress.exam.studentAnswers,
      state.progress.exam.wrongQuestionIds,
      state.progress.rewardProgress.reviewedWrongQuestionIds,
    ],
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
      <div className="page-stack student-page student-page--repair">
        <StudentAdventureHero
          eyebrow="补强任务页"
          title="还没有需要修补的错题任务"
          description="先完成主题考试，系统才会把错题、解析和回看入口整理成一张张补强任务卡。"
          bubbleTitle="下一步"
          bubbleText={
            state.progress.exam.status === "available"
              ? "考试宝箱已经打开啦，先去完成挑战。"
              : "先把三关都走完，考试入口才会出现。"
          }
          mascotLabel="修"
          mascotHint="等你考完回来，这里会自动变成错题修补站。"
          accent="orange"
          variant="result"
          actions={
            <>
              <button
                type="button"
                className="primary-button primary-button--playful"
                onClick={() => navigate("/student/theme/road-safety")}
              >
                返回主题地图
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
            </>
          }
        />
      </div>
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
    <div className="page-stack student-page student-page--repair">
      <StudentAdventureHero
        eyebrow="错题修补站"
        title="把这几道题修一修，奖励会继续往上涨"
        description="每一张错题卡都只保留最关键的信息：你当时怎么选、正确答案是什么、下一步该回看哪一关。"
        bubbleTitle="修补顺序"
        bubbleText={reviewData.suggestion}
        mascotLabel={`${reviewData.totalWrongQuestions}`}
        mascotHint={
          error ||
          (isLoading
            ? "正在同步最新错题任务..."
            : `已完成 ${reviewedCount} 道，还剩 ${remainingCount} 道。`)
        }
        accent="orange"
        variant="result"
        stats={[
          {
            label: "错题数量",
            value: `${reviewData.totalWrongQuestions} 道`,
            accent: "orange",
          },
          { label: "已完成重学", value: `${reviewedCount} 道`, accent: "mint" },
          { label: "单题奖励", value: `+${WRONG_QUESTION_REVIEW_REWARD}`, accent: "sky" },
        ]}
        actions={
          <>
            <Link
              className="ghost-button link-button"
              to="/student/theme/road-safety/exam/result"
            >
              返回考试结果
            </Link>
            <Link className="ghost-button link-button" to="/student/ai-report">
              查看 AI 结果卡
            </Link>
          </>
        }
      />

      <section className="student-card-grid student-card-grid--two">
        <article className="surface-card student-repair-summary-card">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">奖励提示</span>
            <h2>修好一题，就会多一份成长值</h2>
          </div>

          <div className="student-mini-card-grid">
            <div className="student-mini-card student-mini-card--orange">
              <span>单题奖励</span>
              <strong>+{WRONG_QUESTION_REVIEW_REWARD}</strong>
            </div>
            <div className="student-mini-card student-mini-card--sky">
              <span>当前积分</span>
              <strong>{state.progress.points}</strong>
            </div>
            <div className="student-mini-card student-mini-card--mint">
              <span>已登记重学</span>
              <strong>{state.progress.rewardProgress.reviewedWrongQuestionIds.length}</strong>
            </div>
          </div>
        </article>

        <StudentMascotBubble
          eyebrow="修补步骤"
          title="按这 3 步走，最不容易乱"
          message="先看看自己当时怎么想，再补回规则，最后回到对应关卡重新练一遍。"
          accent="mint"
          actions={
            <>
              <Link className="ghost-button link-button" to="/student/theme/road-safety">
                回到主题地图
              </Link>
              <Link className="ghost-button link-button" to="/student/growth">
                看成长档案
              </Link>
            </>
          }
        />
      </section>

      {reviewData.items.length > 0 ? (
        <section className="page-stack">
          {reviewData.items.map((item, index) => {
            const isReviewed = item.reviewed;
            const isSubmittingCurrent = submittingQuestionId === item.questionId;

            return (
              <article key={item.questionId} className="surface-card student-repair-card">
                <div className="student-repair-card__header">
                  <div>
                    <span className="surface-tag">修补任务 {index + 1}</span>
                    <h2>{item.prompt}</h2>
                  </div>
                  <span className="student-repair-card__badge">{item.reviewLabel}</span>
                </div>

                <div className="student-card-grid student-card-grid--three">
                  <article className="student-repair-note">
                    <span>你当时选了</span>
                    <strong>{item.studentAnswer ?? "没有记录到你的作答"}</strong>
                  </article>
                  <article className="student-repair-note student-repair-note--right">
                    <span>正确答案</span>
                    <strong>{item.correctAnswer}</strong>
                  </article>
                  <article className="student-repair-note">
                    <span>简短解析</span>
                    <strong>{item.explanation}</strong>
                  </article>
                </div>

                <div className="student-repair-card__footer">
                  <article className="student-repair-tip">
                    <strong>建议先回看</strong>
                    <p>{item.reviewSuggestion}</p>
                  </article>

                  <article
                    className={
                      isReviewed
                        ? "student-repair-tip student-repair-tip--claimed"
                        : "student-repair-tip"
                    }
                  >
                    <strong>{isReviewed ? "奖励已领取" : "完成就能领奖励"}</strong>
                    <p>
                      {isReviewed
                        ? "这道题的重学奖励已经记进成长档案里了。"
                        : `完成这道错题的回看和重学后，可获得 +${WRONG_QUESTION_REVIEW_REWARD} 成长值。`}
                    </p>
                  </article>
                </div>

                <div className="button-row">
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() =>
                      navigate(`/student/theme/road-safety/level/${item.reviewLevelId}`)
                    }
                  >
                    回看对应关卡
                  </button>
                  <button
                    type="button"
                    className={
                      isReviewed
                        ? "ghost-button"
                        : "primary-button primary-button--playful"
                    }
                    disabled={isReviewed || isSubmittingCurrent}
                    onClick={() => {
                      void handleComplete(item.questionId);
                    }}
                  >
                    {isReviewed
                      ? "这道题已经修好"
                      : isSubmittingCurrent
                        ? "正在记录..."
                        : `完成本次重学并领取 +${WRONG_QUESTION_REVIEW_REWARD}`}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="surface-card student-empty-panel">
          <strong>这一轮没有错题，太棒了</strong>
          <p>可以直接去看 AI 结果卡，把这一轮学习收个尾。</p>
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
