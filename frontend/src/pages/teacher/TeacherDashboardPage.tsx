import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { DataWorkbench } from "../../components/DataWorkbench";
import { EmptyState } from "../../components/EmptyState";
import { MetricCard } from "../../components/MetricCard";
import { PageHero } from "../../components/PageHero";
import {
  fetchTeacherDashboard,
  type TeacherDashboardResponse,
} from "../../services/teacher";
import { useAppState } from "../../state/AppState";
import { useApiResource } from "../../utils/useApiResource";
import { usePersistedState } from "../../utils/usePersistedState";
import {
  buildTeacherDashboardActions,
  getTeacherAttentionLabel,
  getTeacherAttentionLevel,
} from "../../utils/teacherInsights";

const fallbackDashboard: TeacherDashboardResponse = {
  classSummaries: [],
  students: [],
};

function looksCorruptedText(value: string | null | undefined) {
  if (!value) {
    return true;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }

  return /^\?+$/.test(trimmed) || /\?{2,}/.test(trimmed);
}

function getReadableClassName(value: string | null | undefined) {
  if (looksCorruptedText(value)) {
    return "待补充班级";
  }

  return (value ?? "").trim();
}

function getReadableFocusLabel(value: string | null | undefined) {
  if (looksCorruptedText(value)) {
    return "当前暂无清晰的班级跟进摘要，请先进入班级概览补充班级说明。";
  }

  return (value ?? "").trim();
}

