import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { teacherStudents } from "../../data/mockData";

export function TeacherStudentDetailPage() {
  const { studentId } = useParams();
  const student = useMemo(
    () => teacherStudents.find((item) => item.id === studentId),
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
          <p>{student.className}</p>
        </div>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card">
          <span className="section-block__eyebrow">学习状态</span>
          <ul className="plain-list">
            <li>已完成关卡：{student.completedLevels} / 3</li>
            <li>考试状态：{student.examStatus}</li>
            <li>考试成绩：{student.score ?? "未完成"}</li>
            <li>最近学习时间：{student.lastActiveAt}</li>
          </ul>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">重点关注</span>
          <p>{student.weakSpot}</p>
          <p>后续可在这里继续补充错题概览、激励情况和针对性建议。</p>
        </article>
      </section>
    </div>
  );
}

