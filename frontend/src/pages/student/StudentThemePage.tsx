import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StudentAdventureHero } from "../../components/student/StudentAdventureHero";
import { StudentMascotBubble } from "../../components/student/StudentMascotBubble";
import { StatusBadge } from "../../components/StatusBadge";
import { fetchStudentGrowth } from "../../services/student";
import { useAppState } from "../../state/AppState";
import type { LevelId, StudentGrowthResponse } from "../../types";
import { useApiResource } from "../../utils/useApiResource";
import { useStudentAiScene } from "../../utils/useStudentAiScene";
import {
  buildGrowthSnapshot,
  getGrowthSceneVisualClass,
} from "../../utils/studentGrowth";
import { usePersistedState } from "../../utils/usePersistedState";

const levelGuides: Record<
  LevelId,
  { label: string; shortGoal: string; cardHint: string }
> = {
  "level-1": {
    label: "观察识别",
    shortGoal: "在路口大场景里先找安全线索，再识别明显危险行为。",
    cardHint: "左侧任务区 + 中间场景区 + 顶部状态栏",
  },
  "level-2": {
    label: "路线判断",
    shortGoal: "沿着回家地图逐站做判断，边走边守住安全值。",
    cardHint: "地图主视图 + 底部事件卡 + 安全值",
  },
  "level-3": {
    label: "操作守护",
    shortGoal: "完成公交车、私家车、电动车三段操作守护任务。",
    cardHint: "步骤切换 + 主场景 + 底部操作区",
  },
};

const levelLabels: Record<LevelId, string> = {
  "level-1": "第一关",
  "level-2": "第二关",
  "level-3": "第三关",
};

