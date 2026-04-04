import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { teacherClassSummaries, teacherStudents } from "../../data/mockData";
import {
  createTeacherClass,
  fetchTeacherClasses,
  fetchTeacherDashboard,
  updateTeacherClass,
} from "../../services/teacher";
import { useAppState } from "../../state/AppState";
import type { TeacherClassManagementItem, TeacherStudentSummary } from "../../types";
import { getTeacherAttentionLabel } from "../../utils/teacherInsights";

const fallbackClasses: TeacherClassManagementItem[] = teacherClassSummaries.map((item) => ({
  ...item,
  description: `${item.name} 当前重点：${item.focusLabel}`,
  createdAt: new Date().toISOString(),
}));

export function TeacherClassesPage() {
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const [classes, setClasses] = useState<TeacherClassManagementItem[]>(fallbackClasses);
  const [students, setStudents] = useState<TeacherStudentSummary[]>(teacherStudents);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(canUseApi);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");

  useEffect(() => {
    if (classes.length === 0) {
      setSelectedClassId("");
      return;
    }

    setSelectedClassId((current) =>
      current && classes.some((item) => item.id === current) ? current : classes[0]?.id ?? "",
    );
  }, [classes]);

  useEffect(() => {
    let cancelled = false;

    async function loadTeacherClasses() {
      if (!canUseApi || !state.authToken) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const [nextClasses, dashboard] = await Promise.all([
          fetchTeacherClasses(state.authToken),
          fetchTeacherDashboard(state.authToken),
        ]);

        if (!cancelled) {
          setClasses(nextClasses);
          setStudents(dashboard.students);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "班级数据暂时无法更新，当前展示示例内容。",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadTeacherClasses();

    return () => {
      cancelled = true;
    };
  }, [canUseApi, state.authToken]);

  const selectedClass = classes.find((item) => item.id === selectedClassId) ?? classes[0] ?? null;
  const selectedClassStudents = selectedClass
    ? students.filter((student) => student.className === selectedClass.name)
    : [];

  const totalStudents = classes.reduce((count, classroom) => count + classroom.studentCount, 0);
  const averageCompletion =
    classes.length > 0
      ? Math.round(classes.reduce((sum, classroom) => sum + classroom.completedRate, 0) / classes.length)
      : 0;
  const priorityClass = useMemo(
    () => classes.slice().sort((left, right) => left.completedRate - right.completedRate)[0] ?? null,
    [classes],
  );

  function getClassAttentionLevel(completedRate: number, examCompletionRate: number) {
    if (completedRate < 70 || examCompletionRate < 50) {
      return "urgent";
    }

    if (completedRate < 80 || examCompletionRate < 60) {
      return "watch";
    }

    return "stable";
  }

  async function handleCreateClass() {
    const trimmedName = draftName.trim();
    const trimmedDescription = draftDescription.trim();

    if (!trimmedName) {
      setError("班级名称不能为空。");
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      if (canUseApi && state.authToken) {
        const created = await createTeacherClass(state.authToken, {
          name: trimmedName,
          description: trimmedDescription,
        });
        const [nextClasses, dashboard] = await Promise.all([
          fetchTeacherClasses(state.authToken),
          fetchTeacherDashboard(state.authToken),
        ]);
        setClasses(nextClasses);
        setStudents(dashboard.students);
        setSelectedClassId(created.id);
      } else {
        const nextClass: TeacherClassManagementItem = {
          id: `custom-class-${Date.now()}`,
          name: trimmedName,
          description: trimmedDescription,
          createdAt: new Date().toISOString(),
          studentCount: 0,
          completedRate: 0,
          examCompletionRate: 0,
          focusLabel: "新建班级待同步真实学生数据",
        };
        setClasses((current) => [...current, nextClass]);
        setSelectedClassId(nextClass.id);
      }

      setDraftName("");
      setDraftDescription("");
      setShowCreateDialog(false);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "班级创建失败，请稍后重试。",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveSelectedClass() {
    if (!selectedClass) {
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      if (canUseApi && state.authToken) {
        await updateTeacherClass(state.authToken, selectedClass.id, {
          name: selectedClass.name,
          description: selectedClass.description,
        });
        const [nextClasses, dashboard] = await Promise.all([
          fetchTeacherClasses(state.authToken),
          fetchTeacherDashboard(state.authToken),
        ]);
        setClasses(nextClasses);
        setStudents(dashboard.students);
      } else {
        setClasses((current) => [...current]);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "班级保存失败，请稍后重试。",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function updateSelectedClass(field: "name" | "description", value: string) {
    setClasses((current) =>
      current.map((item) => (item.id === selectedClassId ? { ...item, [field]: value } : item)),
    );
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--teacher">
        <div>
          <span className="hero-banner__eyebrow">班级创建与管理</span>
          <h1>维护班级列表、调整关注重点并查看班级学习闭环</h1>
          <p>这里汇总班级完成率、考试完成率和当前最需要关注的教学风险，并提供完整的班级创建与管理入口。</p>
        </div>
        <div className="hero-banner__actions">
          <button type="button" className="primary-button" onClick={() => setShowCreateDialog(true)}>
            创建班级
          </button>
          <Link className="ghost-button link-button" to="/teacher/students">
            查看学生列表
          </Link>
        </div>
      </section>

      <article className="feedback-box">
        <strong>{canUseApi ? "班级数据已同步更新" : "班级数据当前展示示例内容"}</strong>
        <p>{isLoading ? "正在同步班级概览..." : error || "你可以在这里继续查看班级表现、重点关注项和班级说明。"}</p>
      </article>

      <section className="card-grid card-grid--four">
        <article className="surface-card stat-card">
          <span>班级数量</span>
          <strong>{classes.length}</strong>
          <p>当前教师账号下可管理的班级范围。</p>
        </article>
        <article className="surface-card stat-card">
          <span>班级总人数</span>
          <strong>{totalStudents}</strong>
          <p>围绕当前主题学习闭环统计班级覆盖人数。</p>
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
          {classes.map((classroom) => {
            const attentionLevel = getClassAttentionLevel(
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
                      {classroom.studentCount} 人 · 三关 {classroom.completedRate}% · 考试 {classroom.examCompletionRate}%
                    </p>
                  </div>
                  <span className={`teacher-attention-pill teacher-attention-pill--${attentionLevel}`}>
                    {getTeacherAttentionLabel(attentionLevel)}
                  </span>
                </div>
                <p>{classroom.focusLabel}</p>
              </button>
            );
          })}
        </div>

        <article className="surface-card management-detail-card">
          {selectedClass ? (
            <div className="page-stack">
              <div className="row-between">
                <div>
                  <span className="section-block__eyebrow">班级详情</span>
                  <h2>{selectedClass.name}</h2>
                </div>
                <span className="surface-tag">{selectedClass.focusLabel}</span>
              </div>

              <label className="field-group">
                <span className="field-label">班级名称</span>
                <input
                  className="text-input"
                  value={selectedClass.name}
                  onChange={(event) => updateSelectedClass("name", event.target.value)}
                />
              </label>

              <label className="field-group">
                <span className="field-label">班级说明</span>
                <textarea
                  className="text-area"
                  value={selectedClass.description}
                  onChange={(event) => updateSelectedClass("description", event.target.value)}
                  rows={4}
                />
              </label>

              <div className="card-grid card-grid--three">
                <article className="surface-card stat-card">
                  <span>学生人数</span>
                  <strong>{selectedClass.studentCount}</strong>
                </article>
                <article className="surface-card stat-card">
                  <span>三关完成率</span>
                  <strong>{selectedClass.completedRate}%</strong>
                </article>
                <article className="surface-card stat-card">
                  <span>考试完成率</span>
                  <strong>{selectedClass.examCompletionRate}%</strong>
                </article>
              </div>

              <article className="surface-card">
                <span className="section-block__eyebrow">班级学生预览</span>
                <div className="page-stack page-stack--compact">
                  {selectedClassStudents.length > 0 ? (
                    selectedClassStudents.slice(0, 5).map((student) => (
                      <article key={student.id} className="teacher-analysis-card">
                        <div className="row-between">
                          <div>
                            <strong>{student.name}</strong>
                            <p>{student.weakSpot}</p>
                          </div>
                          <Link className="ghost-button link-button" to={`/teacher/students/${student.id}`}>
                            查看详情
                          </Link>
                        </div>
                      </article>
                    ))
                  ) : (
                    <article className="feedback-box">
                      <strong>当前没有班级学生预览</strong>
                      <p>接入真实班级后，这里会自动展示本班学生的当前学习状态。</p>
                    </article>
                  )}
                </div>
              </article>

              <div className="button-row">
                <button type="button" className="primary-button" onClick={() => void handleSaveSelectedClass()} disabled={isSaving}>
                  {isSaving ? "保存中..." : "保存班级信息"}
                </button>
                <Link className="ghost-button link-button" to="/teacher/students">
                  查看完整学生列表
                </Link>
              </div>
            </div>
          ) : (
            <section className="empty-state-card">
              <h2>当前还没有班级</h2>
            </section>
          )}
        </article>
      </section>

      {showCreateDialog ? (
        <section className="overlay-modal-backdrop">
          <article className="surface-card overlay-modal">
            <span className="section-block__eyebrow">新建班级</span>
            <h2>先录入班级基础信息</h2>
            <div className="page-stack">
              <label className="field-group">
                <span className="field-label">班级名称</span>
                <input className="text-input" value={draftName} onChange={(event) => setDraftName(event.target.value)} />
              </label>
              <label className="field-group">
                <span className="field-label">班级说明</span>
                <textarea className="text-area" rows={4} value={draftDescription} onChange={(event) => setDraftDescription(event.target.value)} />
              </label>
            </div>
            <div className="button-row">
              <button type="button" className="ghost-button" onClick={() => setShowCreateDialog(false)}>
                取消
              </button>
              <button type="button" className="primary-button" onClick={() => void handleCreateClass()} disabled={isSaving}>
                {isSaving ? "创建中..." : "创建班级"}
              </button>
            </div>
          </article>
        </section>
      ) : null}
    </div>
  );
}
