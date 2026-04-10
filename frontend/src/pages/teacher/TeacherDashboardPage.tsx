import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { DataWorkbench } from "../../components/DataWorkbench";
import { EmptyState } from "../../components/EmptyState";
import { InsightList } from "../../components/InsightList";
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

export function TeacherDashboardPage() {
  const { state } = useAppState();
  const canUseApi = Boolean(state.authToken);
  const { data, error, isLoading } = useApiResource({
    enabled: canUseApi,
    fallbackData: fallbackDashboard,
    fetcher: () => fetchTeacherDashboard(state.authToken ?? ""),
    dependencies: [state.authToken],
    fallbackMessage: "教师端总览暂时无法同步，请稍后重试。",
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
  const filteredClassSummaries = selectedClass ? [selectedClass] : data.classSummaries;
  const completedAll = filteredStudents.filter((student) => student.completedLevels === 3).length;
  const examCompleted = filteredStudents.filter((student) => student.score !== null).length;
  const urgentCount = filteredStudents.filter(
    (student) => getTeacherAttentionLevel(student) === "urgent",
  ).length;
  const attentionWeight = {
    urgent: 0,
    watch: 1,
    stable: 2,
  } as const;
  const attentionStudents = filteredStudents
    .slice()
    .sort((left, right) => {
      const leftLevel = getTeacherAttentionLevel(left);
      const rightLevel = getTeacherAttentionLevel(right);
      return attentionWeight[leftLevel] - attentionWeight[rightLevel];
    })
    .slice(0, 4);
  const dashboardActions = buildTeacherDashboardActions(
    filteredStudents,
    filteredClassSummaries,
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

  const classRiskSummary = useMemo(() => {
    if (filteredClassSummaries.length === 0) {
      return null;
    }

    return filteredClassSummaries
      .slice()
      .sort((left, right) => left.completedRate - right.completedRate)[0];
  }, [filteredClassSummaries]);

  const insightItems = dashboardActions.map((item) => ({
    title: item.title,
    detail: item.detail,
  }));

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="教师工作台"
        title="先看班级整体，再决定今天优先跟进谁"
        description="把班级进度、考试完成度、风险学生和建议动作放进同一块工作台，减少来回切页和重复判断。"
        tone="teacher"
        stats={[
          { label: "当前查看", value: classLabel },
          { label: "重点跟进", value: `${urgentCount} 人` },
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
          label="当前查看"
          value={classLabel}
          description="快速切换班级后，整个页面的风险判断和完成率会一起更新。"
          tone="teacher"
        />
        <MetricCard
          label="三关完成率"
          value={`${completedRate}%`}
          description="帮助你判断这批学生是否已经走完主题主链路。"
          tone="teacher"
        />
        <MetricCard
          label="考试完成率"
          value={`${examRate}%`}
          description="优先发现还没进入考试收口阶段的学生。"
          tone="teacher"
        />
        <MetricCard
          label="需优先跟进"
          value={`${urgentCount} 人`}
          description="优先处理高风险学生，缩短发现问题到课堂跟进的路径。"
          tone="teacher"
        />
      </section>

      <DataWorkbench
        eyebrow="班级概览"
        title="先看哪一个班级最需要补课和回看"
        description="用统一进度条看三关推进与考试推进，再决定今天先盯哪一班。"
        tone="teacher"
      >
        {filteredClassSummaries.length > 0 ? (
          <div className="teacher-class-overview">
            {filteredClassSummaries.map((classroom) => (
              <article key={classroom.id} className="teacher-overview-card">
                <div className="row-between">
                  <strong>{classroom.name}</strong>
                  <span className="surface-tag">{classroom.focusLabel}</span>
                </div>
                <div className="teacher-progress-pair">
                  <div>
                    <span>三关完成</span>
                    <strong>{classroom.completedRate}%</strong>
                  </div>
                  <div>
                    <span>考试完成</span>
                    <strong>{classroom.examCompletionRate}%</strong>
                  </div>
                </div>
                <div className="bar-item__track">
                  <span
                    className="bar-item__fill"
                    style={{ width: `${classroom.completedRate}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="当前还没有班级概览数据"
            description="等班级统计同步完成后，这里会自动汇总完成率、考试状态和风险提示。"
          />
        )}
      </DataWorkbench>

      <section className="card-grid card-grid--two">
        <DataWorkbench
          eyebrow="异常提醒"
          title="这些学生值得你先打开详情"
          tone="teacher"
        >
          {attentionStudents.length > 0 ? (
            <div className="teacher-attention-grid">
              {attentionStudents.map((student) => {
                const attentionLevel = getTeacherAttentionLevel(student);

                return (
                  <article
                    key={student.id}
                    className="teacher-analysis-card teacher-analysis-card--compact"
                  >
                    <div className="row-between">
                      <div>
                        <strong>{student.name}</strong>
                        <p className="teacher-analysis-card__meta">{student.className}</p>
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
                    <div className="row-between">
                      <span className="inline-note">
                        三关 {student.completedLevels} / 3 · 考试 {student.examStatus}
                      </span>
                      <Link
                        className="ghost-button link-button"
                        to={`/teacher/students/${student.id}`}
                      >
                        学生详情
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="当前没有异常学生"
              description="可以先查看班级趋势，或切换班级后继续观察下一批学生。"
            />
          )}
        </DataWorkbench>

        <div className="page-stack">
          <InsightList
            eyebrow="建议动作"
            title="今天最适合立刻展开的三件事"
            items={insightItems}
          />

          <DataWorkbench
            eyebrow="风险概览"
            title="最需要先补课的班级"
            tone="teacher"
          >
            {classRiskSummary ? (
              <article className="teacher-risk-panel">
                <strong>{classRiskSummary.name}</strong>
                <p>
                  {classRiskSummary.focusLabel}
                  ，建议优先围绕三关未完成和考试未完成学生安排课后复盘。
                </p>
              </article>
            ) : (
              <EmptyState
                title="暂时没有可判断的班级"
                description="等班级数据同步后，这里会自动提示你最该先补哪一班。"
              />
            )}
          </DataWorkbench>
        </div>
      </section>

      <article className="feedback-box feedback-box--compact">
        <strong>{error ? "教师端数据同步失败" : "教师端数据已从后端加载"}</strong>
        <p>
          {isLoading
            ? "正在同步教师端数据..."
            : error || "班级切换、风险列表和建议动作都会跟随真实数据自动更新。"}
        </p>
      </article>
    </div>
  );
}
