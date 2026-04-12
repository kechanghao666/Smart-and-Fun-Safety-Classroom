import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StudentAdventureHero } from "../../components/student/StudentAdventureHero";
import { StudentMascotBubble } from "../../components/student/StudentMascotBubble";
import { fetchStudentGrowth, saveStudentGrowthPreferences } from "../../services/student";
import { useAppState } from "../../state/AppState";
import type { StudentGrowthResponse } from "../../types";
import {
  buildGrowthSnapshot,
  getGrowthAppearanceAccent,
  getGrowthAppearanceBadgeLabel,
  getGrowthAppearanceShowcaseInfo,
  getGrowthSceneVisualClass,
  getGrowthSceneShowcaseInfo,
} from "../../utils/studentGrowth";
import { getStudentRouteLabel } from "../../utils/studentRouteLabels";

const avatarAccentMap = {
  "sunny-guard": "sky",
  "smart-scout": "mint",
  "brave-captain": "orange",
} as const;

export function StudentGrowthPage() {
  const navigate = useNavigate();
  const { saveGrowthPreferences, state } = useAppState();
  const fallbackGrowth = buildGrowthSnapshot(state);
  const profile = state.studentProfile;
  const apiEnabled = state.authSource === "api" && Boolean(state.authToken);
  const avatarAccent = profile
    ? avatarAccentMap[profile.avatarId as keyof typeof avatarAccentMap] ?? "sky"
    : "sky";

  const fallbackGrowthData: StudentGrowthResponse = useMemo(
    () => ({
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
      history: fallbackGrowth.journal.map((item) => ({
        id: item.id,
        sourceType: "level_completed",
        title: item.title,
        description: item.detail,
        points: 0,
        createdAt: getStudentRouteLabel(item.href, state.progress.levels),
      })),
    }),
    [fallbackGrowth, profile?.nickname, state.progress.levels],
  );

  const [growthData, setGrowthData] = useState<StudentGrowthResponse>(fallbackGrowthData);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(apiEnabled);
  const [isSavingSelection, setIsSavingSelection] = useState(false);
  const [selectionNotice, setSelectionNotice] = useState("");

  useEffect(() => {
    setGrowthData(fallbackGrowthData);
  }, [fallbackGrowthData]);

  useEffect(() => {
    let cancelled = false;

    if (!apiEnabled || !state.authToken) {
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    setError("");

    void fetchStudentGrowth(state.authToken)
      .then((result) => {
        if (!cancelled) {
          setGrowthData(result);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "成长档案暂时无法更新，当前展示已保存的成长信息。",
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
  }, [
    apiEnabled,
    state.authToken,
    state.progress.points,
    state.progress.rewardProgress.reviewedWrongQuestionIds.join("|"),
  ]);

  async function handleSelection(type: "appearance" | "scene", value: string) {
    if (isSavingSelection) {
      return;
    }

    setError("");
    setSelectionNotice(
      type === "appearance"
        ? `展示台已换成 ${value}`
        : `展示台舞台已切换为 ${value}`,
    );
    const previousGrowth = growthData;

    setGrowthData((current) => ({
      ...current,
      currentAppearance:
        type === "appearance" ? value : current.currentAppearance,
      currentScene: type === "scene" ? value : current.currentScene,
    }));
    saveGrowthPreferences({ [type]: value });

    if (!apiEnabled || !state.authToken) {
      return;
    }

    setIsSavingSelection(true);

    try {
      const nextGrowth = await saveStudentGrowthPreferences(state.authToken, {
        [type]: value,
      });
      setGrowthData(nextGrowth);
      setSelectionNotice(
        type === "appearance"
          ? `展示台已换成 ${nextGrowth.currentAppearance}`
          : `展示台舞台已切换为 ${nextGrowth.currentScene}`,
      );
      saveGrowthPreferences({
        appearance: nextGrowth.currentAppearance,
        scene: nextGrowth.currentScene,
      });
    } catch (requestError) {
      setGrowthData(previousGrowth);
      setSelectionNotice("");
      setError(
        requestError instanceof Error
          ? requestError.message
          : "成长展示设置保存失败，请稍后重试。",
      );
    } finally {
      setIsSavingSelection(false);
    }
  }

  const sceneVisualClass = getGrowthSceneVisualClass(growthData.currentScene);
  const appearanceAccent = getGrowthAppearanceAccent(growthData.currentAppearance);
  const appearanceBadgeLabel = getGrowthAppearanceBadgeLabel(
    growthData.currentAppearance,
  );
  const appearanceShowcase = getGrowthAppearanceShowcaseInfo(
    growthData.currentAppearance,
  );
  const sceneShowcase = getGrowthSceneShowcaseInfo(growthData.currentScene);
  const appearanceOptions = Array.from(
    new Set([growthData.currentAppearance, ...growthData.unlockedAppearances]),
  );
  const sceneOptions = Array.from(
    new Set([growthData.currentScene, ...growthData.unlockedScenes]),
  );
  const completedLevels = state.progress.levels.filter(
    (level) => level.status === "completed",
  ).length;
  const claimedStreakLabel =
    state.progress.rewardProgress.claimedStreakDays.length > 0
      ? state.progress.rewardProgress.claimedStreakDays
          .map((day) => `${day} 天`)
          .join(" / ")
      : "还没领取连续学习礼包";
  const nextGoalMessage =
    growthData.nextLevelLabel && growthData.nextLevelRemaining !== null
      ? `再拿 ${growthData.nextLevelRemaining} 分，就能点亮 ${growthData.nextLevelLabel}。`
      : "这一阶段已经全部点亮，继续保持学习节奏吧。";
  const savingNotice = isSavingSelection
    ? "正在保存你的展示选择..."
    : "点一点已解锁外观或场景，就能马上换上新的展示形态。";

  return (
    <div className="page-stack student-page student-page--growth">
      <StudentAdventureHero
        eyebrow="成长小舞台"
        title={`${profile?.nickname ?? "安全学员"}，看看你点亮了什么`}
        description="这里不再是密密麻麻的说明，而是你的冒险角色展台。点一点外观和场景，就能马上换上新的展示形态。"
        bubbleTitle="升级目标"
        bubbleText={nextGoalMessage}
        mascotLabel={profile?.avatarLabel.slice(0, 1) ?? "成"}
        mascotHint={error || savingNotice}
        accent={avatarAccent}
        variant="result"
        stats={[
          { label: "成长值", value: `${growthData.totalGrowthPoints}`, accent: "orange" },
          { label: "连续学习", value: `${growthData.streakDays} 天`, accent: "mint" },
          {
            label: "下一站",
            value: growthData.nextLevelLabel ?? "已全部点亮",
            accent: "sky",
          },
        ]}
        actions={
          <>
            <button
              type="button"
              className="primary-button primary-button--playful"
              onClick={() => navigate("/student/theme/road-safety")}
            >
              继续冒险
            </button>
            <Link className="ghost-button link-button" to="/student/records">
              查看学习记录
            </Link>
          </>
        }
        aside={
          <div className={`student-growth-stage ${sceneVisualClass}`}>
            <span className="student-growth-stage__eyebrow">当前展示形态</span>
            <strong>{growthData.currentAppearance}</strong>
            <p>{growthData.currentScene}</p>
            <span>{growthData.currentAbilityTag}</span>
          </div>
        }
      />

      <section className="student-card-grid student-card-grid--two">
        <article className="surface-card student-growth-board">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">角色展示台</span>
            <h2>这一轮冒险把你变成了什么样子？</h2>
          </div>

          <div className="student-growth-board__layout">
            <div
              className={`student-growth-board__preview student-growth-board__preview--showcase ${sceneVisualClass}`}
            >
              <div className="student-growth-board__headline">
                <div className="student-growth-board__badge">{growthData.stageLabel}</div>
                <div className="student-growth-board__chips">
                  <span>{appearanceShowcase.spotlight}</span>
                  <span>{sceneShowcase.spotlight}</span>
                  <span>{growthData.currentAbilityTag}</span>
                </div>
              </div>

              <div className="student-growth-showcase">
                <div className="student-growth-showcase__spark student-growth-showcase__spark--one" />
                <div className="student-growth-showcase__spark student-growth-showcase__spark--two" />
                <div
                  className={`student-growth-showcase__mascot student-growth-showcase__mascot--${appearanceAccent}`}
                >
                  <div className="student-growth-showcase__head">
                    <span className="student-growth-showcase__eye student-growth-showcase__eye--left" />
                    <span className="student-growth-showcase__eye student-growth-showcase__eye--right" />
                    <span className="student-growth-showcase__smile" />
                  </div>
                  <div className="student-growth-showcase__body">
                    <span className="student-growth-showcase__badge">
                      {appearanceBadgeLabel}
                    </span>
                  </div>
                </div>
                <div className="student-growth-showcase__pedestal" />
              </div>

              <div className="student-growth-board__meta">
                <strong title={appearanceShowcase.title}>{appearanceShowcase.title}</strong>
                <p title={sceneShowcase.title}>{sceneShowcase.title}</p>
                <small className="student-growth-board__caption">
                  {appearanceShowcase.detail}
                </small>
                <small className="student-growth-board__caption">
                  {sceneShowcase.detail}
                </small>
                {selectionNotice ? (
                  <span className="student-growth-board__selection-notice">
                    {selectionNotice}
                  </span>
                ) : null}
              </div>

              <div className="student-growth-board__footer">
                <span>当前外观：{growthData.currentAppearance}</span>
                <span>当前舞台：{growthData.currentScene}</span>
                <span>已点亮 {growthData.unlockedAppearances.length} 套外观</span>
                <span>已解锁 {growthData.unlockedScenes.length} 个场景</span>
              </div>
            </div>

            <div className="student-growth-board__facts">
              <div className="student-mini-card student-mini-card--mint">
                <span>当前能力</span>
                <strong>{growthData.currentAbilityTag}</strong>
              </div>
              <div className="student-mini-card student-mini-card--sky">
                <span>通关进度</span>
                <strong>
                  {completedLevels} / {state.progress.levels.length} 关
                </strong>
              </div>
              <div className="student-mini-card student-mini-card--orange">
                <span>连续礼包</span>
                <strong>{claimedStreakLabel}</strong>
              </div>
            </div>
          </div>
        </article>

        <StudentMascotBubble
          eyebrow="成长提醒"
          title="先挑喜欢的外观，再继续去闯关"
          message={growthData.growthSummary}
          accent={avatarAccent}
          notice={isLoading ? "正在同步最新成长状态..." : nextGoalMessage}
          actions={
            <>
              <button
                type="button"
                className="ghost-button"
                onClick={() => navigate("/student/theme/road-safety/wrong-questions")}
                disabled={state.progress.exam.status !== "completed"}
              >
                去错题重学
              </button>
              <Link className="ghost-button link-button" to="/student/ai-report">
                查看结果卡
              </Link>
            </>
          }
          visual={
            <div className="student-growth-reminder-stage">
              <div className="student-growth-reminder-stage__mascot">
                <span className="student-growth-reminder-stage__halo" />
                <span className="student-growth-reminder-stage__head" />
                <span className="student-growth-reminder-stage__body">
                  {growthData.currentAbilityTag.slice(0, 1)}
                </span>
              </div>
              <div className="student-growth-reminder-stage__info">
                <span className="student-growth-reminder-stage__badge">当前展示</span>
                <strong>{growthData.currentAppearance}</strong>
                <p>{growthData.currentScene}</p>
                <div className="student-growth-reminder-stage__chips">
                  <span>{growthData.currentAbilityTag}</span>
                  <span>
                    {growthData.nextLevelRemaining !== null
                      ? `再拿 ${growthData.nextLevelRemaining} 分`
                      : "已点亮当前阶段"}
                  </span>
                </div>
              </div>
            </div>
          }
        />
      </section>

      <section className="student-card-grid student-card-grid--three">
        {growthData.dimensions.map((dimension) => (
          <article key={dimension.id} className="surface-card student-growth-dimension-card">
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
                ? `再往前一点就会点亮 ${dimension.nextUnlockLabel}`
                : "这一项已经全部点亮"}
            </span>
          </article>
        ))}
      </section>

      <section className="student-card-grid student-card-grid--two">
        <article className="surface-card student-choice-panel">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">外观衣柜</span>
            <h2>选一个你喜欢的角色外观</h2>
          </div>

          <div className="student-growth-choice-list">
            {appearanceOptions.map((option) => {
              const isSelected = option === growthData.currentAppearance;

              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={isSelected}
                  className={
                    isSelected
                      ? "student-growth-choice-card student-growth-choice-card--selected"
                      : "student-growth-choice-card"
                  }
                  disabled={isSelected || isSavingSelection}
                  onClick={() => {
                    void handleSelection("appearance", option);
                  }}
                >
                  <span>{isSelected ? "当前使用" : "点我换上"}</span>
                  <strong title={option}>{option}</strong>
                  <em>已解锁外观</em>
                </button>
              );
            })}
          </div>
        </article>

        <article className="surface-card student-choice-panel">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">场景背景</span>
            <h2>把角色放到喜欢的冒险舞台里</h2>
          </div>

          <div className="student-growth-choice-list">
            {sceneOptions.map((option) => {
              const isSelected = option === growthData.currentScene;

              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={isSelected}
                  className={
                    isSelected
                      ? "student-growth-choice-card student-growth-choice-card--selected"
                      : "student-growth-choice-card"
                  }
                  disabled={isSelected || isSavingSelection}
                  onClick={() => {
                    void handleSelection("scene", option);
                  }}
                >
                  <span>{isSelected ? "当前使用" : "点我换上"}</span>
                  <strong title={option}>{option}</strong>
                  <em>已解锁场景</em>
                </button>
              );
            })}
          </div>
        </article>
      </section>

      <section className="surface-card student-journey-board">
        <div className="student-section-heading">
          <span className="section-block__eyebrow">成长轨迹</span>
          <h2>每完成一小步，冒险记录都会亮一格</h2>
        </div>

        {growthData.history.length > 0 ? (
          <div className="student-journey-list">
            {growthData.history.map((item, index) => (
              <article key={item.id} className="student-journey-item">
                <div className="student-journey-item__marker">{index + 1}</div>
                <div className="student-journey-item__content">
                  <div className="student-journey-item__row">
                    <strong title={item.title}>{item.title}</strong>
                    <span>{item.points > 0 ? `+${item.points}` : "已记录"}</span>
                  </div>
                  <p title={item.description}>{item.description}</p>
                  <em>
                    {item.createdAt.startsWith("/student")
                      ? getStudentRouteLabel(item.createdAt, state.progress.levels)
                      : item.createdAt}
                  </em>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <article className="student-empty-panel">
            <strong>还没有新的成长脚印</strong>
            <p>继续完成关卡、考试和错题重学后，这里会自动出现新的冒险记录。</p>
          </article>
        )}
      </section>

      <section className="student-card-grid student-card-grid--two">
        <article className="surface-card student-target-panel">
          <span className="section-block__eyebrow">下一步任务</span>
          <h2>{growthData.nextLevelLabel ?? "继续保持现在的节奏"}</h2>
          <p>{nextGoalMessage}</p>
          <div className="button-row">
            <button
              type="button"
              className="primary-button primary-button--playful"
              onClick={() => navigate("/student/theme/road-safety")}
            >
              回到主题地图
            </button>
            <Link className="ghost-button link-button" to="/student/home">
              返回首页
            </Link>
          </div>
        </article>

        <article className="surface-card student-reward-board student-reward-board--compact">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">奖励背包</span>
            <h2>你已经收进包里的好东西</h2>
          </div>

          <div className="student-mini-card-grid">
            <div className="student-mini-card student-mini-card--orange">
              <span>成长值</span>
              <strong>{growthData.totalGrowthPoints}</strong>
            </div>
            <div className="student-mini-card student-mini-card--sky">
              <span>外观</span>
              <strong>{growthData.unlockedAppearances.length}</strong>
            </div>
            <div className="student-mini-card student-mini-card--mint">
              <span>场景</span>
              <strong>{growthData.unlockedScenes.length}</strong>
            </div>
          </div>

          <div className="student-checklist">
            {growthData.unlockedAbilityTags.map((item) => (
              <div key={item} className="student-checklist__item">
                <span className="student-checklist__dot" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
