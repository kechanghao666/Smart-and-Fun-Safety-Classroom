import { Link } from "react-router-dom";
import { fetchStudentAiReport, fetchStudentGrowth } from "../../services/student";
import { useAppState } from "../../state/AppState";
import type { StudentAiReportResponse, StudentGrowthResponse } from "../../types";
import { buildStudentAiReport } from "../../utils/studentAiReport";
import { buildGrowthSnapshot, getGrowthSceneVisualClass } from "../../utils/studentGrowth";
import { useApiResource } from "../../utils/useApiResource";

export function StudentAiReportPage() {
  const { state } = useAppState();
  const fallbackReport = buildStudentAiReport(state);
  const fallbackGrowth = buildGrowthSnapshot(state);
  const apiEnabled = state.authSource === "api" && Boolean(state.authToken);

  const fallbackReportData: StudentAiReportResponse = {
    completion: {
      title: fallbackReport.headline,
      summary: fallbackReport.summary,
      bullets: [fallbackReport.progressLabel, fallbackReport.scoreCaption],
    },
    performance: {
      title: "表现情况卡片",
      summary: fallbackReport.encouragement,
      bullets: fallbackReport.strengths,
    },
    suggestion: {
      title: "建议卡片",
      summary: fallbackReport.focusAreas[0]?.suggestion ?? "继续围绕当前主题进行复习。",
      bullets: fallbackReport.focusAreas.flatMap((item) => item.prompts),
    },
    reward: {
      title: "激励展示卡片",
      summary: `当前已获得 ${fallbackReport.badges.length} 枚徽章。`,
      bullets: fallbackReport.badges,
    },
    growth: {
      title: "成长结果卡片",
      summary: fallbackReport.growthLabel,
      bullets: fallbackReport.milestones.map((item) => `${item.label}：${item.value}`),
    },
  };

  const fallbackGrowthData: StudentGrowthResponse = {
    characterName: state.studentProfile?.nickname ?? "安全学员",
    linkedAiRole: "安全小助手",
    totalGrowthPoints: fallbackGrowth.points,
    nextLevelTarget: fallbackGrowth.nextTier?.minPoints ?? null,
    nextLevelRemaining: fallbackGrowth.nextTier ? fallbackGrowth.pointsToNext : null,
    nextLevelLabel: fallbackGrowth.nextTier?.title ?? null,
    streakDays: fallbackGrowth.currentStreakDays,
    stageLabel: fallbackGrowth.currentTier.title,
    growthSummary: fallbackGrowth.currentTier.description,
    currentAppearance: fallbackGrowth.selectedAppearance,
    currentScene: fallbackGrowth.selectedScene,
    currentAbilityTag: fallbackGrowth.currentTier.ability,
    dimensions: fallbackGrowth.dimensions.map((item) => ({
      id: item.id === "observe" ? "appearance" : item.id === "judge" ? "safety" : "scene",
      label: item.label,
      points: item.score,
      level: 0,
      progressPercent: item.score,
      currentUnlockLabel: item.label,
      nextUnlockLabel: null,
    })),
    unlockedAppearances: fallbackGrowth.appearanceOptions.filter((item) => item.unlocked).map((item) => item.label),
    unlockedAbilityTags: [fallbackGrowth.currentTier.ability],
    unlockedScenes: fallbackGrowth.sceneOptions.filter((item) => item.unlocked).map((item) => item.label),
    history: [],
  };

  const { data: reportData, error } = useApiResource({
    enabled: apiEnabled,
    fallbackData: fallbackReportData,
    fetcher: () => fetchStudentAiReport(state.authToken!),
    dependencies: [state.authToken, state.progress.exam.score, state.progress.points],
    fallbackMessage: "AI 结果页暂时无法同步，当前展示学习总结卡。",
  });

  const { data: growthData } = useApiResource({
    enabled: apiEnabled,
    fallbackData: fallbackGrowthData,
    fetcher: () => fetchStudentGrowth(state.authToken!),
    dependencies: [state.authToken, state.progress.points, state.progress.rewardProgress.reviewedWrongQuestionIds.join("|")],
    fallbackMessage: "成长结果暂时无法同步，当前展示当前成长概览。",
  });

  const sceneVisualClass = getGrowthSceneVisualClass(growthData.currentScene);

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--report">
        <div>
          <span className="hero-banner__eyebrow">AI 结果卡页</span>
          <h1>{reportData.completion.title}</h1>
          <p>{reportData.completion.summary}</p>
          {error ? <p className="inline-note">{error}</p> : null}
        </div>
        <div className="result-medal result-medal--report">
          <strong>{growthData.stageLabel}</strong>
          <span>{growthData.totalGrowthPoints} 成长值</span>
        </div>
      </section>

      <section className="card-grid card-grid--three">
        {[reportData.completion, reportData.performance, reportData.suggestion].map((card, index) => (
          <article
            key={card.title}
            className={
              index === 0
                ? "surface-card report-card report-card--blue report-card--compact"
                : index === 1
                  ? "surface-card report-card report-card--mint report-card--compact"
                  : "surface-card report-card report-card--orange report-card--compact"
            }
          >
            <span className="section-block__eyebrow">{card.title}</span>
            <h2>{card.summary}</h2>
            <ul className="plain-list">
              {card.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card report-panel report-panel--compact">
          <span className="section-block__eyebrow">成长结果</span>
          <h2>{reportData.growth.title}</h2>
          <div className={`growth-scene-preview ${sceneVisualClass}`}>
            <strong>{growthData.currentAppearance}</strong>
            <p>{growthData.currentScene}</p>
          </div>
          <ul className="plain-list">
            <li>当前阶段：{growthData.stageLabel}</li>
            <li>能力标签：{growthData.currentAbilityTag}</li>
            <li>已解锁外观：{growthData.unlockedAppearances.join(" / ") || "暂无"}</li>
            <li>已解锁场景：{growthData.unlockedScenes.join(" / ") || "暂无"}</li>
          </ul>
        </article>

        <article className="surface-card report-panel report-panel--compact">
          <span className="section-block__eyebrow">激励展示</span>
          <h2>{reportData.reward.title}</h2>
          <p>{reportData.reward.summary}</p>
          <ul className="plain-list">
            {reportData.reward.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">成长维度</span>
            <h2>把结果、成长和激励放到同一页</h2>
          </div>
        </div>

        <div className="card-grid card-grid--three">
          {growthData.dimensions.map((dimension) => (
            <article key={dimension.id} className="report-milestone-card report-milestone-card--compact">
              <span className="section-block__eyebrow">{dimension.label}</span>
              <h3>{dimension.points}</h3>
              <p>当前解锁：{dimension.currentUnlockLabel}</p>
              <p>{dimension.nextUnlockLabel ? `下一档：${dimension.nextUnlockLabel}` : "当前维度已解锁到最高档。"}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="button-row">
        <Link className="ghost-button link-button" to="/student/theme/road-safety/exam/result">
          返回考试结果页
        </Link>
        <Link className="ghost-button link-button" to="/student/theme/road-safety/wrong-questions">
          错题回看页
        </Link>
        <Link className="ghost-button link-button" to="/student/records">
          学习记录页
        </Link>
      </div>
    </div>
  );
}
