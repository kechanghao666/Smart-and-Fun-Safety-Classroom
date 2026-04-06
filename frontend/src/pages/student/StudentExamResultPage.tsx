import { Link, useNavigate } from "react-router-dom";
import { StudentAdventureHero } from "../../components/student/StudentAdventureHero";
import { examQuestions } from "../../data/mockData";
import { fetchStudentExamReview } from "../../services/student";
import { useAppState } from "../../state/AppState";
import type { StudentExamReviewResponse } from "../../types";
import { useApiResource } from "../../utils/useApiResource";

export function StudentExamResultPage() {
  const navigate = useNavigate();
  const { state } = useAppState();
  const apiEnabled = state.authSource === "api" && Boolean(state.authToken);

  if (state.progress.exam.status !== "completed") {
    return (
      <section className="surface-card empty-state-card">
        <span className="section-block__eyebrow">考试结果页</span>
        <h2>还没有可以展示的结果</h2>
        <p>先完成三关学习并提交考试，再回来打开结果宝箱。</p>
        <div className="button-row">
          <button
            type="button"
            className="primary-button"
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
        </div>
      </section>
    );
  }

  const fallbackReview: StudentExamReviewResponse = {
    totalWrongQuestions: state.progress.exam.wrongQuestionIds.length,
    suggestion:
      state.progress.exam.wrongQuestionIds.length > 0
        ? "建议先去错题回看页，逐题补强薄弱点。"
        : "这轮没有错题，可以直接查看 AI 结果卡。",
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
        reviewed: state.progress.rewardProgress.reviewedWrongQuestionIds.includes(
          question.id,
        ),
        reviewedAt: null,
      })),
  };

  const { data: reviewData, error, source } = useApiResource({
    enabled: apiEnabled,
    fallbackData: fallbackReview,
    fetcher: () => fetchStudentExamReview(state.authToken!),
    dependencies: [
      state.authToken,
      state.progress.exam.score,
      state.progress.exam.wrongQuestionIds.join("|"),
    ],
    fallbackMessage: "考试结果页暂时无法更新，当前展示已保存的结果信息。",
  });

  const score = state.progress.exam.score ?? 0;
  const wrongCount = reviewData.totalWrongQuestions;
  const correctCount = state.progress.exam.totalQuestions - wrongCount;
  const highlightLabels = Array.from(
    new Set(reviewData.items.map((item) => item.reviewLabel)),
  ).slice(0, 3);
  const performanceLabel =
    wrongCount === 0 ? "全对通关" : score >= 80 ? "表现真棒" : "继续努力";

  return (
    <div className="page-stack student-page student-page--exam-result">
      <StudentAdventureHero
        eyebrow="挑战完成"
        title="考试宝箱已经打开"
        description="你已经完成道路安全主题考试，快看看今天收到了什么奖励。"
        bubbleTitle="结果播报"
        bubbleText={wrongCount === 0 ? "恭喜你全部答对啦" : reviewData.suggestion}
        mascotLabel={`${score}`}
        mascotHint={
          error || (apiEnabled && source === "api" ? "最新成绩已经同步" : performanceLabel)
        }
        variant="result"
        accent="orange"
        stats={[
          { label: "考试分数", value: `${score} 分`, accent: "orange" },
          { label: "答对题数", value: `${correctCount} 题`, accent: "mint" },
          { label: "错题数量", value: `${wrongCount} 题`, accent: "sky" },
        ]}
      />

      <section className="student-card-grid student-card-grid--three">
        <article className="surface-card student-celebration-card student-celebration-card--orange">
          <span className="student-celebration-card__eyebrow">考试表现</span>
          <strong>{performanceLabel}</strong>
          <p>总题数 {state.progress.exam.totalQuestions} 题。</p>
        </article>

        <article className="surface-card student-celebration-card student-celebration-card--mint">
          <span className="student-celebration-card__eyebrow">积分奖励</span>
          <strong>{state.progress.points}</strong>
          <p>这轮考试的奖励已经算进当前积分。</p>
        </article>

        <article className="surface-card student-celebration-card student-celebration-card--sky">
          <span className="student-celebration-card__eyebrow">下一步</span>
          <strong>{wrongCount > 0 ? "去错题回看" : "去 AI 结果卡"}</strong>
          <p>{wrongCount > 0 ? "先把薄弱点补齐。" : "继续看本轮学习总结。"}</p>
        </article>
      </section>

      <section className="student-card-grid student-card-grid--two">
        <article className="surface-card student-link-board">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">结果去向</span>
            <h2>现在最适合接着去哪儿？</h2>
          </div>
          <div className="student-mini-links">
            <Link
              className="student-mini-link student-mini-link--link"
              to="/student/theme/road-safety/wrong-questions"
            >
              <strong>错题回看</strong>
              <span>
                {highlightLabels.length > 0
                  ? highlightLabels.join(" / ")
                  : "查看解析和建议复习关卡"}
              </span>
            </Link>
            <Link className="student-mini-link student-mini-link--link" to="/student/ai-report">
              <strong>AI 结果卡</strong>
              <span>看亮点、成长和下一步</span>
            </Link>
            <Link className="student-mini-link student-mini-link--link" to="/student/records">
              <strong>学习记录</strong>
              <span>把这轮挑战收进记录册</span>
            </Link>
          </div>
        </article>

        <article className="surface-card student-reward-board">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">错题概览</span>
            <h2>先回看这些重点</h2>
          </div>
          {reviewData.items.length > 0 ? (
            <div className="student-checklist">
              {reviewData.items.slice(0, 4).map((item) => (
                <div key={item.questionId} className="student-checklist__item">
                  <span className="student-checklist__dot" />
                  <span>{item.reviewLabel}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="student-checklist">
              <div className="student-checklist__item">
                <span className="student-checklist__dot" />
                <span>这一轮没有错题，直接去看 AI 结果卡吧。</span>
              </div>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
