import { useNavigate } from "react-router-dom";
import { StatusBadge } from "../../components/StatusBadge";
import { themeCards } from "../../data/mockData";
import { useAppState } from "../../state/AppState";
import { buildGrowthSnapshot } from "../../utils/studentGrowth";

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
    (level) => level.status === "available" || level.status === "in_progress",
  );

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--student">
        <div>
          <span className="hero-banner__eyebrow">学生首页</span>
          <div className="student-summary">
            {profile ? (
              <span className={`avatar-badge avatar-badge--${avatarAccent}`}>
                {profile.avatarLabel.slice(0, 1)}
              </span>
            ) : null}
            <div>
              <h1>欢迎回来，{profile?.nickname ?? "小小安全员"}</h1>
              <p className="student-summary__meta">
                {profile ? `${profile.avatarLabel} · ${profile.stage}` : "请先完善学生资料"}
              </p>
            </div>
          </div>
          <p>
            你已经完成 {completedLevels} / 3 关，当前成长阶段为
            <strong> {growth.currentTier.title}</strong>，
            主题考试状态为
            <strong>
              {" "}
              {state.progress.exam.status === "completed"
                ? "已完成"
                : state.progress.exam.status === "available"
                  ? "已解锁"
                  : "未解锁"}
            </strong>
            。
          </p>
        </div>

        <div className="hero-banner__actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate(state.progress.lastVisitedRoute)}
          >
            继续学习
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={() => navigate("/student/theme/road-safety")}
          >
            查看主题进度
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={() => navigate("/student/growth")}
          >
            查看成长档案
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={() => navigate("/student/ai")}
          >
            打开 AI 问答
          </button>
        </div>
      </section>

      <section className="card-grid card-grid--three">
        <article className="surface-card stat-card">
          <span>当前积分</span>
          <strong>{state.progress.points}</strong>
          <p>
            完成关卡和考试会自动获得积分与徽章。
            {profile ? ` 当前学段：${profile.stage}。` : ""}
          </p>
        </article>
        <article className="surface-card stat-card">
          <span>下一项任务</span>
          <strong>{nextLevel?.title ?? "已完成全部闯关"}</strong>
          <p>{growth.nextFocus}</p>
        </article>
        <article className="surface-card stat-card">
          <span>成长阶段</span>
          <strong>{growth.currentTier.title}</strong>
          <p>
            {growth.nextTier
              ? `再获得 ${growth.pointsToNext} 分可进入 ${growth.nextTier.title}`
              : "当前阶段内容已全部解锁"}
          </p>
        </article>
      </section>

      <section className="section-block">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">主题学习区</span>
            <h2>选择今天要学习的安全主题</h2>
          </div>
        </div>

        <div className="card-grid card-grid--three">
          {themeCards.map((theme) => (
            <article
              key={theme.id}
              className={`surface-card theme-card theme-card--${theme.accent}`}
            >
              <div className="theme-card__top">
                <span className="surface-tag">{theme.progressLabel}</span>
                {theme.id === "road-safety" ? (
                  <StatusBadge
                    status={
                      completedLevels === 3
                        ? "completed"
                        : completedLevels > 0
                          ? "in_progress"
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
                    : window.alert("该主题正在开发，敬请期待。")
                }
              >
                {theme.cta}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card">
          <span className="section-block__eyebrow">最近学习记录</span>
          <h3>快捷续学</h3>
          <p>系统会记录你最近一次停留的位置，帮助你快速回到未完成的学习节点。</p>
          <ul className="plain-list">
            <li>最近位置：{state.progress.lastVisitedRoute}</li>
            <li>闯关状态：{completedLevels} / 3 已完成</li>
            <li>考试状态：{state.progress.exam.status}</li>
          </ul>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">成长提醒</span>
          <h3>这次学习已经留下了这些成长变化</h3>
          <ul className="plain-list">
            <li>累计星级：{growth.totalStars} 星</li>
            <li>当前外观：{growth.currentTier.appearance}</li>
            <li>专属场景：{growth.currentTier.scene}</li>
            <li>建议下一步：{growth.nextFocus}</li>
          </ul>
        </article>
      </section>
    </div>
  );
}
