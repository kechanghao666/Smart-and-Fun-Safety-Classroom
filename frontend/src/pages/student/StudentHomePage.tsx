import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StatusBadge } from "../../components/StatusBadge";
import { themeCards } from "../../data/mockData";
import { useAppState } from "../../state/AppState";
import type { LevelId } from "../../types";
import { useStudentAiScene } from "../../utils/useStudentAiScene";
import { buildGrowthSnapshot } from "../../utils/studentGrowth";
import { buildStageGuide } from "../../utils/studentOnboarding";

const avatarAccentMap = {
  "sunny-guard": "sky",
  "smart-scout": "mint",
  "brave-captain": "orange",
} as const;

export function StudentHomePage() {
  const navigate = useNavigate();
  const { state } = useAppState();
  const profile = state.studentProfile;
  const growth = buildGrowthSnapshot(state);
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
  const examStatusLabel =
    state.progress.exam.status === "completed"
      ? "已完成"
      : state.progress.exam.status === "available"
        ? "已解锁"
        : "未解锁";
  const stageGuide = buildStageGuide(profile?.stage);
  const continueRoute =
    nextLevel?.status === "completed" && state.progress.levelResults[nextLevel.id]
      ? `/student/theme/road-safety/level/${nextLevel.id}/result`
      : nextLevel
        ? `/student/theme/road-safety/level/${nextLevel.id}`
        : state.progress.exam.status === "available"
          ? "/student/theme/road-safety/exam"
          : state.progress.exam.status === "completed"
            ? "/student/theme/road-safety/exam/result"
            : state.progress.lastVisitedRoute;

  const homeAiPrompt = useMemo(
    () =>
      `请用儿童友好的语气欢迎我继续学习道路安全。当前已完成 ${completedLevels} / 3 关，考试状态是${examStatusLabel}，请告诉我今天最适合先做什么。`,
    [completedLevels, examStatusLabel],
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
      "欢迎回来，先回到你上次停留的位置，继续把道路安全主题课学完整。",
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
                {profile
                  ? `${profile.avatarLabel} · ${profile.stage}`
                  : "先完善学生资料，再开始正式学习"}
              </p>
            </div>
          </div>
          <p>
            你已经完成 {completedLevels} / 3 关，当前成长阶段为
            <strong> {growth.currentTier.title}</strong>，主题考试状态为
            <strong> {examStatusLabel}</strong>。
          </p>
        </div>

        <div className="hero-banner__actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate(continueRoute)}
          >
            继续学习
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={() => navigate("/student/theme/road-safety")}
          >
            查看主题页
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={() => navigate("/student/records")}
          >
            查看学习记录
          </button>
        </div>
      </section>

      <section className="card-grid card-grid--three">
        <article className="surface-card stat-card">
          <span>今日入口</span>
          <strong>{nextLevel?.title ?? (state.progress.exam.status === "available" ? "主题考试" : "AI 结果卡")}</strong>
          <p>系统会根据当前关卡进度、考试状态和最近学习位置推荐你最适合先做的动作。</p>
        </article>

        <article className="surface-card stat-card">
          <span>学习概览</span>
          <strong>{completedLevels} / 3</strong>
          <p>完成三关后将自动解锁主题考试，考试完成后再进入结果页和错题页。</p>
        </article>

        <article className="surface-card stat-card">
          <span>成长快照</span>
          <strong>{growth.currentTier.title}</strong>
          <p>
            当前积分 {state.progress.points}，再获得 {growth.pointsToNext} 分可继续点亮下一阶段内容。
          </p>
        </article>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card ai-insight-card">
          <span className="section-block__eyebrow">AI 欢迎建议</span>
          <div className="row-between">
            <h2>开始学习前先听一句提醒</h2>
            <span className="surface-tag">
              {isGreetingLoading
                ? "生成中"
                : state.authSource === "api"
                  ? "AI 实时提示"
                  : "AI 学习提示"}
            </span>
          </div>
          <p className="ai-insight-card__message">
            {isGreetingLoading ? "AI 正在整理今天的学习建议..." : greetingMessage}
          </p>
          {greetingNotice ? <p className="inline-note">{greetingNotice}</p> : null}
          <div className="button-row">
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                void refreshGreeting();
              }}
              disabled={isGreetingLoading}
            >
              {isGreetingLoading ? "生成中..." : "刷新建议"}
            </button>
            <Link className="ghost-button link-button" to="/student/ai">
              打开 AI 问答页
            </Link>
          </div>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">学习概览区</span>
          <h2>今天先做什么</h2>
          <ul className="plain-list">
            <li>优先动作：{growth.nextFocus}</li>
            <li>考试状态：{examStatusLabel}</li>
            <li>最近学习位置：{state.progress.lastVisitedRoute}</li>
            <li>学段建议：{stageGuide.starterRoute}</li>
          </ul>
          <div className="button-row">
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate(continueRoute)}
            >
              前往当前重点
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => navigate("/student/growth")}
            >
              查看成长档案
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
          {themeCards.map((theme) => {
            const isCurrentTheme = theme.id === "road-safety";

            return (
              <article
                key={theme.id}
                className={`surface-card theme-card theme-card--${theme.accent}`}
              >
                <div className="theme-card__top">
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
          <button
            type="button"
            className="ghost-button"
            onClick={() => navigate(state.progress.lastVisitedRoute)}
          >
            从最近位置继续
          </button>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">成长提示</span>
          <h3>这轮学习带来的变化</h3>
          <ul className="plain-list">
            <li>累计星级：{growth.totalStars} 星</li>
            <li>当前外观：{growth.selectedAppearance}</li>
            <li>专属场景：{growth.selectedScene}</li>
            <li>下一步重点：{growth.nextFocus}</li>
          </ul>
        </article>
      </section>
    </div>
  );
}
