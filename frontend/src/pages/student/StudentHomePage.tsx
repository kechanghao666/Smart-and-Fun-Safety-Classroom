import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StatusBadge } from "../../components/StatusBadge";
import { themeCards } from "../../data/mockData";
import { fetchStudentGrowth } from "../../services/student";
import { useAppState } from "../../state/AppState";
import type { LevelId, StudentGrowthResponse } from "../../types";
import { buildGrowthSnapshot } from "../../utils/studentGrowth";
import { useApiResource } from "../../utils/useApiResource";
import { useStudentAiScene } from "../../utils/useStudentAiScene";
import { buildStageGuide } from "../../utils/studentOnboarding";
import { STREAK_REWARD_POINTS, WRONG_QUESTION_REVIEW_REWARD } from "../../utils/studentRewards";

const avatarAccentMap = {
  "sunny-guard": "sky",
  "smart-scout": "mint",
  "brave-captain": "orange",
} as const;

export function StudentHomePage() {
  const navigate = useNavigate();
  const { claimStreakReward, state } = useAppState();
  const profile = state.studentProfile;
  const fallbackGrowth = buildGrowthSnapshot(state);
  const apiEnabled = state.authSource === "api" && Boolean(state.authToken);
  const avatarAccent = profile
    ? avatarAccentMap[profile.avatarId as keyof typeof avatarAccentMap] ?? "sky"
    : "sky";
  const completedLevels = state.progress.levels.filter((level) => level.status === "completed").length;
  const nextLevel = state.progress.levels.find((level) => level.status === "available");
  const [unavailableThemeNotice, setUnavailableThemeNotice] = useState("");
  const examStatusLabel =
    state.progress.exam.status === "completed"
      ? "已完成"
      : state.progress.exam.status === "available"
        ? "已解锁"
        : "未解锁";
  const stageGuide = buildStageGuide(profile?.stage);
  const displayThemeCards = useMemo(
    () =>
      themeCards.map((theme) =>
        theme.id === "road-safety"
          ? {
              ...theme,
              title: state.progress.themeTitle,
              progressLabel:
                state.progress.exam.status === "completed"
                  ? "学习闭环已完成"
                  : `已完成 ${completedLevels} / 3 关`,
              cta:
                state.progress.exam.status === "completed"
                  ? "查看主题结果"
                  : "进入主题",
            }
          : theme,
      ),
    [completedLevels, state.progress.exam.status, state.progress.themeTitle],
  );
  const continueRoute = nextLevel
    ? `/student/theme/road-safety/level/${nextLevel.id}`
    : state.progress.exam.status === "available"
      ? "/student/theme/road-safety/exam"
      : state.progress.exam.status === "completed"
        ? "/student/theme/road-safety/exam/result"
        : state.progress.lastVisitedRoute;

  const fallbackGrowthData: StudentGrowthResponse = {
    characterName: profile?.nickname ?? "安全学员",
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

  const { data: growthData } = useApiResource({
    enabled: apiEnabled,
    fallbackData: fallbackGrowthData,
    fetcher: () => fetchStudentGrowth(state.authToken!),
    dependencies: [state.authToken, state.progress.points, state.progress.rewardProgress.reviewedWrongQuestionIds.join("|")],
    fallbackMessage: "首页成长数据暂时无法更新，当前展示已保存的成长结果。",
  });

  const homeAiPrompt = useMemo(
    () =>
      `请用儿童友好的语气欢迎我继续学习道路安全。当前已完成 ${completedLevels} / 3 关，考试状态是 ${examStatusLabel}，连续学习 ${growthData.streakDays} 天，请告诉我今天最适合先做什么。`,
    [completedLevels, examStatusLabel, growthData.streakDays],
  );

  const {
    isLoading: isGreetingLoading,
    message: greetingMessage,
    notice: greetingNotice,
    refresh: refreshGreeting,
  } = useStudentAiScene({
    prompt: homeAiPrompt,
    scene: "welcome",
    levelId: nextLevel?.id as LevelId | undefined,
    fallbackText:
      "欢迎回来，先回到你上次停留的位置，继续把道路安全主题课学完整。完成错题重学和连续学习，也会继续点亮成长档案。",
  });

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--student">
        <div>
          <span className="hero-banner__eyebrow">欢迎区</span>
          <div className="student-summary">
            {profile ? (
              <span className={`avatar-badge avatar-badge--${avatarAccent}`}>
                {profile.avatarLabel.slice(0, 1)}
              </span>
            ) : null}
            <div>
              <h1>{profile?.nickname ?? "安全小卫士"}，欢迎回来</h1>
              <p className="student-summary__meta">
                {profile ? `${profile.avatarLabel} · ${profile.stage}` : "先完善学生资料，再开始正式学习"}
              </p>
            </div>
          </div>
          <p>
            你已经完成 {completedLevels} / 3 关，当前成长阶段为 <strong>{growthData.stageLabel}</strong>，主题考试状态为
            <strong> {examStatusLabel}</strong>。
          </p>
        </div>

        <div className="hero-banner__actions">
          <button type="button" className="primary-button" onClick={() => navigate(continueRoute)}>
            继续学习
          </button>
          <button type="button" className="ghost-button" onClick={() => navigate("/student/theme/road-safety")}>
            查看主题页
          </button>
          <button type="button" className="ghost-button" onClick={() => navigate("/student/records")}>
            查看学习记录
          </button>
        </div>
      </section>

      <section className="card-grid card-grid--three">
        <article className="surface-card stat-card">
          <span>今日入口</span>
          <strong>{nextLevel?.title ?? (state.progress.exam.status === "available" ? "主题考试" : "AI 结果卡")}</strong>
          <p>系统会根据当前关卡进度、考试状态和最近学习位置，推荐你最适合先做的动作。</p>
        </article>

        <article className="surface-card stat-card">
          <span>学习概览</span>
          <strong>{completedLevels} / 3</strong>
          <p>完成三关后将自动解锁主题考试，考试完成后再进入结果页和错题回看页。</p>
        </article>

        <article className="surface-card stat-card">
          <span>成长快照</span>
          <strong>{growthData.stageLabel}</strong>
          <p>
            当前成长值 {growthData.totalGrowthPoints}，
            {growthData.nextLevelRemaining !== null
              ? `再获得 ${growthData.nextLevelRemaining} 分可继续点亮下一阶段内容。`
              : "当前阶段内容已经全部点亮。"}
          </p>
        </article>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card ai-insight-card">
          <span className="section-block__eyebrow">AI 欢迎建议</span>
          <div className="row-between">
            <h2>开始学习前先听一句提醒</h2>
            <span className="surface-tag">
              {isGreetingLoading ? "生成中" : apiEnabled ? "AI 实时提示" : "AI 学习提示"}
            </span>
          </div>
          <p className="ai-insight-card__message">
            {isGreetingLoading ? "AI 正在整理今天的学习建议..." : greetingMessage}
          </p>
          {greetingNotice ? <p className="inline-note">{greetingNotice}</p> : null}
          <div className="button-row">
            <button type="button" className="ghost-button" onClick={() => void refreshGreeting()} disabled={isGreetingLoading}>
              {isGreetingLoading ? "生成中..." : "刷新建议"}
            </button>
            <Link className="ghost-button link-button" to="/student/ai">
              打开 AI 问答页
            </Link>
          </div>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">学习概览区</span>
          <h2>今天先做什么？</h2>
          <ul className="plain-list">
            <li>优先动作：{nextLevel ? `继续 ${nextLevel.title}` : state.progress.exam.status === "available" ? "进入主题考试" : "查看考试结果与 AI 结果卡"}</li>
            <li>考试状态：{examStatusLabel}</li>
            <li>最近学习位置：{state.progress.lastVisitedRoute}</li>
            <li>学段建议：{stageGuide.starterRoute}</li>
          </ul>
          <div className="button-row">
            <button type="button" className="primary-button" onClick={() => navigate(continueRoute)}>
              前往当前重点
            </button>
            <button type="button" className="ghost-button" onClick={() => navigate("/student/growth")}>
              查看成长档案
            </button>
          </div>
        </article>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card reward-overview-card">
          <span className="section-block__eyebrow">连续学习奖励</span>
          <h2>把坚持学习转成成长礼盒</h2>
          <ul className="plain-list">
            <li>当前已连续学习：{growthData.streakDays} 天</li>
            <li>已登记奖励：{state.progress.rewardProgress.claimedStreakDays.join(" / ") || "暂无"}</li>
            <li>3 天礼盒：+{STREAK_REWARD_POINTS[3]} 成长值</li>
            <li>7 天礼盒：+{STREAK_REWARD_POINTS[7]} 成长值</li>
          </ul>
          <div className="button-row">
            {apiEnabled ? (
              <span className="surface-tag">连续学习奖励会自动发放</span>
            ) : fallbackGrowth.availableStreakRewards.length > 0 ? (
              fallbackGrowth.availableStreakRewards.map((day) => (
                <button key={day} type="button" className="primary-button" onClick={() => claimStreakReward(day)}>
                  领取 {day} 天礼盒
                </button>
              ))
            ) : (
              <button type="button" className="ghost-button" onClick={() => navigate("/student/growth")}>
                查看成长目标
              </button>
            )}
          </div>
        </article>

        <article className="surface-card reward-overview-card">
          <span className="section-block__eyebrow">错题重学奖励</span>
          <h2>回看错题也会继续积累成长值</h2>
          <ul className="plain-list">
            <li>当前错题数量：{state.progress.exam.wrongQuestionIds.length} 题</li>
            <li>已完成错题重学：{state.progress.rewardProgress.reviewedWrongQuestionIds.length} 题</li>
            <li>每完成 1 道错题重学：+{WRONG_QUESTION_REVIEW_REWARD} 成长值</li>
          </ul>
          <div className="button-row">
            <button
              type="button"
              className="ghost-button"
              onClick={() => navigate("/student/theme/road-safety/wrong-questions")}
              disabled={state.progress.exam.status !== "completed"}
            >
              前往错题回看
            </button>
          </div>
        </article>
      </section>

      {unavailableThemeNotice ? (
        <article className="feedback-box">
          <strong>主题提示</strong>
          <p>{unavailableThemeNotice}</p>
        </article>
      ) : null}

      <section className="section-block">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">主题学习区</span>
            <h2>选择今天要进入的主题</h2>
          </div>
        </div>

        <div className="card-grid card-grid--three">
          {displayThemeCards.map((theme) => {
            const isCurrentTheme = theme.id === "road-safety";

            return (
              <article key={theme.id} className={`surface-card theme-card theme-card--${theme.accent}`}>
                <div className="theme-card__top">
                  <span className="surface-tag">{theme.progressLabel}</span>
                  {isCurrentTheme ? (
                    <StatusBadge status={state.progress.exam.status === "completed" ? "completed" : "available"} />
                  ) : null}
                </div>
                <h3>{theme.title}</h3>
                <p>{theme.description}</p>
                <button
                  type="button"
                  className={theme.isOpen ? "primary-button" : "ghost-button"}
                  onClick={() =>
                    theme.isOpen
                      ? navigate("/student/theme/road-safety")
                      : setUnavailableThemeNotice("该主题正在开发中，敬请期待。")
                  }
                >
                  {theme.cta}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card">
          <span className="section-block__eyebrow">快捷续学</span>
          <h3>回到你上次停留的学习节点</h3>
          <ul className="plain-list">
            <li>最近位置：{state.progress.lastVisitedRoute}</li>
            <li>关卡状态：{completedLevels} / 3 已完成</li>
            <li>考试状态：{examStatusLabel}</li>
          </ul>
          <button type="button" className="ghost-button" onClick={() => navigate(state.progress.lastVisitedRoute)}>
            从最近位置继续
          </button>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">成长提示</span>
          <h3>这轮学习带来的变化</h3>
          <ul className="plain-list">
            <li>当前外观：{growthData.currentAppearance}</li>
            <li>专属场景：{growthData.currentScene}</li>
            <li>能力标签：{growthData.currentAbilityTag}</li>
            <li>下一步重点：{growthData.nextLevelLabel ?? "继续保持当前节奏"}</li>
          </ul>
        </article>
      </section>
    </div>
  );
}

