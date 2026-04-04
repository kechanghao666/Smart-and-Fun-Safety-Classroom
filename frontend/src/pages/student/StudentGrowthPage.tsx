import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GrowthCharacterShowcase } from "../../components/GrowthCharacterShowcase";
import {
  fetchStudentGrowth,
  saveStudentGrowthPreferences,
} from "../../services/student";
import { useAppState } from "../../state/AppState";
import type { StudentGrowthResponse } from "../../types";
import { buildGrowthSnapshot } from "../../utils/studentGrowth";

const avatarAccentMap = {
  "sunny-guard": "sky",
  "smart-scout": "mint",
  "brave-captain": "orange",
} as const;

function buildProgressWidth(growthData: StudentGrowthResponse) {
  if (!growthData.nextLevelTarget || growthData.nextLevelRemaining === null) {
    return "100%";
  }

  const completed = growthData.nextLevelTarget - growthData.nextLevelRemaining;
  const percent = Math.round((completed / growthData.nextLevelTarget) * 100);
  return `${Math.max(0, Math.min(100, percent))}%`;
}

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
        id: item.id === "observe" ? "appearance" : item.id === "judge" ? "safety" : "scene",
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
        createdAt: item.href,
      })),
    }),
    [fallbackGrowth, profile?.nickname],
  );

  const [growthData, setGrowthData] = useState<StudentGrowthResponse>(fallbackGrowthData);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(apiEnabled);
  const [isSavingSelection, setIsSavingSelection] = useState(false);

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

    if (!apiEnabled || !state.authToken) {
      saveGrowthPreferences({ [type]: value });
      return;
    }

    setIsSavingSelection(true);

    try {
      const nextGrowth = await saveStudentGrowthPreferences(state.authToken, {
        [type]: value,
      });
      setGrowthData(nextGrowth);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "成长展示设置保存失败，请稍后重试。",
      );
    } finally {
      setIsSavingSelection(false);
    }
  }

  const appearanceOptions = Array.from(
    new Set([growthData.currentAppearance, ...growthData.unlockedAppearances]),
  );
  const sceneOptions = Array.from(
    new Set([growthData.currentScene, ...growthData.unlockedScenes]),
  );
  const completedLevels = state.progress.levels.filter(
    (level) => level.status === "completed",
  ).length;
  const progressWidth = buildProgressWidth(growthData);

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--student">
        <div>
          <span className="hero-banner__eyebrow">成长档案页</span>
          <div className="student-summary">
            {profile ? (
              <span className={`avatar-badge avatar-badge--${avatarAccent}`}>
                {profile.avatarLabel.slice(0, 1)}
              </span>
            ) : null}
            <div>
              <h1>{profile?.nickname ?? "安全学员"} 的成长档案</h1>
              <p className="student-summary__meta">
                {profile
                  ? `${profile.avatarLabel} · ${profile.stage}`
                  : "完善资料后会获得更完整的成长档案展示"}
              </p>
            </div>
          </div>
          <p>
            当前处于 <strong>{growthData.stageLabel}</strong>，{growthData.growthSummary}
          </p>
          {error ? <p className="inline-note">{error}</p> : null}
        </div>

        <article className="growth-progress-panel">
          <span className="surface-tag">成长值</span>
          <strong>{growthData.totalGrowthPoints}</strong>
          <p>
            {growthData.nextLevelLabel && growthData.nextLevelRemaining !== null
              ? `距离 ${growthData.nextLevelLabel} 还差 ${growthData.nextLevelRemaining} 分`
              : "当前阶段内容已经全部点亮"}
          </p>
          <div className="growth-track">
            <span className="growth-track__fill" style={{ width: progressWidth }} />
          </div>
        </article>
      </section>

      <section className="card-grid card-grid--three">
        <article className="surface-card growth-highlight-card">
          <span className="section-block__eyebrow">成长结果</span>
          <h2>{growthData.stageLabel}</h2>
          <ul className="plain-list">
            <li>当前外观：{growthData.currentAppearance}</li>
            <li>专属场景：{growthData.currentScene}</li>
            <li>能力标签：{growthData.currentAbilityTag}</li>
          </ul>
        </article>

        <article className="surface-card growth-highlight-card">
          <span className="section-block__eyebrow">成长概览</span>
          <h2>学习闭环带来的变化</h2>
          <ul className="plain-list">
            <li>
              累计通关：{completedLevels} / {state.progress.levels.length} 关
            </li>
            <li>考试成绩：{state.progress.exam.score ?? "尚未完成主题考试"}</li>
            <li>连续学习：{growthData.streakDays} 天</li>
            <li>下一个阶段：{growthData.nextLevelLabel ?? "当前已达到最高阶段"}</li>
          </ul>
        </article>

        <article className="surface-card growth-highlight-card">
          <span className="section-block__eyebrow">成长奖励</span>
          <h2>错题重学与连续学习</h2>
          <ul className="plain-list">
            <li>
              已回看错题：{state.progress.rewardProgress.reviewedWrongQuestionIds.length} 题
            </li>
            <li>
              已领取连续学习奖励：
              {state.progress.rewardProgress.claimedStreakDays.join(" / ") || "暂无"}
            </li>
            <li>当前积分累计：{state.progress.points}</li>
            <li>{isLoading ? "正在同步成长状态..." : "成长奖励会随学习表现自动更新。"}</li>
          </ul>
        </article>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card growth-showcase-card growth-showcase-card--hero">
          <span className="section-block__eyebrow">当前展示形态</span>
          <h2>人物外观、能力标签和场景同步展示</h2>
          <GrowthCharacterShowcase
            profile={profile}
            nickname={growthData.characterName}
            appearance={growthData.currentAppearance}
            scene={growthData.currentScene}
            abilityTag={growthData.currentAbilityTag}
            stageLabel={growthData.stageLabel}
          />
        </article>

        <article className="surface-card growth-showcase-card">
          <span className="section-block__eyebrow">成长说明</span>
          <h2>成长结果会根据当前学习进展持续刷新</h2>
          <ul className="plain-list">
            <li>已解锁外观：{growthData.unlockedAppearances.join(" / ") || "暂无"}</li>
            <li>已解锁场景：{growthData.unlockedScenes.join(" / ") || "暂无"}</li>
            <li>已解锁能力标签：{growthData.unlockedAbilityTags.join(" / ") || "暂无"}</li>
            <li>成长阶段、外观、能力和场景会随着学习推进自然点亮。</li>
          </ul>
          <div className="chip-row">
            <span className="surface-tag">{growthData.stageLabel}</span>
            <span className="surface-tag">{growthData.currentAbilityTag}</span>
            <span className="surface-tag">{growthData.currentScene}</span>
          </div>
        </article>
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">成长维度</span>
            <h2>观察力、判断力与防护力</h2>
          </div>
        </div>

        <div className="card-grid card-grid--three">
          {growthData.dimensions.map((dimension) => (
            <article key={dimension.id} className="surface-card growth-dimension-card">
              <span className="section-block__eyebrow">{dimension.label}</span>
              <strong>{dimension.points}</strong>
              <div className="growth-track">
                <span
                  className="growth-track__fill growth-track__fill--warm"
                  style={{ width: `${dimension.progressPercent}%` }}
                />
              </div>
              <p>当前解锁：{dimension.currentUnlockLabel}</p>
              <p>
                {dimension.nextUnlockLabel
                  ? `下一档：${dimension.nextUnlockLabel}`
                  : "当前维度已达到最高档。"}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">成长形态切换</span>
            <h2>已解锁的外观与场景可以自由切换</h2>
          </div>
        </div>

        <div className="card-grid card-grid--two">
          <article className="surface-card">
            <span className="section-block__eyebrow">外观选择</span>
            <div className="growth-choice-grid">
              {appearanceOptions.map((option) => {
                const isSelected = option === growthData.currentAppearance;

                return (
                  <button
                    key={option}
                    type="button"
                    className={
                      isSelected
                        ? "growth-choice-card growth-choice-card--selected"
                        : "growth-choice-card"
                    }
                    disabled={isSelected || isSavingSelection}
                    onClick={() => {
                      void handleSelection("appearance", option);
                    }}
                  >
                    <span className="growth-choice-card__status">
                      {isSelected ? "当前使用" : "点击切换"}
                    </span>
                    <GrowthCharacterShowcase
                      profile={profile}
                      nickname={growthData.characterName}
                      appearance={option}
                      scene={growthData.currentScene}
                      abilityTag={growthData.currentAbilityTag}
                      stageLabel={growthData.stageLabel}
                      compact
                    />
                    <span>已解锁外观展示</span>
                  </button>
                );
              })}
            </div>
          </article>

          <article className="surface-card">
            <span className="section-block__eyebrow">场景选择</span>
            <div className="growth-choice-grid">
              {sceneOptions.map((option) => {
                const isSelected = option === growthData.currentScene;

                return (
                  <button
                    key={option}
                    type="button"
                    className={
                      isSelected
                        ? "growth-choice-card growth-choice-card--selected"
                        : "growth-choice-card"
                    }
                    disabled={isSelected || isSavingSelection}
                    onClick={() => {
                      void handleSelection("scene", option);
                    }}
                  >
                    <span className="growth-choice-card__status">
                      {isSelected ? "当前使用" : "点击切换"}
                    </span>
                    <GrowthCharacterShowcase
                      profile={profile}
                      nickname={growthData.characterName}
                      appearance={growthData.currentAppearance}
                      scene={option}
                      abilityTag={growthData.currentAbilityTag}
                      stageLabel={growthData.stageLabel}
                      compact
                    />
                    <span>已解锁场景展示</span>
                  </button>
                );
              })}
            </div>
          </article>
        </div>
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">成长轨迹</span>
            <h2>把关卡、考试和成长变化串在一条线里</h2>
          </div>
        </div>

        <div className="timeline-list">
          {growthData.history.length > 0 ? (
            growthData.history.map((item, index) => (
              <article
                key={item.id}
                className={`timeline-item timeline-item--${index === 0 ? "current" : "done"}`}
              >
                <span className="timeline-item__dot" />
                <div className="timeline-item__content">
                  <div className="row-between">
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                      <p className="inline-note">{item.createdAt}</p>
                    </div>
                    <span className="surface-tag">+{item.points}</span>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <article className="feedback-box">
              <strong>当前还没有成长历史记录</strong>
              <p>继续完成关卡、考试和错题重学后，这里会自动累积成长轨迹。</p>
            </article>
          )}
        </div>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card admin-preview-card">
          <span className="section-block__eyebrow">成长目标</span>
          <h2>下一次学习最值得关注的事</h2>
          <article className="feedback-box">
            <strong>{growthData.nextLevelLabel ?? "继续保持当前节奏"}</strong>
            <p>
              {growthData.nextLevelRemaining !== null
                ? `再获得 ${growthData.nextLevelRemaining} 分，就能进入 ${growthData.nextLevelLabel}。`
                : "当前阶段内容已经全部点亮，接下来重点保持连续学习。"}
            </p>
          </article>
          <div className="button-row">
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate("/student/theme/road-safety")}
            >
              返回主题页
            </button>
            <Link className="ghost-button link-button" to="/student/records">
              查看学习记录
            </Link>
          </div>
        </article>

        <article className="surface-card admin-preview-card">
          <span className="section-block__eyebrow">成长奖励</span>
          <h2>本轮学习已经点亮的激励内容</h2>
          <div className="mini-stat-list">
            <div className="stat-pair">
              <strong>{growthData.totalGrowthPoints}</strong>
              <span>成长值</span>
            </div>
            <div className="stat-pair">
              <strong>{growthData.unlockedAppearances.length}</strong>
              <span>外观</span>
            </div>
            <div className="stat-pair">
              <strong>{growthData.unlockedScenes.length}</strong>
              <span>场景</span>
            </div>
          </div>
          <ul className="plain-list">
            {growthData.unlockedAbilityTags.length > 0 ? (
              growthData.unlockedAbilityTags.map((item) => <li key={item}>{item}</li>)
            ) : (
              <li>继续完成关卡、考试和错题重学后，这里会点亮新的能力标签。</li>
            )}
          </ul>
        </article>
      </section>
    </div>
  );
}
