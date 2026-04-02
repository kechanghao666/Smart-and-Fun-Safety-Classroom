import { Link } from "react-router-dom";
import { teacherStudents } from "../../data/mockData";

export function TeacherStudentsPage() {
  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--teacher">
        <div>
          <span className="hero-banner__eyebrow">班级学生列表</span>
          <h1>查看完成状态、考试状态和最近学习时间</h1>
          <p>当前为轻量表格原型，后续可继续接入筛选、搜索和抽屉式详情。</p>
        </div>
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
            {teacherStudents.map((student) => (
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
      </section>
    </div>
  );
}

