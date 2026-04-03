import { Link, useNavigate } from "react-router-dom";
import { StatusBadge } from "../../components/StatusBadge";
import { fetchStudentGrowth, fetchStudentRecords } from "../../services/student";
import { useAppState } from "../../state/AppState";
import type { StudentGrowthResponse, StudentRecordsResponse } from "../../types";
import { buildGrowthSnapshot } from "../../utils/studentGrowth";
import { useApiResource } from "../../utils/useApiResource";

export function StudentRecordPage() {
  const navigate = useNavigate();
  const { state } = useAppState();
  const fallbackGrowth = buildGrowthSnapshot(state);
  const apiEnabled = state.authSource === "api" && Boolean(state.authToken);

  const fallbackRecords: StudentRecordsResponse = {
    overview: {
      themeId: state.progress.themeId,
      themeTitle: state.progress.themeTitle,
      completedLevels: state.progress.levels.filter((level) => level.status === "completed").length,
      totalLevels: state.progress.levels.length,
      examStatus: state.progress.exam.status,
      examScore: state.progress.exam.score,
      lastVisitedRoute: state.progress.lastVisitedRoute,
      lastLearnedAt: null,
      continueRoute: state.progress.lastVisitedRoute,
      badges: state.progress.badges,
      points: state.progress.points,
    },
    records: [],
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

  const {
    data: recordsData,
    error: recordsError,
    isLoading: recordsLoading,
    source: recordsSource,
  } = useApiResource({
    enabled: apiEnabled,
    fallbackData: fallbackRecords,
    fetcher: () => fetchStudentRecords(state.authToken!),
    dependencies: [state.authToken, state.progress.lastVisitedRoute, state.progress.points],
    fallbackMessage: "学习记录页暂时无法连接后端，当前展示本地数据。",
  });

  const { data: growthData } = useApiResource({
    enabled: apiEnabled,
    fallbackData: fallbackGrowthData,
    fetcher: () => fetchStudentGrowth(state.authToken!),
    dependencies: [state.authToken, state.progress.points, state.progress.rewardProgress.reviewedWrongQuestionIds.join("|")],
    fallbackMessage: "成长信息暂时无法连接后端，当前展示本地数据。",
  });

  const continueRoute = recordsData.overview.continueRoute || state.progress.lastVisitedRoute;
  const wrongCount = state.progress.exam.wrongQuestionIds.length;

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--record">
        <div>
          <span className="hero-banner__eyebrow">学习记录页</span>
          <h1>把主题进度、结算回看、错题和成长放在一起</h1>
          <p>
            学习记录页承担“快捷续学 + 主题进度 + 结果回顾 + 错题入口 + 成长快照”的中转功能，方便快速回到下一步。
          </p>
          {recordsError ? <p className="inline-note">{recordsError}</p> : null}
        </div>
        <div className="hero-banner__actions">
          <button type="button" className="primary-button" onClick={() => navigate(continueRoute)}>
            继续学习
          </button>
          <button type="button" className="ghost-button" onClick={() => navigate("/student/growth")}>
            查看成长档案
          </button>
        </div>
      </section>

      <section className="card-grid card-grid--three">
        <article className="surface-card stat-card">
          <span>当前主题</span>
          <strong>{recordsData.overview.themeTitle}</strong>
          <p>最近学习位置：{recordsData.overview.lastVisitedRoute}</p>
        </article>

        <article className="surface-card stat-card">
          <span>考试状态</span>
          <strong>
            {recordsData.overview.examStatus === "completed"
              ? `${recordsData.overview.examScore ?? 0} 分`
              : recordsData.overview.examStatus === "available"
                ? "已解锁"
                : "未解锁"}
          </strong>
          <p>
            {recordsData.overview.examStatus === "completed"
              ? `当前共有 ${wrongCount} 道题可继续回看。`
              : "完成三关后，主题考试会自动点亮。"}
          </p>
        </article>

        <article className="surface-card stat-card">
          <span>成长阶段</span>
          <strong>{growthData.stageLabel}</strong>
          <p>{growthData.growthSummary}</p>
        </article>
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">主题进度</span>
            <h2>每一关的状态和结算入口</h2>
          </div>
        </div>

        <div className="card-grid card-grid--three">
          {state.progress.levels.map((level) => {
            const result = state.progress.levelResults[level.id];
            const target = result
              ? `/student/theme/road-safety/level/${level.id}/result`
              : `/student/theme/road-safety/level/${level.id}`;

            return (
              <article key={level.id} className="surface-card result-card">
                <div className="level-card__header">
                  <div>
                    <span className="surface-tag">{level.focus}</span>
                    <h3>{level.title}</h3>
                  </div>
                  <StatusBadge status={level.status} />
                </div>
                <ul className="plain-list">
                  <li>预计时长：{level.duration}</li>
                  <li>本关得分：{result ? `${result.score} 分` : "尚未生成结算"}</li>
                  <li>星级表现：{result ? `${result.stars} 星` : "完成后显示"}</li>
                </ul>
                <button
                  type="button"
                  className={level.status === "locked" ? "ghost-button" : "primary-button"}
                  disabled={level.status === "locked"}
                  onClick={() => navigate(target)}
                >
                  {result ? "查看本关结算" : "进入本关"}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card">
          <span className="section-block__eyebrow">考试与错题</span>
          <h2>考试页、结果页与错题页入口</h2>
          {state.progress.exam.status === "completed" ? (
            <div className="page-stack page-stack--compact">
              <div className="button-row">
                <Link className="primary-button link-button" to="/student/theme/road-safety/exam/result">
                  查看考试结果页
                </Link>
                <Link className="ghost-button link-button" to="/student/theme/road-safety/wrong-questions">
                  查看错题回看页
                </Link>
              </div>
              <article className="feedback-box">
                <strong>本轮考试已收口</strong>
                <p>当前得分 {state.progress.exam.score ?? 0} 分，错题 {wrongCount} 道。</p>
              </article>
            </div>
          ) : state.progress.exam.status === "available" ? (
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate("/student/theme/road-safety/exam")}
            >
              进入主题考试
            </button>
          ) : (
            <p>先完成三关学习，考试入口才会解锁。</p>
          )}
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">成长快照</span>
          <h2>本轮学习带来的变化</h2>
          <ul className="plain-list">
            <li>成长值：{growthData.totalGrowthPoints}</li>
            <li>当前外观：{growthData.currentAppearance}</li>
            <li>当前场景：{growthData.currentScene}</li>
            <li>能力标签：{growthData.currentAbilityTag}</li>
            <li>已获得徽章：{recordsData.overview.badges.join(" / ") || "暂无"}</li>
          </ul>
        </article>
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">最近学习轨迹</span>
            <h2>{recordsLoading ? "正在同步学习记录..." : "从资料设置到结果反馈的完整轨迹"}</h2>
          </div>
          <span className="surface-tag">{recordsSource === "api" ? "后端记录" : "本地兜底"}</span>
        </div>

        {recordsData.records.length > 0 ? (
          <div className="timeline-list">
            {recordsData.records.map((item, index) => (
              <article key={item.id} className={`timeline-item timeline-item--${index === 0 ? "current" : "done"}`}>
                <span className="timeline-item__dot" />
                <div className="timeline-item__content">
                  <div className="row-between">
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                      <p className="inline-note">{item.createdAt}</p>
                    </div>
                    <button type="button" className="ghost-button" onClick={() => navigate(item.route)}>
                      打开入口
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <article className="feedback-box">
            <strong>当前还没有后端学习记录</strong>
            <p>继续完成关卡、考试和错题重学后，这里会按时间顺序累计展示。</p>
          </article>
        )}
      </section>
    </div>
  );
}
