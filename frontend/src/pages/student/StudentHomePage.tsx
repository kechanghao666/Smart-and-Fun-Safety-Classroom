import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StudentAdventureHero } from "../../components/student/StudentAdventureHero";
import { StudentMascotBubble } from "../../components/student/StudentMascotBubble";
import { StatusBadge } from "../../components/StatusBadge";
import { themeCards } from "../../data/mockData";
import {
  applyStudentClassMembership,
  fetchStudentClassMembership,
  fetchStudentGrowth,
} from "../../services/student";
import { useAppState } from "../../state/AppState";
import type {
  LevelId,
  StudentClassMembershipResponse,
  StudentGrowthResponse,
} from "../../types";
import { buildGrowthSnapshot } from "../../utils/studentGrowth";
import { useApiResource } from "../../utils/useApiResource";
import { getStudentRouteLabel } from "../../utils/studentRouteLabels";
import { useStudentAiScene } from "../../utils/useStudentAiScene";
import { buildStageGuide } from "../../utils/studentOnboarding";

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
  const completedLevels = state.progress.levels.filter(
    (level) => level.status === "completed",
  ).length;
  const nextLevel = state.progress.levels.find(
    (level) => level.status === "available",
  );
  const [unavailableThemeNotice, setUnavailableThemeNotice] = useState("");
  const [classCodeInput, setClassCodeInput] = useState("");
  const [classMembership, setClassMembership] =
    useState<StudentClassMembershipResponse | null>(null);
  const [classMembershipError, setClassMembershipError] = useState("");
  const [isClassMembershipLoading, setIsClassMembershipLoading] = useState(apiEnabled);
  const [isApplyingClass, setIsApplyingClass] = useState(false);
  const examStatusLabel =
    state.progress.exam.status === "completed"
      ? "已完成"
      : state.progress.exam.status === "available"
        ? "已解锁"
        : "未解锁";
  const stageGuide = buildStageGuide(profile?.stage);
  const lastVisitedLabel = getStudentRouteLabel(
    state.progress.lastVisitedRoute,
    state.progress.levels,
  );
  const continueRoute = nextLevel
    ? `/student/theme/road-safety/level/${nextLevel.id}`
    : state.progress.exam.status === "available"
      ? "/student/theme/road-safety/exam"
      : state.progress.exam.status === "completed"
        ? "/student/theme/road-safety/exam/result"
        : state.progress.lastVisitedRoute;
  const currentClassCode =
    classMembership?.currentClass?.classCode?.trim() ||
    classMembership?.pendingRequest?.classCode?.trim() ||
    "";
  const canApplyToClass = apiEnabled && Boolean(state.authToken);

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
    fallbackMessage: "首页成长数据暂时无法更新，先展示已经保存的成长结果。",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadClassMembership() {
      if (!apiEnabled || !state.authToken) {
        setClassMembership(null);
        setIsClassMembershipLoading(false);
        return;
      }

      setIsClassMembershipLoading(true);
      setClassMembershipError("");

      try {
        const result = await fetchStudentClassMembership(state.authToken);

        if (!cancelled) {
          setClassMembership(result);
        }
      } catch (requestError) {
        if (!cancelled) {
          setClassMembershipError(
            requestError instanceof Error
              ? requestError.message
              : "班级状态暂时无法同步。",
          );
        }
      } finally {
        if (!cancelled) {
          setIsClassMembershipLoading(false);
        }
      }
    }

    void loadClassMembership();

    return () => {
      cancelled = true;
    };
  }, [apiEnabled, state.authToken]);

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
    fallbackText: "欢迎回来，先回到你上次停留的位置，把今天的安全冒险继续走完吧。",
  });

  async function handleApplyClassMembership() {
    const normalizedCode = classCodeInput.trim().toUpperCase();

    if (!normalizedCode || !state.authToken) {
      setClassMembershipError("请输入班级号后再提交申请。");
      return;
    }

    setIsApplyingClass(true);
    setClassMembershipError("");

    try {
      const result = await applyStudentClassMembership(state.authToken, normalizedCode);
      setClassMembership(result);
      setClassCodeInput("");
    } catch (requestError) {
      setClassMembershipError(
        requestError instanceof Error
          ? requestError.message
          : "入班申请提交失败，请稍后重试。",
      );
    } finally {
      setIsApplyingClass(false);
    }
  }

  return (
    <div className="page-stack student-page student-page--home">
      <StudentAdventureHero
        eyebrow="今日冒险"
        title={`${profile?.nickname ?? "安全小队员"}，准备继续出发`}
        description="首页只保留今天最重要的事。先看主任务，再按大按钮继续闯关，不会迷路。"
        bubbleTitle="小助手提醒"
        bubbleText={isGreetingLoading ? "我正在整理今天的任务..." : greetingMessage}
        mascotLabel={profile?.avatarLabel.slice(0, 1) ?? "安"}
        mascotHint={greetingNotice || stageGuide.starterRoute}
        accent={avatarAccent}
        variant="home"
        stats={[
          {
            label: "今天先做",
            value:
              nextLevel?.title ??
              (state.progress.exam.status === "available"
                ? "主题考试"
                : "AI 结果卡"),
            accent: "sky",
          },
          { label: "成长阶段", value: growthData.stageLabel, accent: "mint" },
          { label: "考试状态", value: examStatusLabel, accent: "orange" },
        ]}
        actions={
          <>
            <button
              type="button"
              className="primary-button primary-button--playful"
              onClick={() => navigate(continueRoute)}
            >
              继续今天的冒险
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => navigate("/student/theme/road-safety")}
            >
              打开主题地图
            </button>
          </>
        }
        aside={
          <div className="student-hero-sidekick">
            <span className="student-hero-sidekick__label">角色卡</span>
            <strong>{growthData.currentAppearance}</strong>
            <p>{growthData.currentScene}</p>
          </div>
        }
      />

      <section className="student-card-grid student-card-grid--three">
        <article className="surface-card student-adventure-card student-adventure-card--sky">
          <span className="student-adventure-card__icon">01</span>
          <h2>先做什么</h2>
          <strong>
            {nextLevel?.title ??
              (state.progress.exam.status === "available" ? "主题考试" : "AI 结果卡")}
          </strong>
          <p>点一下大按钮，就会回到最该继续的地方。</p>
        </article>

        <article className="surface-card student-adventure-card student-adventure-card--mint">
          <span className="student-adventure-card__icon">02</span>
          <h2>闯关进度</h2>
          <strong>{completedLevels} / 3 关</strong>
          <p>三关完成后，考试宝箱就会自动亮起来。</p>
        </article>

        <article className="surface-card student-adventure-card student-adventure-card--orange">
          <span className="student-adventure-card__icon">03</span>
          <h2>升级还差</h2>
          <strong>
            {growthData.nextLevelRemaining !== null
              ? `${growthData.nextLevelRemaining} 分`
              : "已经点亮"}
          </strong>
          <p>{growthData.nextLevelLabel ?? "当前阶段已经全部点亮了"}</p>
        </article>
      </section>

      <section className="student-card-grid student-card-grid--two">
        <article className="surface-card student-home-stage-board">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">今日路线</span>
            <h2>今天的学习地图很简单</h2>
          </div>

          <div className="student-map-strip">
            <div className="student-map-step student-map-step--active">
              <strong>三关学习</strong>
              <span>{completedLevels} / 3</span>
            </div>
            <div
              className={
                state.progress.exam.status === "available" ||
                state.progress.exam.status === "completed"
                  ? "student-map-step student-map-step--active"
                  : "student-map-step"
              }
            >
              <strong>主题考试</strong>
              <span>{examStatusLabel}</span>
            </div>
            <div
              className={
                state.progress.exam.status === "completed"
                  ? "student-map-step student-map-step--active"
                  : "student-map-step"
              }
            >
              <strong>结果总结</strong>
              <span>收尾奖励</span>
            </div>
          </div>

          <div className="student-mini-card-grid">
            <article className="student-mini-card student-mini-card--sky">
              <span>最近位置</span>
              <strong>{lastVisitedLabel}</strong>
            </article>
            <article className="student-mini-card student-mini-card--mint">
              <span>连续学习</span>
              <strong>{growthData.streakDays} 天</strong>
            </article>
            <article className="student-mini-card student-mini-card--orange">
              <span>当前能力</span>
              <strong>{growthData.currentAbilityTag}</strong>
            </article>
          </div>
        </article>

        <StudentMascotBubble
          eyebrow="AI 欢迎建议"
          title="今天先按这个顺序来"
          message={
            isGreetingLoading ? "AI 正在整理今天的学习建议..." : greetingMessage
          }
          accent={avatarAccent}
          notice={greetingNotice}
          actions={
            <>
              <button
                type="button"
                className="ghost-button"
                onClick={() => void refreshGreeting()}
                disabled={isGreetingLoading}
              >
                {isGreetingLoading ? "生成中..." : "换一句提醒"}
              </button>
              <Link className="ghost-button link-button" to="/student/ai">
                打开 AI 助手
              </Link>
            </>
          }
        />
      </section>

      <section className="student-card-grid student-card-grid--two">
        <article className="surface-card student-reward-board">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">班级身份</span>
            <h2>确认学号，并加入班级</h2>
          </div>

          <div className="student-mini-card-grid">
            <article className="student-mini-card student-mini-card--sky">
              <span>我的学号</span>
              <strong>
                {classMembership?.studentNo ??
                  state.studentProfile?.studentNo ??
                  "加载中"}
              </strong>
            </article>
            <article className="student-mini-card student-mini-card--mint">
              <span>当前班级</span>
              <strong>{classMembership?.currentClass?.name ?? "暂未加入"}</strong>
            </article>
            <article className="student-mini-card student-mini-card--orange">
              <span>申请状态</span>
              <strong>
                {classMembership?.pendingRequest
                  ? "待审批"
                  : classMembership?.currentClass
                    ? "已加入"
                    : "可申请"}
              </strong>
            </article>
          </div>

          <div className="student-checklist">
            <div className="student-checklist__item">
              <span className="student-checklist__dot" />
              <span>
                老师可以通过学号
                {classMembership?.studentNo ?? state.studentProfile?.studentNo ?? "--"}
                直接邀请你入班。
              </span>
            </div>
            <div className="student-checklist__item">
              <span className="student-checklist__dot" />
              <span>
                {classMembership?.currentClass
                  ? currentClassCode
                    ? `当前班级号：${currentClassCode}`
                    : "当前班级号正在同步生成，请稍后刷新查看。"
                  : classMembership?.pendingRequest
                    ? `申请加入 ${classMembership.pendingRequest.className}，等待老师审批。`
                    : "输入班级号后，可以主动向老师提交入班申请。"}
              </span>
            </div>
          </div>

          <div className="button-row">
            <input
              className="text-input"
              value={classCodeInput}
              onChange={(event) => setClassCodeInput(event.target.value.toUpperCase())}
              placeholder="输入班级号"
              disabled={!canApplyToClass || isApplyingClass}
            />
            <button
              type="button"
              className="primary-button"
              onClick={() => void handleApplyClassMembership()}
              disabled={
                !canApplyToClass ||
                isApplyingClass ||
                classCodeInput.trim().length === 0
              }
            >
              {isApplyingClass
                ? "提交中..."
                : classMembership?.currentClass
                  ? "申请更换班级"
                  : "申请加入班级"}
            </button>
          </div>

          {isClassMembershipLoading ? (
            <p className="inline-note">正在同步班级状态...</p>
          ) : null}
          {classMembershipError ? <p className="form-error">{classMembershipError}</p> : null}
        </article>

        <article className="surface-card student-link-board">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">三关说明</span>
            <h2>现在的关卡分成这三种玩法</h2>
          </div>

          <div className="student-mini-links">
            <button
              type="button"
              className="student-mini-link"
              onClick={() => navigate("/student/theme/road-safety")}
            >
              <strong>第一关：观察识别</strong>
              <span>在路口大场景里找安全线索和危险行为</span>
            </button>
            <button
              type="button"
              className="student-mini-link"
              onClick={() => navigate("/student/theme/road-safety")}
            >
              <strong>第二关：路线判断</strong>
              <span>沿着回家地图逐站做出更安全的选择</span>
            </button>
            <button
              type="button"
              className="student-mini-link"
              onClick={() => navigate("/student/theme/road-safety")}
            >
              <strong>第三关：操作守护</strong>
              <span>完成公交、私家车、电动车三段守护任务</span>
            </button>
          </div>
        </article>
      </section>

      <section className="student-card-grid student-card-grid--two">
        <article className="surface-card student-reward-board">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">奖励进度</span>
            <h2>把坚持变成礼物</h2>
          </div>

          <div className="student-checklist">
            <div className="student-checklist__item">
              <span className="student-checklist__dot" />
              <span>连续学习：{growthData.streakDays} 天</span>
            </div>
            <div className="student-checklist__item">
              <span className="student-checklist__dot" />
              <span>
                已领礼包：
                {state.progress.rewardProgress.claimedStreakDays.join(" / ") || "暂无"}
              </span>
            </div>
            <div className="student-checklist__item">
              <span className="student-checklist__dot" />
              <span>
                错题重学：
                {state.progress.rewardProgress.reviewedWrongQuestionIds.length} /
                {state.progress.exam.wrongQuestionIds.length}
              </span>
            </div>
          </div>

          <div className="button-row">
            {apiEnabled ? (
              <span className="surface-tag">奖励会自动发放</span>
            ) : fallbackGrowth.availableStreakRewards.length > 0 ? (
              fallbackGrowth.availableStreakRewards.map((day) => (
                <button
                  key={day}
                  type="button"
                  className="primary-button"
                  onClick={() => claimStreakReward(day)}
                >
                  领取 {day} 天礼包
                </button>
              ))
            ) : (
              <button
                type="button"
                className="ghost-button"
                onClick={() => navigate("/student/growth")}
              >
                去看成长档案
              </button>
            )}
            <button
              type="button"
              className="ghost-button"
              onClick={() => navigate("/student/theme/road-safety/wrong-questions")}
            >
              错题回看
            </button>
          </div>
        </article>

        <article className="surface-card student-link-board">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">轻量入口</span>
            <h2>想先逛哪里？</h2>
          </div>

          <div className="student-mini-links">
            <button
              type="button"
              className="student-mini-link"
              onClick={() => navigate("/student/growth")}
            >
              <strong>成长档案</strong>
              <span>看外观、场景和升级进度</span>
            </button>
            <button
              type="button"
              className="student-mini-link"
              onClick={() => navigate("/student/records")}
            >
              <strong>学习记录</strong>
              <span>回到上次学习的位置</span>
            </button>
            <button
              type="button"
              className="student-mini-link"
              onClick={() => navigate(state.progress.lastVisitedRoute)}
            >
              <strong>快捷续学</strong>
              <span>立刻继续当前挑战</span>
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

      <section className="student-theme-choice">
        <div className="student-section-heading">
          <span className="section-block__eyebrow">主题入口</span>
          <h2>选一张大地图开始冒险</h2>
        </div>

        <div className="student-card-grid student-card-grid--three">
          {themeCards.map((theme) => {
            const isCurrentTheme = theme.id === "road-safety";

            return (
              <article
                key={theme.id}
                className={`surface-card student-theme-card student-theme-card--${theme.accent}`}
              >
                <div className="student-theme-card__top">
                  <span className="surface-tag">{theme.progressLabel}</span>
                  {isCurrentTheme ? (
                    <StatusBadge
                      status={
                        state.progress.exam.status === "completed"
                          ? "completed"
                          : "available"
                      }
                    />
                  ) : null}
                </div>
                <div className="student-theme-card__art">
                  <span className="student-theme-card__badge">
                    {theme.title.slice(0, 2)}
                  </span>
                </div>
                <h3>{theme.title}</h3>
                <p>
                  {theme.id === "road-safety"
                    ? "先闯三关，再去打开考试宝箱。"
                    : "这张地图还在准备中。"}
                </p>
                <button
                  type="button"
                  className={
                    theme.isOpen
                      ? "primary-button primary-button--playful"
                      : "ghost-button"
                  }
                  onClick={() =>
                    theme.isOpen
                      ? navigate("/student/theme/road-safety")
                      : setUnavailableThemeNotice(
                          "这个主题还在准备中，先试试道路安全地图吧。",
                        )
                  }
                >
                  {theme.cta}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
