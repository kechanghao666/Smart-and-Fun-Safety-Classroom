import { Link, useNavigate } from "react-router-dom";
import { useAppState } from "../../state/AppState";
import {
  buildGrowthSnapshot,
  growthTierDefinitions,
} from "../../utils/studentGrowth";

const avatarAccentMap = {
  "sunny-guard": "sky",
  "smart-scout": "mint",
  "brave-captain": "orange",
} as const;

export function StudentGrowthPage() {
  const navigate = useNavigate();
  const { state } = useAppState();
  const growth = buildGrowthSnapshot(state);
  const profile = state.studentProfile;
  const avatarAccent = profile
    ? avatarAccentMap[profile.avatarId as keyof typeof avatarAccentMap] ?? "sky"
    : "sky";

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
              <h1>{profile?.nickname ?? "安全学员"}的成长档案</h1>
              <p className="student-summary__meta">
                {profile
                  ? `${profile.avatarLabel} · ${profile.stage}`
                  : "完善资料后会获得更完整的成长档案展示"}
              </p>
            </div>
          </div>
          <p>
            当前处于 <strong>{growth.currentTier.title}</strong>，{growth.currentTier.description}
          </p>
        </div>

        <article className="growth-progress-panel">
          <span className="surface-tag">成长值</span>
          <strong>{growth.points}</strong>
          <p>
            {growth.nextTier
              ? `距离 ${growth.nextTier.title} 还差 ${growth.pointsToNext} 分`
              : "当前阶段内容已经全部点亮"}
          </p>
          <div className="growth-track">
            <span
              className="growth-track__fill"
              style={{ width: `${growth.nextTierProgress}%` }}
            />
          </div>
        </article>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card growth-highlight-card">
          <span className="section-block__eyebrow">成长结果</span>
          <h2>{growth.currentTier.title}</h2>
          <ul className="plain-list">
            <li>当前外观：{growth.currentTier.appearance}</li>
            <li>专属场景：{growth.currentTier.scene}</li>
            <li>能力标签：{growth.currentTier.ability}</li>
          </ul>
        </article>

        <article className="surface-card growth-highlight-card">
          <span className="section-block__eyebrow">成长概览</span>
          <h2>学习闭环带来的变化</h2>
          <ul className="plain-list">
            <li>累计通关：{growth.completedLevels} / 3 关</li>
            <li>累计星级：{growth.totalStars} 星</li>
            <li>考试成绩：{growth.examScore ?? "尚未完成主题考试"}</li>
            <li>当前关注：{growth.nextFocus}</li>
          </ul>
        </article>
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">成长等级路线</span>
            <h2>从萌芽到守护，当前走到哪一步</h2>
          </div>
        </div>

        <div className="card-grid card-grid--three">
          {growthTierDefinitions.map((tier) => {
            const isCurrent = tier.id === growth.currentTier.id;
            const isUnlocked = growth.points >= tier.minPoints;

            return (
              <article
                key={tier.id}
                className={
                  isCurrent
                    ? "surface-card unlock-card unlock-card--current"
                    : isUnlocked
                      ? "surface-card unlock-card unlock-card--unlocked"
                      : "surface-card unlock-card"
                }
              >
                <div className="row-between">
                  <span className="section-block__eyebrow">{tier.title}</span>
                  <span className="surface-tag">{tier.minPoints} 分</span>
                </div>
                <h3>{tier.appearance}</h3>
                <p>{tier.description}</p>
                <ul className="plain-list">
                  <li>能力：{tier.ability}</li>
                  <li>场景：{tier.scene}</li>
                  <li>{isCurrent ? "当前所处阶段" : isUnlocked ? "已解锁阶段" : "待解锁阶段"}</li>
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">三类成长维度</span>
            <h2>观察力、判断力与防护力</h2>
          </div>
        </div>

        <div className="card-grid card-grid--three">
          {growth.dimensions.map((dimension) => (
            <article key={dimension.id} className="surface-card growth-dimension-card">
              <span className="section-block__eyebrow">{dimension.label}</span>
              <strong>{dimension.score} / 100</strong>
              <div className="growth-track">
                <span
                  className="growth-track__fill growth-track__fill--warm"
                  style={{ width: `${dimension.score}%` }}
                />
              </div>
              <p>{dimension.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">已解锁内容</span>
            <h2>外观、能力与场景</h2>
          </div>
        </div>

        <div className="card-grid card-grid--three">
          {growth.unlocks.map((unlock) => (
            <article key={unlock.label} className="surface-card unlock-card">
              <span className="section-block__eyebrow">{unlock.label}</span>
              <h3>{unlock.value}</h3>
              <p>{unlock.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card admin-preview-card">
          <span className="section-block__eyebrow">成长目标</span>
          <h2>下一次学习最值得关注的事</h2>
          <article className="feedback-box">
            <strong>{growth.nextFocus}</strong>
            <p>
              {growth.nextTier
                ? `再获得 ${growth.pointsToNext} 分，就能进入 ${growth.nextTier.title}。`
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
              <strong>{growth.points}</strong>
              <span>成长值</span>
            </div>
            <div className="stat-pair">
              <strong>{growth.totalStars}</strong>
              <span>累计星级</span>
            </div>
            <div className="stat-pair">
              <strong>{state.progress.badges.length}</strong>
              <span>已获徽章</span>
            </div>
          </div>
          <ul className="plain-list">
            {state.progress.badges.length > 0 ? (
              state.progress.badges.map((badge) => <li key={badge}>{badge}</li>)
            ) : (
              <li>继续完成关卡与考试后，这里会点亮新的徽章与激励。</li>
            )}
          </ul>
        </article>
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">成长轨迹</span>
            <h2>把关卡、考试和成长变化串在一条线上</h2>
          </div>
        </div>

        <div className="timeline-list">
          {growth.journal.map((item) => (
            <article key={item.id} className={`timeline-item timeline-item--${item.status}`}>
              <span className="timeline-item__dot" />
              <div className="timeline-item__content">
                <div className="row-between">
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.detail}</p>
                  </div>
                  <Link className="ghost-button link-button" to={item.href}>
                    {item.ctaLabel}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
