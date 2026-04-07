import { Link, useNavigate } from "react-router-dom";
import { StudentAdventureHero } from "../../components/student/StudentAdventureHero";
import { StudentMascotBubble } from "../../components/student/StudentMascotBubble";
import { StatusBadge } from "../../components/StatusBadge";
import { fetchStudentGrowth, fetchStudentRecords } from "../../services/student";
import { useAppState } from "../../state/AppState";
import type { StudentGrowthResponse, StudentRecordsResponse } from "../../types";
import { buildGrowthSnapshot } from "../../utils/studentGrowth";
import { getStudentRouteLabel } from "../../utils/studentRouteLabels";
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
      completedLevels: state.progress.levels.filter((level) => level.status === "completed")
        .length,
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
    fallbackMessage: "学习记录页暂时无法更新，当前展示已保存的学习内容。",
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
    fallbackMessage: "成长信息暂时无法更新，当前展示已保存的成长信息。",
  });

  const continueRoute = recordsData.overview.continueRoute || state.progress.lastVisitedRoute;
  const lastVisitedLabel = getStudentRouteLabel(
    recordsData.overview.lastVisitedRoute,
    state.progress.levels,
  );
  const continueRouteLabel = getStudentRouteLabel(
    recordsData.overview.continueRoute,
    state.progress.levels,
  );
  const wrongCount = state.progress.exam.wrongQuestionIds.length;
  const completedLevels = state.progress.levels.filter(
    (level) => level.status === "completed",
  ).length;
  const examStatusLabel =
    recordsData.overview.examStatus === "completed"
      ? `${recordsData.overview.examScore ?? 0} 分`
      : recordsData.overview.examStatus === "available"
        ? "考试已解锁"
        : "还没解锁";
  const sourceLabel = recordsSource === "api" ? "最新记录" : "本地记录";

  return (
    <div className="page-stack student-page student-page--records">
      <StudentAdventureHero
        eyebrow="冒险记录册"
        title="把今天的学习旅程装进记录册"
        description="这里像一本会发光的冒险相册。你可以从这里继续出发，也可以回看每一站做了什么。"
        bubbleTitle="继续出发"
        bubbleText={
          recordsError
            ? "记录册有一点延迟，但现在的内容已经可以继续用了。"
            : "点一下大按钮，就能回到最该继续的地方。"
        }
        mascotLabel={`${completedLevels}`}
        mascotHint={`当前记录来源：${sourceLabel}`}
        accent="mint"
        variant="home"
        stats={[
          {
            label: "主题进度",
            value: `${completedLevels}/${recordsData.overview.totalLevels}`,
            accent: "sky",
          },
          { label: "考试状态", value: examStatusLabel, accent: "orange" },
          { label: "成长阶段", value: growthData.stageLabel, accent: "mint" },
        ]}
        actions={
          <>
            <button
              type="button"
              className="primary-button primary-button--playful"
              onClick={() => navigate(continueRoute)}
            >
              从这里继续
            </button>
            <Link className="ghost-button link-button" to="/student/growth">
              去成长档案
            </Link>
          </>
        }
        aside={
          <div className="student-record-hero-card">
            <span>最近停在</span>
            <strong>{lastVisitedLabel}</strong>
            <p>{recordsData.overview.themeTitle}</p>
          </div>
        }
      />

      <section className="student-card-grid student-card-grid--two">
        <article className="surface-card student-record-route-board">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">冒险总览</span>
            <h2>这一轮你已经走到哪里了？</h2>
          </div>

          <div className="student-mini-card-grid">
            <div className="student-mini-card student-mini-card--sky">
              <span>当前主题</span>
              <strong>{recordsData.overview.themeTitle}</strong>
            </div>
            <div className="student-mini-card student-mini-card--mint">
              <span>积分</span>
              <strong>{recordsData.overview.points}</strong>
            </div>
            <div className="student-mini-card student-mini-card--orange">
              <span>徽章</span>
              <strong>{recordsData.overview.badges.length}</strong>
            </div>
          </div>

          <div className="student-checklist">
            <div className="student-checklist__item">
              <span className="student-checklist__dot" />
              <span>最近学习位置：{lastVisitedLabel}</span>
            </div>
            <div className="student-checklist__item">
              <span className="student-checklist__dot" />
              <span>继续入口：{continueRouteLabel}</span>
            </div>
            <div className="student-checklist__item">
              <span className="student-checklist__dot" />
              <span>考试状态：{examStatusLabel}</span>
            </div>
          </div>
        </article>

        <StudentMascotBubble
          eyebrow="小助手提醒"
          title="想省时间，就从最亮的入口继续"
          message="记录册会把关卡、考试、错题和成长都串起来，所以你不需要自己回忆上次停在哪里。"
          accent="sky"
          notice={
            recordsError ||
            (recordsLoading
              ? "正在同步最新学习记录..."
              : `当前共有 ${wrongCount} 道错题可继续回看。`)
          }
          actions={
            <>
              <button
                type="button"
                className="ghost-button"
                onClick={() => navigate("/student/theme/road-safety/exam/result")}
                disabled={state.progress.exam.status !== "completed"}
              >
                看考试结果
              </button>
              <Link className="ghost-button link-button" to="/student/theme/road-safety">
                打开主题地图
              </Link>
            </>
          }
        />
      </section>

      <section className="student-card-grid student-card-grid--three">
        {state.progress.levels.map((level) => {
          const result = state.progress.levelResults[level.id];
          const target = result
            ? `/student/theme/road-safety/level/${level.id}/result`
            : `/student/theme/road-safety/level/${level.id}`;

          return (
            <article key={level.id} className="surface-card student-record-level-card">
              <div className="student-record-level-card__top">
                <span className="surface-tag">{level.focus}</span>
                <StatusBadge status={level.status} />
              </div>
              <h3>{level.title}</h3>
              <p>
                {result
                  ? `本关得到 ${result.score} 分，拿到 ${result.stars} 星。`
                  : "还没有完成这一关，点进去继续挑战吧。"}
              </p>
              <div className="student-record-level-card__meta">
                <span>{level.duration}</span>
                <span>{result ? "已有庆祝页" : "还没生成结算"}</span>
              </div>
              <button
                type="button"
                className={
                  level.status === "locked"
                    ? "ghost-button"
                    : "primary-button primary-button--playful"
                }
                disabled={level.status === "locked"}
                onClick={() => navigate(target)}
              >
                {result ? "打开这一站" : "去闯这一站"}
              </button>
            </article>
          );
        })}
      </section>

      <section className="student-card-grid student-card-grid--two">
        <article className="surface-card student-record-focus-card">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">考试收口</span>
            <h2>考试、错题和结果页都从这里进</h2>
          </div>

          {state.progress.exam.status === "completed" ? (
            <>
              <div className="student-mini-card-grid">
                <div className="student-mini-card student-mini-card--orange">
                  <span>考试成绩</span>
                  <strong>{state.progress.exam.score ?? 0} 分</strong>
                </div>
                <div className="student-mini-card student-mini-card--sky">
                  <span>错题数量</span>
                  <strong>{wrongCount} 道</strong>
                </div>
              </div>
              <div className="button-row">
                <Link
                  className="primary-button link-button"
                  to="/student/theme/road-safety/exam/result"
                >
                  看考试结果
                </Link>
                <Link
                  className="ghost-button link-button"
                  to="/student/theme/road-safety/wrong-questions"
                >
                  去错题回看
                </Link>
              </div>
            </>
          ) : state.progress.exam.status === "available" ? (
            <button
              type="button"
              className="primary-button primary-button--playful"
              onClick={() => navigate("/student/theme/road-safety/exam")}
            >
              立刻进入考试
            </button>
          ) : (
            <article className="student-empty-panel">
              <strong>考试宝箱还没打开</strong>
              <p>先把三关走完，考试入口才会出现。</p>
            </article>
          )}
        </article>

        <article className="surface-card student-record-focus-card">
          <div className="student-section-heading">
            <span className="section-block__eyebrow">成长快照</span>
            <h2>这轮学习给角色带来了什么变化？</h2>
          </div>

          <div className="student-checklist">
            <div className="student-checklist__item">
              <span className="student-checklist__dot" />
              <span>成长值：{growthData.totalGrowthPoints}</span>
            </div>
            <div className="student-checklist__item">
              <span className="student-checklist__dot" />
              <span>当前外观：{growthData.currentAppearance}</span>
            </div>
            <div className="student-checklist__item">
              <span className="student-checklist__dot" />
              <span>当前场景：{growthData.currentScene}</span>
            </div>
            <div className="student-checklist__item">
              <span className="student-checklist__dot" />
              <span>能力标签：{growthData.currentAbilityTag}</span>
            </div>
          </div>
        </article>
      </section>

      <section className="surface-card student-journey-board">
        <div className="student-section-heading">
          <span className="section-block__eyebrow">时间轨迹</span>
          <h2>{recordsLoading ? "正在把记录册翻到最新一页..." : "每一站都在这里排好了顺序"}</h2>
        </div>

        {recordsData.records.length > 0 ? (
          <div className="student-journey-list">
            {recordsData.records.map((item, index) => (
              <article key={item.id} className="student-journey-item">
                <div className="student-journey-item__marker">{index + 1}</div>
                <div className="student-journey-item__content">
                  <div className="student-journey-item__row">
                    <strong>{item.title}</strong>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => navigate(item.route)}
                    >
                      打开这一站
                    </button>
                  </div>
                  <p>{item.description}</p>
                  <em>{item.createdAt}</em>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <article className="student-empty-panel">
            <strong>记录册还没有新内容</strong>
            <p>继续完成关卡、考试和错题重学后，这里会慢慢装满你的冒险脚印。</p>
          </article>
        )}
      </section>
    </div>
  );
}
