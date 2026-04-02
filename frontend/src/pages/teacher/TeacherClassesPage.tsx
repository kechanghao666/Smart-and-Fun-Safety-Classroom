import { Link } from "react-router-dom";
import { teacherClassSummaries, teacherStudents } from "../../data/mockData";
import { fetchTeacherDashboard } from "../../services/teacher";
import { useAppState } from "../../state/AppState";
import { useApiResource } from "../../utils/useApiResource";
import {
  buildTeacherDashboardActions,
  getTeacherAttentionLabel,
} from "../../utils/teacherInsights";

const fallbackClasses = {
  classSummaries: teacherClassSummaries,
  students: teacherStudents,
};

export function TeacherClassesPage() {
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const { data, error, isLoading, source } = useApiResource({
    enabled: canUseApi,
    fallbackData: fallbackClasses,
    fetcher: () => fetchTeacherDashboard(state.authToken ?? ""),
    dependencies: [state.authToken],
  });
  const totalStudents = data.classSummaries.reduce(
    (count, classroom) => count + classroom.studentCount,
    0,
  );
  const averageCompletion =
    data.classSummaries.length > 0
      ? Math.round(
          data.classSummaries.reduce((sum, classroom) => sum + classroom.completedRate, 0) /
            data.classSummaries.length,
        )
      : 0;
  const priorityClass =
    data.classSummaries
      .slice()
      .sort((left, right) => left.completedRate - right.completedRate)[0] ?? null;
  const dashboardActions = buildTeacherDashboardActions(data.students, data.classSummaries);

  function getClassAttentionLevel(completedRate: number, examCompletionRate: number) {
    if (completedRate < 70 || examCompletionRate < 50) {
      return "urgent";
    }

    if (completedRate < 80 || examCompletionRate < 60) {
      return "watch";
    }

    return "stable";
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--teacher">
        <div>
          <span className="hero-banner__eyebrow">班级管理</span>
          <h1>先看班级，再看每位学生的学习闭环</h1>
          <p>这里汇总班级完成率、考试完成率和当前最需要关注的学习主题。</p>
        </div>
      </section>

      <article className="feedback-box">
        <strong>{source === "api" ? "班级数据来自后端" : "班级数据来自本地 mock"}</strong>
        <p>
          {isLoading
            ? "正在同步班级概览..."
            : error || "班级概览页已经预留真实接口读取能力。"}
        </p>
      </article>

      <section className="card-grid card-grid--four">
        <article className="surface-card stat-card">
          <span>班级数量</span>
          <strong>{data.classSummaries.length}</strong>
          <p>用于判断当前教师账号下的可管理班级范围。</p>
        </article>
        <article className="surface-card stat-card">
          <span>班级总人数</span>
          <strong>{totalStudents}</strong>
          <p>以当前主题学习闭环为中心统计班级覆盖人数。</p>
        </article>
        <article className="surface-card stat-card">
          <span>平均完成率</span>
          <strong>{averageCompletion}%</strong>
          <p>帮助教师快速判断班级整体推进是否均衡。</p>
        </article>
        <article className="surface-card stat-card">
          <span>优先关注班级</span>
          <strong>{priorityClass?.name ?? "--"}</strong>
          <p>{priorityClass?.focusLabel ?? "当前暂无班级数据。"} </p>
        </article>
      </section>

      <section className="card-grid card-grid--two">
        {data.classSummaries.length > 0 ? (
          data.classSummaries.map((classroom) => {
            const attentionLevel = getClassAttentionLevel(
              classroom.completedRate,
              classroom.examCompletionRate,
            );

            return (
              <article key={classroom.id} className="surface-card class-card">
                <div className="row-between">
                  <div>
                    <span className="surface-tag">班级概览</span>
                    <h2>{classroom.name}</h2>
                  </div>
                  <span
                    className={`teacher-attention-pill teacher-attention-pill--${attentionLevel}`}
                  >
                    {getTeacherAttentionLabel(attentionLevel)}
                  </span>
                </div>
                <ul className="plain-list">
                  <li>班级人数：{classroom.studentCount}</li>
                  <li>三关完成率：{classroom.completedRate}%</li>
                  <li>考试完成率：{classroom.examCompletionRate}%</li>
                  <li>当前关注：{classroom.focusLabel}</li>
                </ul>
                <div className="row-between">
                  <span className="inline-note">建议先从完成率较低的班级安排复习。</span>
                  <Link className="ghost-button link-button" to="/teacher/students">
                    查看学生
                  </Link>
                </div>
              </article>
            );
          })
        ) : (
          <article className="surface-card empty-state-card">
            <strong>当前没有班级概览</strong>
            <p>等待后端返回班级数据，或先使用本地演示数据初始化工作台。</p>
          </article>
        )}
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">教师操作建议</span>
            <h2>课后最适合直接展开的三件事</h2>
          </div>
        </div>
        <div className="card-grid card-grid--three">
          {dashboardActions.map((item) => (
            <article key={item.id} className="teacher-action-card">
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
