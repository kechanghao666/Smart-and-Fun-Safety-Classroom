import { Link, useParams } from "react-router-dom";
import { StatusBadge } from "../../components/StatusBadge";
import { teacherStudentDetails } from "../../data/mockData";
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
  const canUseApi =
    state.authSource === "api" && Boolean(state.authToken) && Boolean(studentId);
  const fallbackStudent =
    teacherStudentDetails.find((item) => item.id === studentId) ?? null;
  const { data: student, error, isLoading, source } = useApiResource({
    enabled: canUseApi,
    fallbackData: fallbackStudent,
    fetcher: () => fetchTeacherStudentDetail(state.authToken ?? "", studentId ?? ""),
    dependencies: [state.authToken, studentId],
    fallbackMessage: "暂时无法获取学生详情，当前已切换为预置数据。",
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
  const closedLoopRate = Math.round((student.completedLevels / 3) * 100);
  const sceneVisualClass = getGrowthSceneVisualClass(student.currentScene);
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
            <span className="surface-tag">{student.growthStage}</span>
            <span className="surface-tag">{student.growthLevelLabel}</span>
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

      <article className="feedback-box">
        <strong>{source === "api" ? "学生详情已接入服务数据" : "学生详情当前使用预置数据"}</strong>
        <p>
          {isLoading
            ? "正在同步学生详情..."
            : error || "学生详情页会根据当前数据来源自动更新学习与成长信息。"}
        </p>
      </article>

      <section className="card-grid card-grid--four">
        <article className="surface-card stat-card">
          <span>学习闭环完成率</span>
          <strong>{closedLoopRate}%</strong>
          <p>{student.motivationLabel}</p>
        </article>
        <article className="surface-card stat-card">
          <span>考试表现</span>
          <strong>{student.score ?? "--"}</strong>
          <p>{student.examStatus}</p>
        </article>
        <article className="surface-card stat-card">
          <span>成长阶段</span>
          <strong>{student.growthStage}</strong>
          <p>{student.growthSummary}</p>
        </article>
        <article className="surface-card stat-card">
          <span>跟进等级</span>
          <strong>{attentionLabel}</strong>
          <p>综合关卡完成、考试状态和薄弱点得出的前端分析等级。</p>
        </article>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card">
          <span className="section-block__eyebrow">学习闭环概览</span>
          <h2>先判断学生停在了哪一步</h2>
          <div className="page-stack">
            <article className="teacher-analysis-card">
              <strong>当前状态</strong>
              <p>已完成 {student.completedLevels} / 3 关，考试状态为“{student.examStatus}”。</p>
            </article>
            <article className="teacher-analysis-card">
              <strong>当前薄弱点</strong>
              <p>{student.weakSpot}</p>
            </article>
          </div>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">考试与风险</span>
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
          <div className="page-stack">
            {student.levelStatuses.map((level) => (
              <article key={level.levelId} className="teacher-analysis-card">
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
          <h2>把学习结果转成可持续推进的反馈</h2>
          <div className="page-stack">
            <article className="teacher-growth-showcase">
              <div
                className={`teacher-growth-showcase__visual ${sceneVisualClass}`}
              >
                <strong>{student.currentAppearance}</strong>
                <p>{student.currentScene}</p>
              </div>
              <div className="chip-row">
                <span className="surface-tag">{student.growthLevelLabel}</span>
                <span className="surface-tag">{student.growthStage}</span>
                <span className="surface-tag">{student.currentAbility}</span>
              </div>
            </article>
            <article className="teacher-analysis-card">
              <strong>人物当前形态</strong>
              <p>{student.currentAppearance}</p>
            </article>
            <article className="teacher-analysis-card">
              <strong>成长等级</strong>
              <p>
                {student.growthLevelLabel} · {student.growthStage}
              </p>
            </article>
            <article className="teacher-analysis-card">
              <strong>已解锁能力 / 场景</strong>
              <p>
                {student.currentAbility} · {student.currentScene}
              </p>
            </article>
            <article className="teacher-analysis-card">
              <strong>成长总结</strong>
              <p>{student.growthSummary}</p>
            </article>
            <article className="teacher-analysis-card">
              <strong>当前激励标签</strong>
              <p>{student.motivationLabel}</p>
            </article>
          </div>
        </article>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card">
          <span className="section-block__eyebrow">建议动作</span>
          <h2>教师下一步最值得执行的动作</h2>
          <div className="page-stack">
            {suggestedActions.map((item) => (
              <article key={item} className="teacher-action-card">
                <strong>建议动作</strong>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">补充建议</span>
          <h2>和课堂复习结合的补充追问</h2>
          <div className="page-stack">
            {student.recommendations.map((item) => (
              <article key={item} className="feedback-box">
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
