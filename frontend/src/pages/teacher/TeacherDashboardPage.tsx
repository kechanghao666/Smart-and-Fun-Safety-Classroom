import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
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
  const teacherDisplayName = state.sessionAccount ?? "当前教师账号";
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

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--teacher">
        <div>
          <span className="hero-banner__eyebrow">教师首页</span>
          <h1>班级学习总览与近期关注提醒</h1>
          <p>优先展示班级学习概览、三关完成率、考试完成率和近期异常提醒。</p>
          <div className="chip-row">
            <span className="surface-tag">教师账号：{teacherDisplayName}</span>
            <span className="surface-tag">当前范围：{classLabel}</span>
          </div>
        </div>
        <div className="hero-banner__actions hero-banner__actions--stacked">
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
          <div className="button-row">
            <Link className="primary-button link-button" to="/teacher/students">
              查看学生列表
            </Link>
            <Link className="ghost-button link-button" to="/teacher/classes">
              查看班级管理
            </Link>
          </div>
        </div>
      </section>

      <article className="feedback-box">
        <strong>{error ? "教师端数据同步失败" : "教师端数据已从后端加载"}</strong>
        <p>
          {isLoading
            ? "正在同步教师端数据..."
            : error || "教师首页会根据真实后端数据更新班级总览和关注提醒。"}
        </p>
      </article>

      <section className="card-grid card-grid--four">
        <article className="surface-card stat-card">
          <span>当前查看</span>
          <strong>{classLabel}</strong>
          <p>用班级选择器快速切换范围，查看不同班级的学习推进情况。</p>
        </article>
        <article className="surface-card stat-card">
          <span>三关完成率</span>
          <strong>{completedRate}%</strong>
          <p>帮助教师快速判断学生是否已经完成主题主链路学习。</p>
        </article>
        <article className="surface-card stat-card">
          <span>考试完成率</span>
          <strong>{examRate}%</strong>
          <p>用于观察学生是否已经进入考试和结果反馈阶段。</p>
        </article>
        <article className="surface-card stat-card">
          <span>需重点跟进</span>
          <strong>{urgentCount}</strong>
          <p>优先关注尚未形成完整闭环或弱项仍较高的学生。</p>
        </article>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card">
          <span className="section-block__eyebrow">班级学习概览</span>
          <h2>先看当前班级整体推进到哪一步</h2>
          {filteredClassSummaries.length > 0 ? (
            <div className="bar-list">
              {filteredClassSummaries.map((classroom) => (
                <article key={classroom.id} className="bar-item">
                  <div className="row-between">
                    <strong>{classroom.name}</strong>
                    <span>
                      三关 {classroom.completedRate}% / 考试 {classroom.examCompletionRate}%
                    </span>
                  </div>
                  <div className="bar-item__track">
                    <span
                      className="bar-item__fill"
                      style={{ width: `${classroom.completedRate}%` }}
                    />
                  </div>
                  <p>{classroom.focusLabel}</p>
                </article>
              ))}
            </div>
          ) : (
            <article className="feedback-box empty-state-card">
              <strong>当前没有班级概览数据</strong>
              <p>等待班级统计同步完成后再继续查看。</p>
            </article>
          )}
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">近期异常提醒</span>
          <h2>这些学生值得优先查看</h2>
          {attentionStudents.length > 0 ? (
            <div className="page-stack">
              {attentionStudents.map((student) => {
                const attentionLevel = getTeacherAttentionLevel(student);

                return (
                  <article key={student.id} className="teacher-analysis-card">
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
                    <p>{student.weakSpot}</p>
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
            <article className="feedback-box empty-state-card">
              <strong>当前没有异常学生</strong>
              <p>可以先查看班级整体趋势，安排下一轮课堂复盘重点。</p>
            </article>
          )}
        </article>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card">
          <span className="section-block__eyebrow">风险概览</span>
          <h2>当前最需要补课支持的班级</h2>
          <article className="feedback-box">
            <strong>{classRiskSummary?.name ?? "暂无班级数据"}</strong>
            <p>
              {classRiskSummary
                ? `${classRiskSummary.focusLabel}，建议优先围绕三关未完成和考试未完成学生安排课后复习。`
                : "等待班级数据更新后，这里会自动汇总重点支持对象。"}
            </p>
          </article>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">教师建议动作</span>
          <h2>本轮最适合立刻展开的三件事</h2>
          <div className="card-grid card-grid--three">
            {dashboardActions.map((item) => (
              <article key={item.id} className="teacher-action-card">
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
