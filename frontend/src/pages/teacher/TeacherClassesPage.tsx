import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { teacherClassSummaries, teacherStudents } from "../../data/mockData";
import { fetchTeacherDashboard } from "../../services/teacher";
import { useAppState } from "../../state/AppState";
import type { TeacherClassSummary } from "../../types";
import { useApiResource } from "../../utils/useApiResource";
import { usePersistedState } from "../../utils/usePersistedState";
import {
  buildTeacherDashboardActions,
  getTeacherAttentionLabel,
} from "../../utils/teacherInsights";

interface ManagedTeacherClass extends TeacherClassSummary {
  teacherNote: string;
  isCustom?: boolean;
}

const fallbackClasses = {
  classSummaries: teacherClassSummaries,
  students: teacherStudents,
};

export function TeacherClassesPage() {
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const { data, error, isLoading, source } = useApiResource({
    enabled: canUseApi,
    fallbackData: fallbackClasses,
    fetcher: () => fetchTeacherDashboard(state.authToken ?? ""),
    dependencies: [state.authToken],
  });
  const [managedClasses, setManagedClasses] = usePersistedState<ManagedTeacherClass[]>(
    "teacher-managed-classes",
    [],
  );
  const [selectedClassId, setSelectedClassId] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftStudentCount, setDraftStudentCount] = useState("30");
  const [draftFocusLabel, setDraftFocusLabel] = useState("");

  useEffect(() => {
    setManagedClasses((current) => {
      const currentById = new Map(current.map((item) => [item.id, item]));
      const mergedSource = data.classSummaries.map((classroom) => ({
        ...classroom,
        teacherNote:
          currentById.get(classroom.id)?.teacherNote ?? "建议先围绕本班薄弱点安排一次课后复习。",
        isCustom: currentById.get(classroom.id)?.isCustom ?? false,
      }));
      const customClasses = current.filter(
        (item) => item.isCustom && !data.classSummaries.some((classroom) => classroom.id === item.id),
      );
      const next = [...mergedSource, ...customClasses];

      return JSON.stringify(next) === JSON.stringify(current) ? current : next;
    });
  }, [data.classSummaries, setManagedClasses]);

  useEffect(() => {
    if (managedClasses.length === 0) {
      setSelectedClassId("");
      return;
    }

    setSelectedClassId((current) =>
      current && managedClasses.some((item) => item.id === current)
        ? current
        : managedClasses[0]?.id ?? "",
    );
  }, [managedClasses]);

  const totalStudents = managedClasses.reduce(
    (count, classroom) => count + classroom.studentCount,
    0,
  );
  const averageCompletion =
    managedClasses.length > 0
      ? Math.round(
          managedClasses.reduce((sum, classroom) => sum + classroom.completedRate, 0) /
            managedClasses.length,
        )
      : 0;
  const priorityClass =
    managedClasses
      .slice()
      .sort((left, right) => left.completedRate - right.completedRate)[0] ?? null;
  const dashboardActions = buildTeacherDashboardActions(data.students, data.classSummaries);
  const selectedClass =
    managedClasses.find((item) => item.id === selectedClassId) ?? managedClasses[0] ?? null;
  const selectedClassStudents = selectedClass
    ? data.students.filter((student) => student.className === selectedClass.name)
    : [];

  function getClassAttentionLevel(completedRate: number, examCompletionRate: number) {
    if (completedRate < 70 || examCompletionRate < 50) {
      return "urgent";
    }

    if (completedRate < 80 || examCompletionRate < 60) {
      return "watch";
    }

    return "stable";
  }

  function updateManagedClass<K extends keyof ManagedTeacherClass>(
    id: string,
    field: K,
    value: ManagedTeacherClass[K],
  ) {
    setManagedClasses((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }

  function createClass() {
    const trimmedName = draftName.trim();
    const trimmedFocus = draftFocusLabel.trim();

    if (!trimmedName || !trimmedFocus) {
      return;
    }

    const nextClass: ManagedTeacherClass = {
      id: `custom-class-${Date.now()}`,
      name: trimmedName,
      studentCount: Math.max(1, Number(draftStudentCount) || 1),
      completedRate: 0,
      examCompletionRate: 0,
      focusLabel: trimmedFocus,
      teacherNote: "新建班级，请补充真实学生名单与学习统计后继续管理。",
      isCustom: true,
    };

    setManagedClasses((current) => [...current, nextClass]);
    setSelectedClassId(nextClass.id);
    setDraftName("");
    setDraftStudentCount("30");
    setDraftFocusLabel("");
    setShowCreateDialog(false);
  }

  function removeCustomClass(id: string) {
    setManagedClasses((current) => current.filter((item) => item.id !== id));
  }

  const attentionLevel = selectedClass
    ? getClassAttentionLevel(selectedClass.completedRate, selectedClass.examCompletionRate)
    : "stable";

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--teacher">
        <div>
          <span className="hero-banner__eyebrow">班级创建与管理</span>
          <h1>维护班级列表、调整关注重点并查看班级学习闭环</h1>
          <p>这里汇总班级完成率、考试完成率和当前最需要关注的教学风险，并补上前端可演示的班级创建与管理流程。</p>
        </div>
        <div className="hero-banner__actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => setShowCreateDialog(true)}
          >
            创建班级
          </button>
          <Link className="ghost-button link-button" to="/teacher/students">
            查看学生列表
          </Link>
        </div>
      </section>

      <article className="feedback-box">
        <strong>{source === "api" ? "班级数据来自后端" : "班级数据来自本地 mock"}</strong>
        <p>
          {isLoading
            ? "正在同步班级概览..."
            : error || "班级管理页已经预留真实接口读取能力，创建和编辑流程当前先保存到本地工作台。"}
        </p>
      </article>

      <section className="card-grid card-grid--four">
        <article className="surface-card stat-card">
          <span>班级数量</span>
          <strong>{managedClasses.length}</strong>
          <p>当前教师账号下可管理的班级范围。</p>
        </article>
        <article className="surface-card stat-card">
          <span>班级总人数</span>
          <strong>{totalStudents}</strong>
          <p>以当前主题学习闭环为中心统计班级覆盖人数。</p>
        </article>
        <article className="surface-card stat-card">
          <span>平均完成率</span>
          <strong>{averageCompletion}%</strong>
          <p>帮助教师快速判断班级整体推进是否均衡。</p>
        </article>
        <article className="surface-card stat-card">
          <span>优先关注班级</span>
          <strong>{priorityClass?.name ?? "--"}</strong>
          <p>{priorityClass?.focusLabel ?? "当前暂无班级数据。"}</p>
        </article>
      </section>

      <section className="class-management-layout">
        <div className="page-stack">
          {managedClasses.length > 0 ? (
            managedClasses.map((classroom) => {
              const classAttentionLevel = getClassAttentionLevel(
                classroom.completedRate,
                classroom.examCompletionRate,
              );

              return (
                <button
                  key={classroom.id}
                  type="button"
                  className={
                    classroom.id === selectedClass?.id
                      ? "management-list-card management-list-card--active"
                      : "management-list-card"
                  }
                  onClick={() => setSelectedClassId(classroom.id)}
                >
                  <div className="row-between">
                    <div>
                      <strong>{classroom.name}</strong>
                      <p className="management-list-card__meta">
                        {classroom.studentCount} 人 · 三关 {classroom.completedRate}% · 考试{" "}
                        {classroom.examCompletionRate}%
                      </p>
                    </div>
                    <span
                      className={`teacher-attention-pill teacher-attention-pill--${classAttentionLevel}`}
                    >
                      {getTeacherAttentionLabel(classAttentionLevel)}
                    </span>
                  </div>
                  <p>{classroom.focusLabel}</p>
                </button>
              );
            })
          ) : (
            <article className="surface-card empty-state-card">
              <strong>当前没有班级概览</strong>
              <p>等待后端返回班级数据，或先创建一个本地演示班级。</p>
            </article>
          )}
        </div>

        {selectedClass ? (
          <div className="page-stack">
            <article className="surface-card editor-panel">
              <span className="section-block__eyebrow">班级管理面板</span>
              <h2>{selectedClass.name}</h2>
              <div className="chip-row">
                <span className={`teacher-attention-pill teacher-attention-pill--${attentionLevel}`}>
                  {getTeacherAttentionLabel(attentionLevel)}
                </span>
                <span className="surface-tag">
                  {selectedClass.isCustom ? "本地新建班级" : "同步班级"}
                </span>
              </div>

              <div className="editor-grid">
                <label className="form-field">
                  <span>班级名称</span>
                  <input
                    value={selectedClass.name}
                    onChange={(event) =>
                      updateManagedClass(selectedClass.id, "name", event.target.value)
                    }
                  />
                </label>

                <label className="form-field">
                  <span>班级人数</span>
                  <input
                    type="number"
                    value={selectedClass.studentCount}
                    onChange={(event) =>
                      updateManagedClass(
                        selectedClass.id,
                        "studentCount",
                        Math.max(1, Number(event.target.value) || 1),
                      )
                    }
                  />
                </label>

                <label className="form-field">
                  <span>三关完成率</span>
                  <input
                    type="number"
                    value={selectedClass.completedRate}
                    onChange={(event) =>
                      updateManagedClass(
                        selectedClass.id,
                        "completedRate",
                        Math.max(0, Math.min(100, Number(event.target.value) || 0)),
                      )
                    }
                  />
                </label>

                <label className="form-field">
                  <span>考试完成率</span>
                  <input
                    type="number"
                    value={selectedClass.examCompletionRate}
                    onChange={(event) =>
                      updateManagedClass(
                        selectedClass.id,
                        "examCompletionRate",
                        Math.max(0, Math.min(100, Number(event.target.value) || 0)),
                      )
                    }
                  />
                </label>

                <label className="form-field form-field--wide">
                  <span>当前关注重点</span>
                  <textarea
                    rows={3}
                    value={selectedClass.focusLabel}
                    onChange={(event) =>
                      updateManagedClass(selectedClass.id, "focusLabel", event.target.value)
                    }
                  />
                </label>

                <label className="form-field form-field--wide">
                  <span>教师管理备注</span>
                  <textarea
                    rows={4}
                    value={selectedClass.teacherNote}
                    onChange={(event) =>
                      updateManagedClass(selectedClass.id, "teacherNote", event.target.value)
                    }
                  />
                </label>
              </div>

              <div className="button-row">
                {selectedClass.isCustom ? (
                  <button
                    type="button"
                    className="ghost-button danger-button"
                    onClick={() => removeCustomClass(selectedClass.id)}
                  >
                    删除本地班级
                  </button>
                ) : null}
                <span className="inline-note">本页修改会自动保存到本地班级管理草稿。</span>
              </div>
            </article>

            <section className="card-grid card-grid--two">
              <article className="surface-card admin-preview-card">
                <span className="section-block__eyebrow">班级概览</span>
                <ul className="plain-list">
                  <li>班级人数：{selectedClass.studentCount}</li>
                  <li>三关完成率：{selectedClass.completedRate}%</li>
                  <li>考试完成率：{selectedClass.examCompletionRate}%</li>
                  <li>当前关注：{selectedClass.focusLabel}</li>
                </ul>
              </article>

              <article className="surface-card admin-preview-card">
                <span className="section-block__eyebrow">班级内学生</span>
                {selectedClassStudents.length > 0 ? (
                  <ul className="plain-list">
                    {selectedClassStudents.map((student) => (
                      <li key={student.id}>
                        {student.name} · 三关 {student.completedLevels} / 3 · 考试 {student.examStatus}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>当前班级还没有同步到学生数据，适合先作为创建与管理演示用班级。</p>
                )}
              </article>
            </section>
          </div>
        ) : (
          <article className="surface-card empty-state-card">
            <strong>请选择一个班级</strong>
            <p>左侧选中班级后，就可以在这里继续维护统计、关注重点和教师备注。</p>
          </article>
        )}
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">教师操作建议</span>
            <h2>当前最适合直接展开的三件事</h2>
          </div>
        </div>
        <div className="card-grid card-grid--three">
          {dashboardActions.map((item) => (
            <article key={item.id} className="teacher-action-card">
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      {showCreateDialog ? (
        <section className="overlay-modal-backdrop">
          <article className="surface-card overlay-modal">
            <span className="section-block__eyebrow">创建班级</span>
            <h2>先补一个可演示的班级管理入口</h2>
            <div className="editor-grid">
              <label className="form-field">
                <span>班级名称</span>
                <input value={draftName} onChange={(event) => setDraftName(event.target.value)} />
              </label>
              <label className="form-field">
                <span>班级人数</span>
                <input
                  type="number"
                  value={draftStudentCount}
                  onChange={(event) => setDraftStudentCount(event.target.value)}
                />
              </label>
              <label className="form-field form-field--wide">
                <span>初始关注重点</span>
                <textarea
                  rows={3}
                  value={draftFocusLabel}
                  onChange={(event) => setDraftFocusLabel(event.target.value)}
                />
              </label>
            </div>
            <div className="button-row">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setShowCreateDialog(false)}
              >
                取消
              </button>
              <button type="button" className="primary-button" onClick={createClass}>
                创建班级
              </button>
            </div>
          </article>
        </section>
      ) : null}
    </div>
  );
}
