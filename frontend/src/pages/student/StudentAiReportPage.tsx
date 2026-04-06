import { Link } from "react-router-dom";
import { StudentAdventureHero } from "../../components/student/StudentAdventureHero";
import { StudentMascotBubble } from "../../components/student/StudentMascotBubble";
import { fetchStudentAiReport, fetchStudentGrowth } from "../../services/student";
import { useAppState } from "../../state/AppState";
import type { StudentAiReportResponse, StudentGrowthResponse } from "../../types";
import { buildStudentAiReport } from "../../utils/studentAiReport";
import {
  buildGrowthSnapshot,
  getGrowthSceneVisualClass,
} from "../../utils/studentGrowth";
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
      id:
        item.id === "observe"
          ? "appearance"
          : item.id === "judge"
            ? "safety"
            : "scene",
      label: item.label,
      points: item.score,
      level: 0,
      progressPercent: item.score,
      currentUnlockLabel: item.label,
      nextUnlockLabel: null,
    })),
    unlockedAppearances: fallbackGrowth.appearanceOptions
      .filter((item) => item.unlocked)
      .map((item) => item.label),
    unlockedAbilityTags: [fallbackGrowth.currentTier.ability],
    unlockedScenes: fallbackGrowth.sceneOptions
      .filter((item) => item.unlocked)
      .map((item) => item.label),
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
    dependencies: [
      state.authToken,
      state.progress.points,
      state.progress.rewardProgress.reviewedWrongQuestionIds.join("|"),
    ],
    fallbackMessage: "成长结果暂时无法同步，当前展示当前成长概览。",
  });

  const sceneVisualClass = getGrowthSceneVisualClass(growthData.currentScene);

  return (
    <div className="page-stack student-page student-page--report">
      <StudentAdventureHero
        eyebrow="AI 总结卡"
        title={reportData.completion.title}
        description={reportData.completion.summary}
        bubbleTitle="今天的亮点"
        bubbleText={reportData.performance.summary}
        mascotLabel={`${growthData.totalGrowthPoints}`}
        mascotHint={error || `${growthData.stageLabel} · ${growthData.currentAbilityTag}`}
        accent="orange"
        variant="result"
        stats={[
          { label: "成长值", value: `${growthData.totalGrowthPoints}`, accent: "orange" },
          { label: "当前阶段", value: growthData.stageLabel, accent: "mint" },
          { label: "当前场景", value: growthData.currentScene, accent: "sky" },
        ]}
        actions={
          <>
            <Link
              className="ghost-button link-button"
              to="/student/theme/road-safety/exam/result"
            >
              返回考试结果
            </Link>
            <Link className="ghost-button link-button" to="/student/records">
              打开学习记录
            </Link>
          </>
        }
        aside={
          <div className={`student-growth-stage ${sceneVisualClass}`}>
            <span className="student-growth-stage__eyebrow">角色展示</span>
            <strong>{growthData.currentAppearance}</strong>
            <p>{growthData.currentScene}</p>
            <span>{growthData.currentAbilityTag}</span>
          </div>
        }
      />

      <section className="student-card-grid student-card-grid--three">
        {[reportData.completion, reportData.performance, reportData.suggestion].map(
          (card, index) => (
            <article
              key={card.title}
              className={
                index === 0
                  ? "surface-card student-report-spotlight student-report-spotlight--sky"
                  : index === 1
                    ? "surface-card student-report-spotlight student-report-spotlight--mint"
                    : "surface-card student-report-spotlight student-report-spotlight--orange"
              }
            >
              <span className="section-block__eyebrow">{card.title}</span>
              <strong>{card.summary}</strong>
              <div className="student-checklist">
                {card.bullets.map((item) => (
                  <div key={item} className="student-checklist__item">
                    <span className="student-checklist__dot" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </article>
          ),
        )}
      </section>

      <section className="student-card-grid student-card-grid--two">
        <article className="surface-card student-growth-board">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">成长结果</span>
            <h2>这轮学习把角色推到了哪里？</h2>
          </div>

          <div className="student-growth-board__layout">
            <div className={`student-growth-board__preview ${sceneVisualClass}`}>
              <div className="student-growth-board__badge">{growthData.stageLabel}</div>
              <strong>{growthData.currentAppearance}</strong>
              <p>{growthData.currentScene}</p>
            </div>

            <div className="student-checklist">
              <div className="student-checklist__item">
                <span className="student-checklist__dot" />
                <span>当前能力：{growthData.currentAbilityTag}</span>
              </div>
              <div className="student-checklist__item">
                <span className="student-checklist__dot" />
                <span>
                  已解锁外观：{growthData.unlockedAppearances.join(" / ") || "暂无"}
                </span>
              </div>
              <div className="student-checklist__item">
                <span className="student-checklist__dot" />
                <span>已解锁场景：{growthData.unlockedScenes.join(" / ") || "暂无"}</span>
              </div>
            </div>
          </div>
        </article>

        <StudentMascotBubble
          eyebrow="奖励口袋"
          title={reportData.reward.title}
          message={reportData.reward.summary}
          accent="mint"
          actions={
            reportData.reward.bullets.length > 0 ? (
              <>
                {reportData.reward.bullets.slice(0, 3).map((item) => (
                  <span key={item} className="surface-tag">
                    {item}
                  </span>
                ))}
              </>
            ) : (
              <span className="surface-tag">继续完成学习会点亮更多奖励</span>
            )
          }
        />
      </section>

      <section className="surface-card student-report-path-board">
        <div className="student-section-heading">
          <span className="section-block__eyebrow">成长里程碑</span>
          <h2>观察、判断和防护这三条路都往前走了</h2>
        </div>

        <div className="student-card-grid student-card-grid--three">
          {growthData.dimensions.map((dimension) => (
            <article key={dimension.id} className="student-growth-dimension-card">
              <span className="student-growth-dimension-card__label">{dimension.label}</span>
              <strong>{dimension.points}</strong>
              <div className="growth-track">
                <span
                  className="growth-track__fill growth-track__fill--warm"
                  style={{ width: `${dimension.progressPercent}%` }}
                />
              </div>
              <p>{dimension.currentUnlockLabel}</p>
              <span>
                {dimension.nextUnlockLabel
                  ? `下一档：${dimension.nextUnlockLabel}`
                  : "这一项已经全部点亮"}
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="student-card-grid student-card-grid--three">
        <Link
          className="student-mini-link student-mini-link--link"
          to="/student/theme/road-safety/wrong-questions"
        >
          <strong>错题回看</strong>
          <span>把这轮挑战里需要补的点再修一修</span>
        </Link>
        <Link className="student-mini-link student-mini-link--link" to="/student/records">
          <strong>学习记录</strong>
          <span>回看这一轮从开始到收尾的每一站</span>
        </Link>
        <Link className="student-mini-link student-mini-link--link" to="/student/theme/road-safety">
          <strong>回到主题地图</strong>
          <span>从地图重新开始下一轮冒险</span>
        </Link>
      </section>
    </div>
  );
}
