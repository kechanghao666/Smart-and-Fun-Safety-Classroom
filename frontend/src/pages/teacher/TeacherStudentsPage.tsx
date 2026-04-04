import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { teacherStudents } from "../../data/mockData";
import { fetchTeacherStudents } from "../../services/teacher";
import { useAppState } from "../../state/AppState";
import type { TeacherStudentSummary } from "../../types";
import {
  getTeacherAttentionLabel,
  getTeacherAttentionLevel,
} from "../../utils/teacherInsights";

type CompletionFilter = "all" | "completed" | "incomplete";
type ExamFilter = "all" | "completed" | "pending";

const attentionRank = {
  urgent: 0,
  watch: 1,
  stable: 2,
} as const;

export function TeacherStudentsPage() {
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const [students, setStudents] = useState<TeacherStudentSummary[]>(teacherStudents);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(canUseApi);
  const [source, setSource] = useState<"api" | "mock">(canUseApi ? "api" : "mock");
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [examFilter, setExamFilter] = useState<ExamFilter>("all");
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>("all");

  useEffect(() => {
    let cancelled = false;

    async function loadStudents() {
      if (!canUseApi || !state.authToken) {
        setStudents(teacherStudents);
        setSource("mock");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");
      setSource("api");

      try {
        const result = await fetchTeacherStudents(state.authToken, {
          className: classFilter,
          completionStatus: completionFilter,
          examStatus: examFilter,
        });

        if (!cancelled) {
          setStudents(result);
          setSource("api");
        }
      } catch (requestError) {
        if (!cancelled) {
          setStudents(teacherStudents);
          setSource("mock");
          setError(
            requestError instanceof Error
              ? requestError.message
              : "学生列表暂时无法更新，当前展示示例内容。",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadStudents();

    return () => {
      cancelled = true;
    };
  }, [canUseApi, classFilter, completionFilter, examFilter, state.authToken]);

  const classOptions = Array.from(new Set(teacherStudents.map((student) => student.className)));
  const filteredStudents = useMemo(
    () =>
      students.filter((student) => {
        const keyword = query.trim();
        return (
          keyword.length === 0 ||
          student.name.includes(keyword) ||
          student.weakSpot.includes(keyword)
        );
      }),
    [query, students],
  );

  const urgentCount = filteredStudents.filter(
    (student) => getTeacherAttentionLevel(student) === "urgent",
  ).length;
  const pendingExamCount = filteredStudents.filter((student) => student.score === null).length;
  const fullyCompletedCount = filteredStudents.filter((student) => student.completedLevels === 3).length;
  const priorityStudents = filteredStudents
    .slice()
    .sort((left, right) => {
      const leftLevel = getTeacherAttentionLevel(left);
      const rightLevel = getTeacherAttentionLevel(right);

      return (
        attentionRank[leftLevel] - attentionRank[rightLevel] ||
        left.completedLevels - right.completedLevels
      );
    })
    .slice(0, 3);
  const hasFilters =
    query.trim().length > 0 ||
    classFilter !== "all" ||
    examFilter !== "all" ||
    completionFilter !== "all";

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--teacher">
        <div>
          <span className="hero-banner__eyebrow">班级学生列表</span>
          <h1>按班级、完成状态、考试状态和风险点快速筛选学生</h1>
          <p>列表页先承担教师的快速检索，再通过学生详情页展开完整的学习与成长状态。</p>
        </div>
      </section>

      <article className="feedback-box">
        <strong>{source === "api" ? "学生列表已同步更新" : "学生列表当前展示示例内容"}</strong>
        <p>{isLoading ? "正在同步学生列表..." : error || "班级、完成状态和考试状态筛选会自动更新当前查看结果。"}</p>
      </article>

      <section className="card-grid card-grid--three">
        <article className="surface-card stat-card">
          <span>当前筛出</span>
          <strong>{filteredStudents.length}</strong>
          <p>根据搜索词、班级、完成状态和考试状态综合筛选后的学生数量。</p>
        </article>
        <article className="surface-card stat-card">
          <span>三关已完成</span>
          <strong>{fullyCompletedCount}</strong>
          <p>用于判断学生是否已经完成主题主学习流程。</p>
        </article>
        <article className="surface-card stat-card">
          <span>需立即跟进</span>
          <strong>{urgentCount}</strong>
          <p>优先查看高风险学生详情页，缩短发现问题到跟进的路径。</p>
        </article>
      </section>

      <section className="surface-card filter-bar filter-bar--teacher">
        <label className="form-field">
          <span>搜索学生</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索姓名或薄弱点" />
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
          <span>完成状态</span>
          <select value={completionFilter} onChange={(event) => setCompletionFilter(event.target.value as CompletionFilter)}>
            <option value="all">全部状态</option>
            <option value="completed">已完成三关</option>
            <option value="incomplete">未完成三关</option>
          </select>
        </label>

        <label className="form-field">
          <span>考试状态</span>
          <select value={examFilter} onChange={(event) => setExamFilter(event.target.value as ExamFilter)}>
            <option value="all">全部状态</option>
            <option value="completed">已完成考试</option>
            <option value="pending">未完成考试</option>
          </select>
        </label>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card admin-preview-card">
          <span className="section-block__eyebrow">筛选反馈</span>
          <h2>当前教师筛选条件</h2>
          <div className="chip-row">
            <span className="surface-tag">关键字：{query.trim().length > 0 ? query.trim() : "未设置"}</span>
            <span className="surface-tag">班级：{classFilter === "all" ? "全部班级" : classFilter}</span>
            <span className="surface-tag">完成状态：{completionFilter === "all" ? "全部状态" : completionFilter === "completed" ? "已完成三关" : "未完成三关"}</span>
            <span className="surface-tag">考试状态：{examFilter === "all" ? "全部状态" : examFilter === "completed" ? "已完成考试" : "未完成考试"}</span>
          </div>
          <p>当前未完成考试学生 {pendingExamCount} 人，建议优先补齐“三关 + 考试”的闭环。</p>
          {hasFilters ? (
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                setQuery("");
                setClassFilter("all");
                setExamFilter("all");
                setCompletionFilter("all");
              }}
            >
              清空筛选
            </button>
          ) : null}
        </article>

        <article className="surface-card admin-preview-card">
          <span className="section-block__eyebrow">优先名单</span>
          <h2>最值得先跟进的学生</h2>
          <div className="page-stack page-stack--compact">
            {priorityStudents.map((student) => {
              const attentionLevel = getTeacherAttentionLevel(student);
              return (
                <article key={student.id} className="teacher-analysis-card">
                  <div className="row-between">
                    <div>
                      <strong>{student.name}</strong>
                      <p>{student.className}</p>
                    </div>
                    <span className={`teacher-attention-pill teacher-attention-pill--${attentionLevel}`}>
                      {getTeacherAttentionLabel(attentionLevel)}
                    </span>
                  </div>
                  <p>{student.weakSpot}</p>
                </article>
              );
            })}
          </div>
        </article>
      </section>

      <section className="page-stack">
        {filteredStudents.map((student) => {
          const attentionLevel = getTeacherAttentionLevel(student);
          return (
            <article key={student.id} className="surface-card result-card">
              <div className="row-between">
                <div>
                  <strong>{student.name}</strong>
                  <p>{student.className}</p>
                </div>
                <span className={`teacher-attention-pill teacher-attention-pill--${attentionLevel}`}>
                  {getTeacherAttentionLabel(attentionLevel)}
                </span>
              </div>
              <div className="card-grid card-grid--three">
                <article className="feedback-box">
                  <strong>三关完成</strong>
                  <p>{student.completedLevels} / 3</p>
                </article>
                <article className="feedback-box">
                  <strong>考试成绩</strong>
                  <p>{student.score ?? "尚未完成考试"}</p>
                </article>
                <article className="feedback-box">
                  <strong>薄弱点</strong>
                  <p>{student.weakSpot}</p>
                </article>
              </div>
              <div className="button-row">
                <Link className="primary-button link-button" to={`/teacher/students/${student.id}`}>
                  查看学生详情
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
