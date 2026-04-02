import { Link } from "react-router-dom";
import { teacherClassSummaries } from "../../data/mockData";
import { fetchTeacherDashboard } from "../../services/teacher";
import { useAppState } from "../../state/AppState";
import { useApiResource } from "../../utils/useApiResource";

const fallbackClasses = {
  classSummaries: teacherClassSummaries,
  students: [],
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

      <section className="card-grid card-grid--two">
        {data.classSummaries.map((classroom) => (
          <article key={classroom.id} className="surface-card class-card">
            <div className="row-between">
              <div>
                <span className="surface-tag">班级概览</span>
                <h2>{classroom.name}</h2>
              </div>
              <Link className="ghost-button link-button" to="/teacher/students">
                查看学生
              </Link>
            </div>
            <ul className="plain-list">
              <li>班级人数：{classroom.studentCount}</li>
              <li>三关完成率：{classroom.completedRate}%</li>
              <li>考试完成率：{classroom.examCompletionRate}%</li>
              <li>当前关注：{classroom.focusLabel}</li>
            </ul>
          </article>
        ))}
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">教师操作建议</span>
            <h2>课后最适合直接展开的三件事</h2>
          </div>
        </div>
        <ul className="plain-list">
          <li>先查看哪一类学生还没有形成完整的“三关 + 考试”闭环。</li>
          <li>把完成率偏低的班级优先安排路口判断和盲区复习。</li>
          <li>从学生详情页提取薄弱点和成长状态，形成课后跟进建议。</li>
        </ul>
      </section>
    </div>
  );
}
