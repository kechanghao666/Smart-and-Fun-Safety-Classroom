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
      title: "表现情况",
      summary: fallbackReport.encouragement,
      bullets: fallbackReport.strengths,
    },
    suggestion: {
      title: "复习建议",
      summary:
        fallbackReport.focusAreas[0]?.suggestion ??
        "继续围绕当前主题进行复习，把这轮学习再巩固一遍。",
      bullets: fallbackReport.focusAreas.flatMap((item) => item.prompts),
    },
    reward: {
      title: "奖励口袋",
      summary: `当前已经获得 ${fallbackReport.badges.length} 枚徽章。`,
      bullets: fallbackReport.badges,
    },
    growth: {
      title: "成长结果",
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
    fallbackMessage: "AI 结果页暂时无法同步，当前展示本地学习总结卡。",
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
    fallbackMessage: "成长结果暂时无法同步，当前展示本地成长概览。",
  });

  const sceneVisualClass = getGrowthSceneVisualClass(
    growthData.currentScene || fallbackGrowth.selectedScene,
  );
  const completedLevels = state.progress.levels.filter(
    (level) => level.status === "completed",
  ).length;
  const totalStars = fallbackGrowth.totalStars;
  const characterName =
    growthData.characterName?.trim() || state.studentProfile?.nickname || "安全学员";
  const stageLabel = growthData.stageLabel || fallbackGrowth.currentTier.title;
  const growthSummary = growthData.growthSummary || fallbackGrowth.currentTier.description;
  const currentAppearance =
    growthData.currentAppearance || fallbackGrowth.selectedAppearance || "基础形态";
  const currentScene = growthData.currentScene || fallbackGrowth.selectedScene || "城市街道";
  const currentAbilityTag =
    growthData.currentAbilityTag || fallbackGrowth.currentTier.ability || "交通观察基础";
  const linkedAiRole = growthData.linkedAiRole || fallbackGrowthData.linkedAiRole;
  const unlockedAppearances =
    growthData.unlockedAppearances.length > 0
      ? growthData.unlockedAppearances
      : [currentAppearance];
  const unlockedScenes =
    growthData.unlockedScenes.length > 0 ? growthData.unlockedScenes : [currentScene];
  const unlockedAbilityTags =
    growthData.unlockedAbilityTags.length > 0
      ? growthData.unlockedAbilityTags
      : [currentAbilityTag];
  const growthDimensions =
    growthData.dimensions.length > 0 ? growthData.dimensions : fallbackGrowthData.dimensions;
  const nextLevelLabel = growthData.nextLevelLabel ?? fallbackGrowthData.nextLevelLabel;
  const nextLevelRemaining =
    growthData.nextLevelRemaining ?? fallbackGrowthData.nextLevelRemaining;
  const nextGoalTitle = nextLevelLabel ? `下一站：${nextLevelLabel}` : "当前阶段已全部点亮";
  const nextGoalSummary =
    nextLevelLabel && nextLevelRemaining !== null
      ? `再获得 ${nextLevelRemaining} 点成长值，就能解锁 ${nextLevelLabel}。`
      : "你已经来到当前主题的最高成长阶段，继续闯关会让角色展示更完整。";
  const strongestDimension = [...growthDimensions].sort(
    (left, right) => right.points - left.points,
  )[0];
  const rewardBadges =
    reportData.reward.bullets.length > 0
      ? reportData.reward.bullets.slice(0, 4)
      : ["继续闯关", "完成考试", "错题回看"];
  const rewardProgressText =
    nextLevelLabel && nextLevelRemaining !== null
      ? `再获得 ${nextLevelRemaining} 点成长值，就能点亮下一档展示奖励。`
      : "当前阶段奖励已经点亮，继续学习会让展示卡更完整。";
  const rewardProgressPercent =
    nextLevelRemaining !== null && growthData.nextLevelTarget
      ? Math.max(
          12,
          Math.min(
            100,
            Math.round(
              (growthData.totalGrowthPoints / Math.max(growthData.nextLevelTarget, 1)) * 100,
            ),
          ),
        )
      : 100;

  return (
    <div className="page-stack student-page student-page--report">
      <StudentAdventureHero
        eyebrow="AI 总结卡"
        title={reportData.completion.title}
        description={reportData.completion.summary}
        bubbleTitle="今天的亮点"
        bubbleText={reportData.performance.summary}
        mascotLabel={`${growthData.totalGrowthPoints}`}
        mascotHint={error || `${stageLabel} · ${currentAbilityTag}`}
        accent="orange"
        variant="result"
        stats={[
          { label: "成长值", value: `${growthData.totalGrowthPoints}`, accent: "orange" },
          { label: "当前阶段", value: stageLabel, accent: "mint" },
          { label: "当前场景", value: currentScene, accent: "sky" },
        ]}
        actions={
          <>
            <Link className="ghost-button link-button" to="/student/theme/road-safety/exam/result">
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
            <strong>{currentAppearance}</strong>
            <p>{currentScene}</p>
            <span>{currentAbilityTag}</span>
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
        <article className="surface-card student-growth-board student-growth-board--rich">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">成长结果</span>
            <h2>这轮学习把角色推到了哪里？</h2>
          </div>

          <div className="student-growth-board__layout student-growth-board__layout--rich">
            <div className="student-growth-board__column student-growth-board__column--showcase">
              <div className={`student-growth-board__preview student-growth-board__preview--showcase ${sceneVisualClass}`}>
                <div className="student-growth-board__headline">
                  <div className="student-growth-board__chips">
                    <span>{stageLabel}</span>
                    <span>{linkedAiRole}</span>
                  </div>
                  <strong>{currentAppearance}</strong>
                  <p>{currentScene}</p>
                </div>

                <div className="student-growth-board__meta">
                  <span>当前展示角色</span>
                  <strong>{characterName}</strong>
                  <p>{growthSummary}</p>
                </div>

                <div className="student-growth-board__footer">
                  <span>能力：{currentAbilityTag}</span>
                  <span>{currentScene}</span>
                </div>
              </div>

              <article className="student-growth-board__summary-card student-growth-board__summary-card--highlight student-growth-board__summary-card--goal">
                <span className="section-block__eyebrow">下一步目标</span>
                <strong>{nextGoalTitle}</strong>
                <p className="student-growth-board__note">{nextGoalSummary}</p>
                <div className="student-growth-board__chips">
                  <span>场景：{unlockedScenes[0]}</span>
                  <span>能力标签：{unlockedAbilityTags[0]}</span>
                </div>
              </article>
            </div>

            <div className="student-growth-board__column student-growth-board__column--details">
              <div className="student-growth-board__quickline">
                <article className="student-growth-board__quick-card student-growth-board__quick-card--sky">
                  <span>成长值</span>
                  <strong>{growthData.totalGrowthPoints}</strong>
                </article>
                <article className="student-growth-board__quick-card student-growth-board__quick-card--mint">
                  <span>通关进度</span>
                  <strong>{completedLevels} / 3 关</strong>
                </article>
                <article className="student-growth-board__quick-card student-growth-board__quick-card--orange">
                  <span>连续学习</span>
                  <strong>{growthData.streakDays} 天</strong>
                </article>
              </div>

              <article className="student-growth-board__summary-card student-growth-board__summary-card--spotlight">
                <span className="section-block__eyebrow">这轮点亮</span>
                <div className="student-checklist">
                  <div className="student-checklist__item">
                    <span className="student-checklist__dot" />
                    <span>当前能力：{currentAbilityTag}</span>
                  </div>
                  <div className="student-checklist__item">
                    <span className="student-checklist__dot" />
                    <span>已点亮外观：{unlockedAppearances.slice(0, 2).join(" / ")}</span>
                  </div>
                  <div className="student-checklist__item">
                    <span className="student-checklist__dot" />
                    <span>表现最稳：{strongestDimension?.label ?? "观察力"} · {strongestDimension?.points ?? 0} 分</span>
                  </div>
                  <div className="student-checklist__item">
                    <span className="student-checklist__dot" />
                    <span>累计星级：{totalStars} 星</span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </article>

        <StudentMascotBubble
          eyebrow="奖励口袋"
          title={reportData.reward.title}
          message={reportData.reward.summary}
          accent="mint"
          notice={rewardProgressText}
          actions={
            rewardBadges.length > 0 ? (
              <>
                {rewardBadges.map((item) => (
                  <span key={item} className="surface-tag">
                    {item}
                  </span>
                ))}
              </>
            ) : (
              <span className="surface-tag">继续完成学习会点亮更多奖励</span>
            )
          }
          visual={
            <div className="student-report-reward-visual">
              <div className="student-report-reward-visual__hero">
                <div className="student-report-reward-visual__hero-copy">
                  <span className="section-block__eyebrow">奖励进度</span>
                  <strong>{nextLevelLabel ? `下一档：${nextLevelLabel}` : "奖励已经点亮"}</strong>
                  <p>{rewardProgressText}</p>
                </div>
                <div className="student-report-reward-visual__hero-meter">
                  <span>成长进度</span>
                  <strong>{rewardProgressPercent}%</strong>
                </div>
              </div>

              <div className="progress-bar progress-bar--compact">
                <span
                  className="progress-bar__fill progress-bar__fill--mint"
                  style={{ width: `${rewardProgressPercent}%` }}
                />
              </div>

              <div className="student-report-reward-visual__grid">
                <article className="student-report-reward-visual__card student-report-reward-visual__card--mint">
                  <span>徽章</span>
                  <strong>{state.progress.badges.length} 枚</strong>
                </article>
                <article className="student-report-reward-visual__card student-report-reward-visual__card--sky">
                  <span>星级</span>
                  <strong>{totalStars} 星</strong>
                </article>
                <article className="student-report-reward-visual__card student-report-reward-visual__card--orange">
                  <span>连续学习</span>
                  <strong>{growthData.streakDays} 天</strong>
                </article>
              </div>

              <div className="student-report-reward-visual__tags">
                <span>当前阶段：{stageLabel}</span>
                <span>最稳能力：{strongestDimension?.label ?? "观察力"}</span>
                <span>场景：{currentScene}</span>
              </div>

              <div className="student-report-reward-visual__summary">
                <article className="student-report-reward-visual__summary-card">
                  <span>当前角色</span>
                  <strong>{characterName}</strong>
                  <p>{currentAppearance}</p>
                </article>
                <article className="student-report-reward-visual__summary-card">
                  <span>下一次点亮</span>
                  <strong>{nextLevelLabel ?? "当前已点亮"}</strong>
                  <p>{nextLevelRemaining !== null ? `还差 ${nextLevelRemaining} 点成长值` : "继续保持当前节奏"}</p>
                </article>
              </div>
            </div>
          }
        />
      </section>

      <section className="surface-card student-report-path-board">
        <div className="student-section-heading">
          <span className="section-block__eyebrow">成长里程碑</span>
          <h2>观察、判断和防护这三条路都在往前走</h2>
        </div>

        <div className="student-card-grid student-card-grid--three">
          {growthDimensions.map((dimension) => (
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
