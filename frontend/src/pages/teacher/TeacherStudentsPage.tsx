import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PaginationControls } from "../../components/PaginationControls";
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

const STUDENTS_PER_PAGE = 8;

export function TeacherStudentsPage() {
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const [students, setStudents] = useState<TeacherStudentSummary[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(canUseApi);
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [examFilter, setExamFilter] = useState<ExamFilter>("all");
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function loadStudents() {
      if (!canUseApi || !state.authToken) {
        setStudents([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const result = await fetchTeacherStudents(state.authToken, {
          className: classFilter,
          completionStatus: completionFilter,
          examStatus: examFilter,
        });

        if (!cancelled) {
          setStudents(result);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "学生列表暂时无法更新。",
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

  useEffect(() => {
    setPage(1);
  }, [query, classFilter, examFilter, completionFilter]);

  const classOptions = Array.from(new Set(students.map((student) => student.className)));
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

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * STUDENTS_PER_PAGE;
    return filteredStudents.slice(start, start + STUDENTS_PER_PAGE);
  }, [filteredStudents, page]);

  const urgentCount = filteredStudents.filter(
    (student) => getTeacherAttentionLevel(student) === "urgent",
  ).length;
  const pendingExamCount = filteredStudents.filter((student) => student.score === null).length;
  const fullyCompletedCount = filteredStudents.filter(
    (student) => student.completedLevels === 3,
  ).length;
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
          {error ? <p className="inline-note">{error}</p> : null}
        </div>
      </section>

      <article className="feedback-box teacher-feedback-note">
        <strong>{error ? "学生列表同步失败" : "学生列表已从后端加载"}</strong>
        <p>
          {isLoading
            ? "正在同步学生列表..."
            : error || "班级、完成状态和考试状态筛选会自动更新当前查看结果。"}
        </p>
      </article>

      <section className="card-grid card-grid--three">
        <article className="surface-card stat-card stat-card--compact">
          <span>当前筛出</span>
          <strong>{filteredStudents.length}</strong>
          <p>根据搜索词、班级、完成状态和考试状态综合筛选后的学生数量。</p>
        </article>
        <article className="surface-card stat-card stat-card--compact">
          <span>三关已完成</span>
          <strong>{fullyCompletedCount}</strong>
          <p>用于判断学生是否已经完成主题主学习流程。</p>
        </article>
        <article className="surface-card stat-card stat-card--compact">
          <span>需立即跟进</span>
          <strong>{urgentCount}</strong>
          <p>优先查看高风险学生详情页，缩短发现问题到跟进的路径。</p>
        </article>
      </section>

      <section className="surface-card filter-bar filter-bar--teacher">
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
          <span>完成状态</span>
          <select
            value={completionFilter}
            onChange={(event) =>
              setCompletionFilter(event.target.value as CompletionFilter)
            }
          >
            <option value="all">全部状态</option>
            <option value="completed">已完成三关</option>
            <option value="incomplete">未完成三关</option>
          </select>
        </label>

        <label className="form-field">
          <span>考试状态</span>
          <select
            value={examFilter}
            onChange={(event) => setExamFilter(event.target.value as ExamFilter)}
          >
            <option value="all">全部状态</option>
            <option value="completed">已完成考试</option>
            <option value="pending">未完成考试</option>
          </select>
        </label>
      </section>

      <section className="surface-card admin-preview-card admin-preview-card--compact">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">优先名单</span>
            <h2>最值得先跟进的学生</h2>
          </div>
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
        </div>

        <div className="teacher-compact-priority-grid">
          {priorityStudents.length > 0 ? (
            priorityStudents.map((student) => {
              const attentionLevel = getTeacherAttentionLevel(student);

              return (
                <article key={student.id} className="teacher-analysis-card teacher-analysis-card--compact">
                  <div className="row-between">
                    <div>
                      <strong>{student.name}</strong>
                      <p className="teacher-analysis-card__meta">{student.className}</p>
                    </div>
                    <span className={`teacher-attention-pill teacher-attention-pill--${attentionLevel}`}>
                      {getTeacherAttentionLabel(attentionLevel)}
                    </span>
                  </div>
                  <p className="compact-copy compact-copy--two-line" title={student.weakSpot}>
                    {student.weakSpot}
                  </p>
                </article>
              );
            })
          ) : (
            <article className="feedback-box empty-state-card empty-state-card--compact">
              <strong>当前没有需要优先跟进的学生</strong>
              <p>可以先查看本页下方的学生总览列表。</p>
            </article>
          )}
        </div>
      </section>

      <section className="surface-card teacher-student-list-panel">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">学生总览</span>
            <h2>固定尺寸列表中查看全部学生</h2>
          </div>
          <div className="chip-row">
            <span className="surface-tag">待考试 {pendingExamCount} 人</span>
            <span className="surface-tag">每页 {STUDENTS_PER_PAGE} 人</span>
          </div>
        </div>

        {paginatedStudents.length > 0 ? (
          <>
            <div className="teacher-student-list">
              {paginatedStudents.map((student) => {
                const attentionLevel = getTeacherAttentionLevel(student);

                return (
                  <article key={student.id} className="teacher-student-row">
                    <div className="teacher-student-row__identity">
                      <div>
                        <strong>{student.name}</strong>
                        <p className="teacher-analysis-card__meta">
                          {student.className} · 学号 {student.studentNo ?? "--"}
                        </p>
                      </div>
                    </div>

                    <div className="teacher-student-row__metrics">
                      <span className="surface-tag">三关 {student.completedLevels} / 3</span>
                      <span className="surface-tag">
                        考试 {student.score ?? student.examStatus}
                      </span>
                      <span className="surface-tag">最近学习 {student.lastActiveAt}</span>
                    </div>

                    <p
                      className="teacher-student-row__weakspot compact-copy compact-copy--two-line"
                      title={student.weakSpot}
                    >
                      {student.weakSpot}
                    </p>

                    <div className="teacher-student-row__actions">
                      <span className={`teacher-attention-pill teacher-attention-pill--${attentionLevel}`}>
                        {getTeacherAttentionLabel(attentionLevel)}
                      </span>
                      <Link
                        className="ghost-button link-button teacher-student-row__action-link"
                        to={`/teacher/students/${student.id}`}
                      >
                        查看学生详情
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            <PaginationControls
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              label={`共 ${filteredStudents.length} 名学生`}
            />
          </>
        ) : (
          <article className="empty-state-card empty-state-card--compact">
            <strong>当前没有符合条件的学生</strong>
            <p>可以调整筛选条件，或等待教师端数据同步后再查看。</p>
          </article>
        )}
      </section>
    </div>
  );
}
