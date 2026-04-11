import { Link, useParams } from "react-router-dom";
import { StatusBadge } from "../../components/StatusBadge";
import { fetchTeacherStudentDetail } from "../../services/teacher";
import { useAppState } from "../../state/AppState";
import { useApiResource } from "../../utils/useApiResource";
import { getGrowthSceneVisualClass } from "../../utils/studentGrowth";
import {
  buildTeacherStudentActions,
  getTeacherAttentionLabel,
  getTeacherAttentionLevel,
} from "../../utils/teacherInsights";

export function TeacherStudentDetailPage() {
  const { studentId } = useParams();
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken) && Boolean(studentId);
  const { data: student, error, isLoading } = useApiResource({
    enabled: canUseApi,
    fallbackData: null,
    fetcher: () => fetchTeacherStudentDetail(state.authToken ?? "", studentId ?? ""),
    dependencies: [state.authToken, studentId],
    fallbackMessage: "暂时无法获取学生详情。",
  });

  if (!student) {
    return (
      <section className="surface-card empty-state-card">
        <h2>未找到学生信息</h2>
      </section>
    );
  }

  const attentionLevel = getTeacherAttentionLevel(student);
  const attentionLabel = getTeacherAttentionLabel(attentionLevel);
  const suggestedActions = buildTeacherStudentActions(student);
  const primaryAction = suggestedActions[0] ?? "先围绕当前薄弱点安排一次针对性复盘。";
  const secondaryActions = suggestedActions.slice(1);
  const closedLoopRate = Math.round((student.completedLevels / 3) * 100);
  const currentAppearance = student.currentAppearance ?? "成长展示待同步";
  const currentScene = student.currentScene ?? student.unlockedScenes?.[0] ?? "成长场景待同步";
  const currentAbility = student.currentAbility ?? student.motivationLabel;
  const growthLevelLabel =
    student.growthLevelLabel ?? (student.growthPoints ? `成长值 ${student.growthPoints}` : "成长档案");
  const sceneVisualClass = getGrowthSceneVisualClass(currentScene);
  const wrongTopics =
    student.wrongTopics.length > 0
      ? student.wrongTopics
      : ["当前暂无考试错题，建议继续围绕薄弱点安排复习。"];

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--teacher">
        <div>
          <span className="hero-banner__eyebrow">学生详情</span>
          <h1>{student.name}</h1>
          <div className="chip-row">
            <span className="surface-tag">{student.className}</span>
            <span className="surface-tag">学号 {student.studentNo ?? "--"}</span>
            <span className="surface-tag">{student.growthStage}</span>
            <span className="surface-tag">{growthLevelLabel}</span>
            <span className={`teacher-attention-pill teacher-attention-pill--${attentionLevel}`}>
              {attentionLabel}
            </span>
          </div>
          <p>最近活跃：{student.lastActiveAt}</p>
        </div>
        <div className="hero-banner__actions">
          <Link className="ghost-button link-button" to="/teacher/students">
            返回学生列表
          </Link>
        </div>
      </section>

      <article className="feedback-box feedback-box--compact">
        <strong>{error ? "学生详情同步失败" : "学生详情已从后端加载"}</strong>
        <p>
          {isLoading
            ? "正在同步学生详情..."
            : error || "学生详情页会持续汇总学习进展、考试表现和成长状态。"}
        </p>
      </article>

      <section className="card-grid card-grid--four">
        <article className="surface-card stat-card stat-card--compact">
          <span>学习闭环完成率</span>
          <strong>{closedLoopRate}%</strong>
          <p>{student.motivationLabel}</p>
        </article>
        <article className="surface-card stat-card stat-card--compact">
          <span>考试表现</span>
          <strong>{student.score ?? "--"}</strong>
          <p>{student.examStatus}</p>
        </article>
        <article className="surface-card stat-card stat-card--compact">
          <span>成长阶段</span>
          <strong>{student.growthStage}</strong>
          <p>{student.growthSummary}</p>
        </article>
        <article className="surface-card stat-card stat-card--compact">
          <span>跟进等级</span>
          <strong>{attentionLabel}</strong>
          <p>综合进度、考试状态和薄弱点得出的建议等级。</p>
        </article>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card teacher-priority-card">
          <span className="section-block__eyebrow">首要建议动作</span>
          <h2>先做这一件事最有效</h2>
          <p>{primaryAction}</p>
          <div className="chip-row">
            <span className="surface-tag">薄弱点：{student.weakSpot}</span>
            <span className="surface-tag">
              当前状态：已完成 {student.completedLevels} / 3 关
            </span>
          </div>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">考试与追问</span>
          <h2>课后需要重点追问的内容</h2>
          <ul className="plain-list">
            {wrongTopics.map((topic) => (
              <li key={topic}>{topic}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card">
          <span className="section-block__eyebrow">关卡表现</span>
          <h2>逐关查看停留点和表现</h2>
          <div className="page-stack page-stack--compact">
            {student.levelStatuses.map((level) => (
              <article key={level.levelId} className="teacher-analysis-card teacher-analysis-card--compact">
                <div className="row-between">
                  <div>
                    <strong>{level.title}</strong>
                    <p className="teacher-analysis-card__meta">{level.note}</p>
                  </div>
                  <StatusBadge status={level.status} />
                </div>
                <p>本关得分：{level.score ?? "尚未完成"}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">成长状态</span>
          <h2>把学习结果转成持续推进的反馈</h2>
          <div className="page-stack page-stack--compact">
            <article className="teacher-growth-showcase">
              <div className={`teacher-growth-showcase__visual ${sceneVisualClass}`}>
                <strong>{currentAppearance}</strong>
                <p>{currentScene}</p>
              </div>
              <div className="chip-row">
                <span className="surface-tag">{growthLevelLabel}</span>
                <span className="surface-tag">{student.growthStage}</span>
                <span className="surface-tag">{currentAbility}</span>
              </div>
              <p className="compact-copy compact-copy--two-line" title={student.growthSummary}>
                {student.growthSummary}
              </p>
            </article>
          </div>
        </article>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card">
          <span className="section-block__eyebrow">补充动作</span>
          <h2>后续可继续安排的提醒</h2>
          <div className="page-stack page-stack--compact">
            {secondaryActions.length > 0 ? (
              secondaryActions.map((item) => (
                <article key={item} className="teacher-action-card teacher-action-card--compact">
                  <strong>下一步建议</strong>
                  <p>{item}</p>
                </article>
              ))
            ) : (
              <article className="teacher-action-card teacher-action-card--compact">
                <strong>下一步建议</strong>
                <p>当前首要动作已经足够明确，可先围绕这一项执行并观察变化。</p>
              </article>
            )}
          </div>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">课堂追问</span>
          <h2>结合课堂复习继续追问</h2>
          <div className="page-stack page-stack--compact">
            {student.recommendations.map((item) => (
              <article key={item} className="feedback-box feedback-box--compact">
                <strong>补充建议</strong>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