export function TeacherDashboardPage() {
  const { state } = useAppState();
  const canUseApi = Boolean(state.authToken);
  const { data, error, isLoading } = useApiResource({
    enabled: canUseApi,
    fallbackData: fallbackDashboard,
    fetcher: () => fetchTeacherDashboard(state.authToken ?? ""),
    dependencies: [state.authToken],
    fallbackMessage: "教师总览暂时无法同步，请稍后再试。",
  });
  const [selectedClassId, setSelectedClassId] = usePersistedState<string>(
    "teacher-dashboard-current-class",
    "all",
  );

  useEffect(() => {
    if (
      selectedClassId !== "all" &&
      !data.classSummaries.some((classroom) => classroom.id === selectedClassId)
    ) {
      setSelectedClassId("all");
    }
  }, [data.classSummaries, selectedClassId, setSelectedClassId]);

  const selectedClass =
    selectedClassId === "all"
      ? null
      : data.classSummaries.find((classroom) => classroom.id === selectedClassId) ?? null;
  const filteredStudents = selectedClass
    ? data.students.filter((student) => student.className === selectedClass.name)
    : data.students;
  const filteredClasses = selectedClass ? [selectedClass] : data.classSummaries;
  const completedAll = filteredStudents.filter((student) => student.completedLevels === 3).length;
  const examCompleted = filteredStudents.filter((student) => student.score !== null).length;
  const urgentStudents = filteredStudents.filter(
    (student) => getTeacherAttentionLevel(student) === "urgent",
  );
  const priorityStudents = filteredStudents
    .slice()
    .sort((left, right) => {
      const leftRank = getTeacherAttentionLevel(left) === "urgent" ? 0 : 1;
      const rightRank = getTeacherAttentionLevel(right) === "urgent" ? 0 : 1;
      return leftRank - rightRank || left.completedLevels - right.completedLevels;
    })
    .slice(0, 4);
  const dashboardActions = buildTeacherDashboardActions(filteredStudents, filteredClasses).slice(
    0,
    3,
  );
  const teacherDisplayName = state.sessionAccount ?? "当前教师";
  const classLabel = selectedClass ? selectedClass.name : "全部班级";
  const completedRate =
    filteredStudents.length > 0
      ? Math.round((completedAll / filteredStudents.length) * 100)
      : 0;
  const examRate =
    filteredStudents.length > 0
      ? Math.round((examCompleted / filteredStudents.length) * 100)
      : 0;
  const weakestClass =
    filteredClasses
      .slice()
      .sort((left, right) => left.completedRate - right.completedRate)[0] ?? null;
  const bestClass =
    filteredClasses
      .slice()
      .sort((left, right) => right.completedRate - left.completedRate)[0] ?? null;
  const weakestClassName = getReadableClassName(weakestClass?.name);
  const weakestClassFocusLabel = getReadableFocusLabel(weakestClass?.focusLabel);
  const bestClassName = getReadableClassName(bestClass?.name);

  const actionCards = useMemo(
    () =>
      dashboardActions.map((item, index) => ({
        id: `${index}-${item.title}`,
        title: item.title,
        detail: item.detail,
      })),
    [dashboardActions],
  );

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="教师工作台"
        title="先看整体，再决定今天优先跟进谁"
        description="把班级进度、考试收口、优先学生和建议动作收成同一块工作台，老师不用在多个页面里重复判断。"
        tone="teacher"
        stats={[
          { label: "当前查看", value: classLabel },
          { label: "需立即跟进", value: `${urgentStudents.length} 人` },
          { label: "教师账号", value: teacherDisplayName },
        ]}
        actions={
          <>
            <Link className="primary-button link-button" to="/teacher/students">
              进入学生列表
            </Link>
            <Link className="ghost-button link-button" to="/teacher/classes">
              打开班级管理
            </Link>
          </>
        }
        aside={
          <label className="hero-select">
            <span>当前班级</span>
            <select
              value={selectedClassId}
              onChange={(event) => setSelectedClassId(event.target.value)}
            >
              <option value="all">全部班级</option>
              {data.classSummaries.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </option>
              ))}
            </select>
          </label>
        }
      />

      <section className="card-grid card-grid--four">
        <MetricCard
          label="班级完成率"
          value={`${completedRate}%`}
          description="当前视图下三关主链路的整体推进情况。"
          tone="teacher"
        />
        <MetricCard
          label="考试完成率"
          value={`${examRate}%`}
          description="用于判断这一批学生是否还卡在考试收口前。"
          tone="teacher"
        />
        <MetricCard
          label="需立即跟进"
          value={`${urgentStudents.length}`}
          description="高风险学生会优先出现在下方行动区。"
          tone="teacher"
        />
        <MetricCard
          label="当前优先班级"
          value={weakestClass ? weakestClassName : "--"}
          description={
            weakestClass
              ? weakestClassFocusLabel
              : "当前暂无班级摘要，待有学生数据后会自动显示需要优先跟进的班级。"
          }
          tone="teacher"
        />
      </section>

      <article className="feedback-box feedback-box--compact">
        <strong>{error ? "教师端数据同步失败" : "教师端数据已从后端加载"}</strong>
        <p>
          {isLoading
            ? "正在同步教师总览数据..."
            : error || "班级切换、学生风险和建议动作都会随真实数据自动更新。"}
        </p>
      </article>

      <section className="teacher-dashboard-grid">
        <DataWorkbench
          eyebrow="优先跟进"
          title="先点开这些学生"
          description="老师最需要先处理的是风险高、进度停滞或考试未收口的学生。"
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
                    <div className="teacher-student-row__metrics">
                      <span className="surface-tag">三关 {student.completedLevels}/3</span>
                      <span className="surface-tag">考试 {student.examStatus}</span>
                      <span className="surface-tag">
                        {student.score === null ? "未出成绩" : `${student.score} 分`}
                      </span>
                    </div>
                    <div className="button-row button-row--tight">
                      <Link className="ghost-button link-button" to={`/teacher/students/${student.id}`}>
                        查看详情
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="当前没有需要优先处理的学生"
              description="可以先看下方建议动作，或者切换到其它班级继续观察。"
            />
          )}
        </DataWorkbench>

        <div className="teacher-dashboard-stack">
          <DataWorkbench
            eyebrow="建议动作"
            title="今天先做这三件事"
            description="只保留最值得立刻执行的动作，不再重复展示同一类提醒。"
            tone="teacher"
          >
            <div className="page-stack page-stack--compact">
              {actionCards.map((item) => (
                <article key={item.id} className="teacher-action-card teacher-action-card--compact">
                  <strong>{item.title}</strong>
                  <p className="compact-copy compact-copy--two-line" title={item.detail}>
                    {item.detail}
                  </p>
                </article>
              ))}
            </div>
          </DataWorkbench>

          <DataWorkbench
            eyebrow="班级对比"
            title="先补哪里，先夸哪里"
            tone="teacher"
          >
            <div className="teacher-dashboard-pair">
              <article className="teacher-risk-panel">
                <strong>需补强班级</strong>
                <p>
                  {weakestClass
                    ? `${weakestClassName} 当前完成率最低，建议优先围绕三关未完成和考试未收口学生安排复盘。`
                    : "当前暂无班级统计数据。"}
                </p>
              </article>
              <article className="teacher-risk-panel teacher-risk-panel--positive">
                <strong>亮点班级</strong>
                <p>
                  {bestClass
                    ? `${bestClassName} 当前推进最快，可以作为课堂分享或同伴示范案例。`
                    : "当前暂无亮点班级数据。"}
                </p>
              </article>
            </div>
          </DataWorkbench>
        </div>
      </section>
    </div>
  );
}
