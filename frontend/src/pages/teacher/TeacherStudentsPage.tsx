import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { teacherStudents } from "../../data/mockData";
import { fetchTeacherStudents } from "../../services/teacher";
import { useAppState } from "../../state/AppState";
import { useApiResource } from "../../utils/useApiResource";
import {
  getTeacherAttentionLabel,
  getTeacherAttentionLevel,
} from "../../utils/teacherInsights";

export function TeacherStudentsPage() {
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const { data, error, isLoading, source } = useApiResource({
    enabled: canUseApi,
    fallbackData: teacherStudents,
    fetcher: () => fetchTeacherStudents(state.authToken ?? ""),
    dependencies: [state.authToken],
  });
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [examFilter, setExamFilter] = useState("all");

  const classOptions = Array.from(new Set(data.map((student) => student.className)));
  const filteredStudents = useMemo(
    () =>
      data.filter((student) => {
        const matchesQuery =
          query.trim().length === 0 ||
          student.name.includes(query.trim()) ||
          student.weakSpot.includes(query.trim());
        const matchesClass = classFilter === "all" || student.className === classFilter;
        const matchesExam =
          examFilter === "all" ||
          (examFilter === "completed" && student.score !== null) ||
          (examFilter === "pending" && student.score === null);

        return matchesQuery && matchesClass && matchesExam;
      }),
    [classFilter, data, examFilter, query],
  );
  const urgentCount = filteredStudents.filter(
    (student) => getTeacherAttentionLevel(student) === "urgent",
  ).length;
  const pendingExamCount = filteredStudents.filter((student) => student.score === null).length;

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--teacher">
        <div>
          <span className="hero-banner__eyebrow">班级学生列表</span>
          <h1>按班级、考试状态和风险点快速筛选学生</h1>
          <p>列表页先承担教师的快速检索，再通过学生详情页展开更完整的学习与成长状态。</p>
        </div>
      </section>

      <article className="feedback-box">
        <strong>{source === "api" ? "学生列表来自后端" : "学生列表来自本地 mock"}</strong>
        <p>
          {isLoading
            ? "正在同步学生列表..."
            : error || "学生列表页已经预留真实接口读取能力。"}
        </p>
      </article>

      <section className="card-grid card-grid--three">
        <article className="surface-card stat-card">
          <span>当前筛出</span>
          <strong>{filteredStudents.length}</strong>
          <p>根据搜索词、班级与考试状态综合筛选后的学生数量。</p>
        </article>
        <article className="surface-card stat-card">
          <span>需立即跟进</span>
          <strong>{urgentCount}</strong>
          <p>优先查看高风险学生，缩短发现问题到跟进的路径。</p>
        </article>
        <article className="surface-card stat-card">
          <span>未完成考试</span>
          <strong>{pendingExamCount}</strong>
          <p>提醒尽快形成完整的“三关 + 考试”学习闭环。</p>
        </article>
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
        {filteredStudents.length > 0 ? (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>学生</th>
                  <th>班级</th>
                  <th>学习闭环</th>
                  <th>考试状态</th>
                  <th>跟进等级</th>
                  <th>最近学习</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const attentionLevel = getTeacherAttentionLevel(student);

                  return (
                    <tr key={student.id}>
                      <td>
                        <div className="data-table__cell-stack">
                          <strong>{student.name}</strong>
                          <span className="data-table__muted">{student.weakSpot}</span>
                        </div>
                      </td>
                      <td>{student.className}</td>
                      <td>{student.completedLevels} / 3</td>
                      <td>
                        <div className="data-table__cell-stack">
                          <span>{student.examStatus}</span>
                          <span className="data-table__muted">成绩：{student.score ?? "--"}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`teacher-attention-pill teacher-attention-pill--${attentionLevel}`}
                        >
                          {getTeacherAttentionLabel(attentionLevel)}
                        </span>
                      </td>
                      <td>{student.lastActiveAt}</td>
                      <td>
                        <Link to={`/teacher/students/${student.id}`}>查看详情</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="inline-note">当前共筛出 {filteredStudents.length} 位学生。</p>
          </>
        ) : (
          <article className="feedback-box empty-state-card">
            <strong>没有匹配的学生</strong>
            <p>可以清空筛选条件，或者调整搜索词后再继续查看。</p>
          </article>
        )}
      </section>
    </div>
  );
}
