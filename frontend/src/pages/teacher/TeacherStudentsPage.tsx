import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { teacherStudents } from "../../data/mockData";

export function TeacherStudentsPage() {
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [examFilter, setExamFilter] = useState("all");

  const classOptions = Array.from(new Set(teacherStudents.map((student) => student.className)));
  const filteredStudents = useMemo(
    () =>
      teacherStudents.filter((student) => {
        const matchesQuery =
          query.trim().length === 0 ||
          student.name.includes(query.trim()) ||
          student.weakSpot.includes(query.trim());
        const matchesClass =
          classFilter === "all" || student.className === classFilter;
        const matchesExam =
          examFilter === "all" ||
          (examFilter === "completed" && student.score !== null) ||
          (examFilter === "pending" && student.score === null);

        return matchesQuery && matchesClass && matchesExam;
      }),
    [classFilter, examFilter, query],
  );

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--teacher">
        <div>
          <span className="hero-banner__eyebrow">班级学生列表</span>
          <h1>按班级、考试状态和风险点快速筛选学生</h1>
          <p>列表页先承担教师的快速检索，再通过学生详情页展开更完整的学习与成长状态。</p>
        </div>
      </section>

      <section className="surface-card filter-bar">
        <label className="form-field">
          <span>搜索学生</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索姓名或薄弱点"
          />
        </label>

        <label className="form-field">
          <span>班级</span>
          <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
            <option value="all">全部班级</option>
            {classOptions.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>考试状态</span>
          <select value={examFilter} onChange={(event) => setExamFilter(event.target.value)}>
            <option value="all">全部状态</option>
            <option value="completed">已完成考试</option>
            <option value="pending">未完成考试</option>
          </select>
        </label>
      </section>

      <section className="surface-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>姓名</th>
              <th>班级</th>
              <th>三关完成</th>
              <th>考试状态</th>
              <th>成绩</th>
              <th>最近学习时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id}>
                <td>{student.name}</td>
                <td>{student.className}</td>
                <td>{student.completedLevels} / 3</td>
                <td>{student.examStatus}</td>
                <td>{student.score ?? "--"}</td>
                <td>{student.lastActiveAt}</td>
                <td>
                  <Link to={`/teacher/students/${student.id}`}>查看详情</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="inline-note">当前共筛出 {filteredStudents.length} 位学生。</p>
      </section>
    </div>
  );
}
