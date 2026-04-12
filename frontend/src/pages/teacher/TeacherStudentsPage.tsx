import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DataWorkbench } from "../../components/DataWorkbench";
import { EmptyState } from "../../components/EmptyState";
import { MetricCard } from "../../components/MetricCard";
import { PageHero } from "../../components/PageHero";
import { PaginationControls } from "../../components/PaginationControls";
import {
  fetchTeacherClasses,
  fetchTeacherStudents,
  type TeacherClassFilters,
} from "../../services/teacher";
import { useAppState } from "../../state/AppState";
import type { TeacherClassManagementItem, TeacherStudentSummary } from "../../types";
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
  const [classes, setClasses] = useState<TeacherClassManagementItem[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(canUseApi);
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [examFilter, setExamFilter] = useState<ExamFilter>("all");
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    if (!canUseApi || !state.authToken) {
      setClasses([]);
      return;
    }

    let cancelled = false;

    async function loadClasses() {
      try {
        const result = await fetchTeacherClasses(state.authToken ?? "", {
          page: 1,
          pageSize: 200,
        } satisfies TeacherClassFilters);

        if (!cancelled) {
          setClasses(result.items);
        }
      } catch {
        if (!cancelled) {
          setClasses([]);
        }
      }
    }

    void loadClasses();

    return () => {
      cancelled = true;
    };
  }, [canUseApi, state.authToken]);

  useEffect(() => {
    setPage(1);
  }, [query, classFilter, examFilter, completionFilter]);

  useEffect(() => {
    let cancelled = false;

    async function loadStudents() {
      if (!canUseApi || !state.authToken) {
        setStudents([]);
        setTotalPages(1);
        setTotalStudents(0);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const result = await fetchTeacherStudents(state.authToken, {
          query,
          className: classFilter,
          completionStatus: completionFilter,
          examStatus: examFilter,
          page,
          pageSize: STUDENTS_PER_PAGE,
        });

        if (!cancelled) {
          setStudents(result.items);
          setTotalPages(result.totalPages);
          setTotalStudents(result.total);
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
  }, [
    canUseApi,
    classFilter,
    completionFilter,
    examFilter,
    page,
    query,
    state.authToken,
  ]);

  const classOptions = useMemo(
    () => classes.map((item) => item.name),
    [classes],
  );
  const urgentCount = students.filter(
    (student) => getTeacherAttentionLevel(student) === "urgent",
  ).length;
  const pendingExamCount = students.filter((student) => student.score === null).length;
  const fullyCompletedCount = students.filter(
    (student) => student.completedLevels === 3,
  ).length;
  const priorityStudents = students
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
      <PageHero
        eyebrow="学生总览"
        title="先筛出要关注的人，再决定点开谁"
        description="搜索、班级、三关完成状态和考试状态放在同一层，先缩小范围，再进入学生详情处理具体问题。"
        tone="teacher"
        stats={[
          { label: "当前筛出", value: `${totalStudents} 人` },
          { label: "本页优先跟进", value: `${urgentCount} 人` },
          { label: "本页待考试", value: `${pendingExamCount} 人` },
        ]}
      />

      <section className="card-grid card-grid--three">
        <MetricCard
          label="当前筛出"
          value={`${totalStudents}`}
          description="按照当前筛选条件命中的学生总数。"
          tone="teacher"
        />
        <MetricCard
          label="本页三关已完成"
          value={`${fullyCompletedCount}`}
          description="帮助你快速看出本页哪些学生已经走完主题主链路。"
          tone="teacher"
        />
        <MetricCard
          label="本页待考试"
          value={`${pendingExamCount}`}
          description="优先发现还没进入考试收口阶段的学生。"
          tone="teacher"
        />
      </section>

      <DataWorkbench
        eyebrow="筛选台"
        title="用四个条件快速收紧范围"
        description="搜索支持姓名、学号和薄弱点；班级选项独立加载，不会因为当前筛选结果自己缩窄。"
        tone="teacher"
        toolbar={
          hasFilters ? (
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
          ) : null
        }
      >
        <section className="surface-card filter-bar filter-bar--teacher">
          <label className="form-field">
            <span>搜索学生</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索姓名、学号或薄弱点"
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
      </DataWorkbench>

      <section className="teacher-students-sections">
        <DataWorkbench
          eyebrow="优先名单"
          title="这三位建议先看"
          tone="teacher"
        >
          {priorityStudents.length > 0 ? (
            <div className="teacher-attention-grid">
              {priorityStudents.map((student) => {
                const attentionLevel = getTeacherAttentionLevel(student);

                return (
                  <article
                    key={student.id}
                    className="teacher-analysis-card teacher-analysis-card--compact"
                  >
                    <div className="row-between">
                      <div>
                        <strong>{student.name}</strong>
                        <p className="teacher-analysis-card__meta">
                          {student.className} · 学号 {student.studentNo ?? "--"}
                        </p>
                      </div>
                      <span
                        className={`teacher-attention-pill teacher-attention-pill--${attentionLevel}`}
                      >
                        {getTeacherAttentionLabel(attentionLevel)}
                      </span>
                    </div>
                    <p className="compact-copy compact-copy--two-line" title={student.weakSpot}>
                      {student.weakSpot}
                    </p>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="当前没有需要优先跟进的学生"
              description="可以先调整筛选条件，或者查看本页学生详情。"
            />
          )}
        </DataWorkbench>

        <DataWorkbench
          eyebrow="列表总览"
          title="固定密度查看当前结果"
          tone="teacher"
        >
          {students.length > 0 ? (
            <>
              <div className="teacher-student-list">
                {students.map((student) => {
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

                      <div className="teacher-student-row__main">
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
                      </div>

                      <div className="teacher-student-row__actions">
                        <span
                          className={`teacher-attention-pill teacher-attention-pill--${attentionLevel}`}
                        >
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
                label={`共 ${totalStudents} 名学生`}
              />
            </>
          ) : (
            <EmptyState
              title="当前没有符合条件的学生"
              description="可以调整筛选条件，或等待教师端数据同步后再查看。"
            />
          )}
        </DataWorkbench>
      </section>

      <article className="feedback-box feedback-box--compact">
        <strong>{error ? "学生列表同步失败" : "学生列表已从后端加载"}</strong>
        <p>
          {isLoading
            ? "正在同步学生列表..."
            : error || "筛选条件、优先名单和学生列表都会跟随后端分页结果自动更新。"}
        </p>
      </article>
    </div>
  );
}