export function StudentThemePage() {
  const navigate = useNavigate();
  const { state } = useAppState();
  const fallbackGrowth = buildGrowthSnapshot(state);
  const apiEnabled = state.authSource === "api" && Boolean(state.authToken);
  const completedLevels = state.progress.levels.filter(
    (level) => level.status === "completed",
  ).length;
  const nextLevel = state.progress.levels.find(
    (level) => level.status === "available",
  );
  const examUnlocked = state.progress.exam.status !== "locked";
  const examCompleted = state.progress.exam.status === "completed";
  const accountKey = state.sessionAccount ?? "student";
  const [unlockAcknowledged, setUnlockAcknowledged] = usePersistedState<
    Record<string, boolean>
  >("student-theme-exam-unlock", {});
  const [showExamUnlock, setShowExamUnlock] = useState(false);

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

  const { data: growthData } = useApiResource({
    enabled: apiEnabled,
    fallbackData: fallbackGrowthData,
    fetcher: () => fetchStudentGrowth(state.authToken!),
    dependencies: [
      state.authToken,
      state.progress.points,
      state.progress.rewardProgress.reviewedWrongQuestionIds.join("|"),
    ],
    fallbackMessage: "成长信息暂时无法刷新，先展示当前已同步的数据。",
  });

  const sceneVisualClass = getGrowthSceneVisualClass(growthData.currentScene);
  const homeRoute = nextLevel
    ? `/student/theme/road-safety/level/${nextLevel.id}`
    : examCompleted
      ? "/student/theme/road-safety/exam/result"
      : "/student/theme/road-safety/exam";

  const themeAiPrompt = useMemo(
    () =>
      `我正在学习道路安全教育主题，已经完成 ${completedLevels} / 3 关，考试状态是 ${state.progress.exam.status}，请提醒我现在最适合先做什么。`,
    [completedLevels, state.progress.exam.status],
  );

  const {
    isLoading: isHintLoading,
    message: hintMessage,
    notice: hintNotice,
    refresh: refreshHint,
  } = useStudentAiScene({
    prompt: themeAiPrompt,
    scene: "hint",
    levelId: nextLevel?.id as LevelId | undefined,
    fallbackText: "先顺着三关路线往前走，完成观察识别、路线判断和操作守护，再去打开主题考试。",
  });

  useEffect(() => {
    if (!examUnlocked) {
      if (unlockAcknowledged[accountKey]) {
        setUnlockAcknowledged((current) => ({
          ...current,
          [accountKey]: false,
        }));
      }
      setShowExamUnlock(false);
      return;
    }

    if (!examCompleted && !unlockAcknowledged[accountKey]) {
      setShowExamUnlock(true);
    }

    if (examCompleted) {
      setShowExamUnlock(false);
    }
  }, [accountKey, examCompleted, examUnlocked, setUnlockAcknowledged, unlockAcknowledged]);

  function acknowledgeUnlock(nextRoute?: string) {
    setUnlockAcknowledged((current) => ({
      ...current,
      [accountKey]: true,
    }));
    setShowExamUnlock(false);

    if (nextRoute) {
      navigate(nextRoute);
    }
  }

  return (
    <div className="page-stack student-page student-page--theme">
      <StudentAdventureHero
        eyebrow="主题地图"
        title="道路安全三关闯关学习"
        description="这一页就是道路安全主题的总地图。三关按“观察识别 -> 路线判断 -> 操作守护”推进，全部完成后自动解锁主题考试。"
        bubbleTitle="当前建议"
        bubbleText={
          nextLevel
            ? `先去完成 ${nextLevel.title}`
            : examCompleted
              ? "主题考试已经完成，可以回看结果卡和学习记录。"
              : "三关已经走完，现在可以直接进入主题考试。"
        }
        mascotLabel={state.studentProfile?.avatarLabel.slice(0, 1) ?? "安"}
        mascotHint={`${growthData.stageLabel} · ${growthData.currentAbilityTag}`}
        variant="theme"
        accent="mint"
        stats={[
          { label: "已完成", value: `${completedLevels} / 3`, accent: "sky" },
          {
            label: "考试状态",
            value: examCompleted ? "已完成" : examUnlocked ? "已解锁" : "未解锁",
            accent: "orange",
          },
          { label: "当前外观", value: growthData.currentAppearance, accent: "mint" },
        ]}
        actions={
          <>
            <button
              type="button"
              className="primary-button primary-button--playful"
              onClick={() => navigate(homeRoute)}
            >
              前往当前重点
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => navigate("/student/records")}
            >
              打开学习记录
            </button>
          </>
        }
        aside={
          <div className={`student-theme-hero-card ${sceneVisualClass}`}>
            <span>当前成长形态</span>
            <strong>{growthData.currentAppearance}</strong>
            <p>{growthData.currentScene}</p>
          </div>
        }
      />

      <section className="surface-card student-theme-map-panel">
        <div className="student-section-heading">
          <span className="section-block__eyebrow">关卡路线</span>
          <h2>顺着这条学习路线一直往前走</h2>
        </div>
        <div className="student-theme-map">
          <div className="student-theme-map__step student-theme-map__step--active">
            <strong>第一站</strong>
            <span>观察识别</span>
          </div>
          <div
            className={
              completedLevels >= 1
                ? "student-theme-map__step student-theme-map__step--active"
                : "student-theme-map__step"
            }
          >
            <strong>第二站</strong>
            <span>路线判断</span>
          </div>
          <div
            className={
              completedLevels >= 2
                ? "student-theme-map__step student-theme-map__step--active"
                : "student-theme-map__step"
            }
          >
            <strong>第三站</strong>
            <span>操作守护</span>
          </div>
          <div
            className={
              examUnlocked
                ? "student-theme-map__step student-theme-map__step--treasure"
                : "student-theme-map__step student-theme-map__step--locked"
            }
          >
            <strong>主题考试</strong>
            <span>{examCompleted ? "已完成" : examUnlocked ? "已解锁" : "待解锁"}</span>
          </div>
        </div>
      </section>

      <section className="student-card-grid student-card-grid--two">
        <StudentMascotBubble
          eyebrow="AI 学习提醒"
          title="出发前先听一句"
          message={isHintLoading ? "AI 正在整理本轮学习提醒..." : hintMessage}
          accent="mint"
          notice={hintNotice}
          actions={
            <>
              <button
                type="button"
                className="ghost-button"
                onClick={() => void refreshHint()}
                disabled={isHintLoading}
              >
                {isHintLoading ? "生成中..." : "换一句提醒"}
              </button>
              <Link className="ghost-button link-button" to="/student/ai">
                打开 AI 助手
              </Link>
            </>
          }
        />

        <article className="surface-card student-growth-card">
          <span className="section-block__eyebrow">成长展示</span>
          <h2>这次闯关会把哪些成长点亮</h2>
          <div className={`growth-showcase-card__preview ${sceneVisualClass}`}>
            <strong>{growthData.currentAppearance}</strong>
            <p>{growthData.currentScene}</p>
          </div>
          <div className="student-checklist">
            <div className="student-checklist__item">
              <span className="student-checklist__dot" />
              <span>成长阶段：{growthData.stageLabel}</span>
            </div>
            <div className="student-checklist__item">
              <span className="student-checklist__dot" />
              <span>能力标签：{growthData.currentAbilityTag}</span>
            </div>
            <div className="student-checklist__item">
              <span className="student-checklist__dot" />
              <span>
                {growthData.nextLevelRemaining !== null
                  ? `再得 ${growthData.nextLevelRemaining} 分就能继续升级`
                  : "当前阶段已经全部点亮"}
              </span>
            </div>
          </div>
        </article>
      </section>

      <section className="student-card-grid student-card-grid--three">
        {state.progress.levels.map((level) => {
          const guide = levelGuides[level.id];
          const hasResult = Boolean(state.progress.levelResults[level.id]);
          const resultRoute = `/student/theme/road-safety/level/${level.id}/result`;
          const challengeRoute = `/student/theme/road-safety/level/${level.id}`;

          return (
            <article key={level.id} className="surface-card student-level-entry-card">
              <div className="student-level-entry-card__visual">
                <span>{levelLabels[level.id]}</span>
              </div>
              <div className="student-level-entry-card__content">
                <div className="student-level-entry-card__top">
                  <span className="surface-tag">{guide.label}</span>
                  <StatusBadge status={level.status} />
                </div>
                <h3 title={level.title}>{level.title}</h3>
                <p title={guide.shortGoal}>{guide.shortGoal}</p>
                <div className="student-level-entry-card__meta">
                  <span title={level.duration}>{level.duration}</span>
                  <span title={guide.cardHint}>{guide.cardHint}</span>
                </div>
                <div className="button-row">
                  <button
                    type="button"
                    className={
                      level.status === "locked"
                        ? "ghost-button"
                        : "primary-button primary-button--playful"
                    }
                    disabled={level.status === "locked"}
                    onClick={() => navigate(challengeRoute)}
                  >
                    {level.status === "completed" ? "重新挑战本关" : "开始挑战"}
                  </button>
                  {hasResult ? (
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => navigate(resultRoute)}
                    >
                      查看结算页
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="student-card-grid student-card-grid--two">
        <article
          className={`surface-card student-treasure-card ${
            examUnlocked ? "student-treasure-card--open" : "student-treasure-card--locked"
          }`}
        >
          <div className="student-section-heading">
            <span className="section-block__eyebrow">主题考试</span>
            <h2>三关完成后就在这里继续</h2>
          </div>
          <p>
            {examCompleted
              ? "主题考试已经完成，现在可以回看错题、学习记录和 AI 结果卡。"
              : examUnlocked
                ? "三关全部完成后，考试入口已经点亮，可以直接开始。"
                : "请先按顺序完成三关闯关学习，考试入口才会自动解锁。"}
          </p>
          <div className="button-row">
            <button
              type="button"
              className={examUnlocked ? "primary-button primary-button--playful" : "ghost-button"}
              disabled={!examUnlocked}
              onClick={() =>
                navigate(
                  examCompleted
                    ? "/student/theme/road-safety/exam/result"
                    : "/student/theme/road-safety/exam",
                )
              }
            >
              {examCompleted ? "查看考试结果" : "进入主题考试"}
            </button>
            {examCompleted ? (
              <Link className="ghost-button link-button" to="/student/theme/road-safety/wrong-questions">
                错题回看
              </Link>
            ) : null}
          </div>
        </article>

        <article className="surface-card student-link-board">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">收尾入口</span>
            <h2>完成主题后还可以去哪儿</h2>
          </div>
          <div className="student-mini-links">
            <Link className="student-mini-link student-mini-link--link" to="/student/ai-report">
              <strong>AI 结果卡</strong>
              <span>查看亮点、成长和下一步建议</span>
            </Link>
            <Link className="student-mini-link student-mini-link--link" to="/student/records">
              <strong>学习记录</strong>
              <span>回看完整主题旅程和最近一次学习位置</span>
            </Link>
            <Link className="student-mini-link student-mini-link--link" to="/student/growth">
              <strong>成长档案</strong>
              <span>查看人物外观、场景和成长阶段变化</span>
            </Link>
          </div>
        </article>
      </section>

      {showExamUnlock ? (
        <section className="overlay-modal-backdrop">
          <article className="surface-card student-treasure-modal">
            <span className="section-block__eyebrow">主题考试已解锁</span>
            <h2>三关闯关学习已经全部完成</h2>
            <p>现在可以进入主题考试，也可以稍后再从主题地图回来继续。</p>
            <div className="button-row">
              <button type="button" className="ghost-button" onClick={() => acknowledgeUnlock()}>
                稍后去完成
              </button>
              <button
                type="button"
                className="primary-button primary-button--playful"
                onClick={() => acknowledgeUnlock("/student/theme/road-safety/exam")}
              >
                立即进入
              </button>
            </div>
          </article>
        </section>
      ) : null}
    </div>
  );
}
