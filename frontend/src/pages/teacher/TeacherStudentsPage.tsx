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

type CompletionFilter = "all" | "completed" | "incomplete";

const attentionRank = {
  urgent: 0,
  watch: 1,
  stable: 2,
} as const;

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
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>("all");

  const classOptions = Array.from(new Set(data.map((student) => student.className)));
  const filteredStudents = useMemo(
    () =>
      data.filter((student) => {
        const keyword = query.trim();
        const matchesQuery =
          keyword.length === 0 ||
          student.name.includes(keyword) ||
          student.weakSpot.includes(keyword);
        const matchesClass = classFilter === "all" || student.className === classFilter;
        const matchesExam =
          examFilter === "all" ||
          (examFilter === "completed" && student.score !== null) ||
          (examFilter === "pending" && student.score === null);
        const matchesCompletion =
          completionFilter === "all" ||
          (completionFilter === "completed" && student.completedLevels === 3) ||
          (completionFilter === "incomplete" && student.completedLevels < 3);

        return matchesQuery && matchesClass && matchesExam && matchesCompletion;
      }),
    [classFilter, completionFilter, data, examFilter, query],
  );
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
        </div>
      </section>

      <article className="feedback-box">
        <strong>{source === "api" ? "学生列表已接入服务数据" : "学生列表当前使用预置数据"}</strong>
        <p>
          {isLoading
            ? "正在同步学生列表..."
            : error || "学生列表页会根据当前数据来源自动刷新筛选结果。"}
        </p>
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
          <p>优先查看高风险学生，缩短发现问题到跟进的路径。</p>
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
            onChange={(event) => setCompletionFilter(event.target.value as CompletionFilter)}
          >
            <option value="all">全部状态</option>
            <option value="completed">已完成三关</option>
            <option value="incomplete">未完成三关</option>
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

      <section className="card-grid card-grid--two">
        <article className="surface-card admin-preview-card">
          <span className="section-block__eyebrow">筛选反馈</span>
          <h2>当前教师筛选条件</h2>
          <div className="chip-row">
            <span className="surface-tag">
              关键词：{query.trim().length > 0 ? query.trim() : "未设置"}
            </span>
            <span className="surface-tag">班级：{classFilter === "all" ? "全部班级" : classFilter}</span>
            <span className="surface-tag">
              完成状态：
              {completionFilter === "all"
                ? "全部状态"
                : completionFilter === "completed"
                  ? "已完成三关"
                  : "未完成三关"}
            </span>
            <span className="surface-tag">
              考试状态：
              {examFilter === "all"
                ? "全部状态"
                : examFilter === "completed"
                  ? "已完成考试"
                  : "未完成考试"}
            </span>
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
          <span className="section-block__eyebrow">跟进建议</span>
          <h2>筛选后最值得先处理什么？</h2>
          <ul className="plain-list">
            <li>优先打开高风险学生详情页，查看错题和成长状态。</li>
            <li>对未完成三关的学生，先追踪停留在哪一关。</li>
            <li>对已完成三关但未考试的学生，优先提醒收口。</li>
          </ul>
        </article>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card admin-preview-card">
          <span className="section-block__eyebrow">优先跟进名单</span>
          <h2>把最该先看的学生排到前面</h2>
          {priorityStudents.length > 0 ? (
            <div className="page-stack page-stack--compact">
              {priorityStudents.map((student) => {
                const attentionLevel = getTeacherAttentionLevel(student);

                return (
                  <article key={`${student.id}-priority`} className="teacher-analysis-card">
                    <div className="row-between">
                      <div>
                        <strong>{student.name}</strong>
                        <p className="teacher-analysis-card__meta">
                          {student.className} · 已完成 {student.completedLevels} / 3 关
                        </p>
                      </div>
                      <span
                        className={`teacher-attention-pill teacher-attention-pill--${attentionLevel}`}
                      >
                        {getTeacherAttentionLabel(attentionLevel)}
                      </span>
                    </div>
                    <p>{student.weakSpot}</p>
                    <Link className="ghost-button link-button" to={`/teacher/students/${student.id}`}>
                      查看详情
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <p>当前筛选结果为空，暂无可跟进学生。</p>
          )}
        </article>

        <article className="surface-card admin-preview-card">
          <span className="section-block__eyebrow">课堂收口建议</span>
          <h2>结合当前列表状态安排下一次课堂提醒</h2>
          <div className="mini-stat-list">
            <div className="stat-pair">
              <strong>{fullyCompletedCount}</strong>
              <span>已完成三关</span>
            </div>
            <div className="stat-pair">
              <strong>{pendingExamCount}</strong>
              <span>待完成考试</span>
            </div>
            <div className="stat-pair">
              <strong>{urgentCount}</strong>
              <span>高风险学生</span>
            </div>
          </div>
          <ul className="plain-list">
            <li>若高风险学生较多，建议先讲解薄弱点，再安排分组复盘。</li>
            <li>若待考试人数较多，建议把课堂收尾聚焦到考试解锁与统一提交。</li>
            <li>若已完成三关人数较多，可直接引导进入结果页和错题回看。</li>
          </ul>
        </article>
      </section>

      <section className="surface-card">
        {filteredStudents.length > 0 ? (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>学生</th>
                  <th>班级</th>
                  <th>完成状态</th>
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
                      <td>{student.completedLevels === 3 ? "已完成三关" : `${student.completedLevels} / 3`}</td>
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
