import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { StatusBadge } from "../../components/StatusBadge";
import { teacherStudentDetails } from "../../data/mockData";

export function TeacherStudentDetailPage() {
  const { studentId } = useParams();
  const student = useMemo(
    () => teacherStudentDetails.find((item) => item.id === studentId),
    [studentId],
  );

  if (!student) {
    return (
      <section className="surface-card">
        <h2>未找到学生信息</h2>
      </section>
    );
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--teacher">
        <div>
          <span className="hero-banner__eyebrow">学生详情</span>
          <h1>{student.name}</h1>
          <p>
            {student.className} · {student.growthStage} · 最近活跃：{student.lastActiveAt}
          </p>
        </div>
        <div className="hero-banner__actions">
          <Link className="ghost-button link-button" to="/teacher/students">
            返回学生列表
          </Link>
        </div>
      </section>

      <section className="card-grid card-grid--three">
        <article className="surface-card stat-card">
          <span>学习完成</span>
          <strong>{student.completedLevels} / 3</strong>
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
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card">
          <span className="section-block__eyebrow">关卡完成情况</span>
          <h2>看每一关卡在哪一段停住了</h2>
          <div className="page-stack">
            {student.levelStatuses.map((level) => (
              <article key={level.levelId} className="teacher-alert-card">
                <div className="row-between">
                  <div>
                    <strong>{level.title}</strong>
                    <p>{level.note}</p>
                  </div>
                  <StatusBadge status={level.status} />
                </div>
                <p>本关得分：{level.score ?? "尚未完成"}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">错题与建议</span>
          <h2>教师课后跟进重点</h2>
          <ul className="plain-list">
            <li>当前薄弱点：{student.weakSpot}</li>
            {student.wrongTopics.map((topic) => (
              <li key={topic}>错题/风险：{topic}</li>
            ))}
          </ul>
          <div className="page-stack">
            {student.recommendations.map((item) => (
              <article key={item} className="feedback-box">
                <strong>建议动作</strong>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
