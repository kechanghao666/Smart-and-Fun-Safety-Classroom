import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  approveTeacherClassApplication,
  createTeacherClass,
  fetchTeacherClassApplications,
  fetchTeacherClasses,
  fetchTeacherDashboard,
  inviteStudentToTeacherClass,
  rejectTeacherClassApplication,
  updateTeacherClass,
} from "../../services/teacher";
import { useAppState } from "../../state/AppState";
import type {
  TeacherClassApplicationItem,
  TeacherClassManagementItem,
  TeacherStudentSummary,
} from "../../types";
import { getTeacherAttentionLabel } from "../../utils/teacherInsights";

export function TeacherClassesPage() {
  const { state } = useAppState();
  const canUseApi = Boolean(state.authToken);
  const [classes, setClasses] = useState<TeacherClassManagementItem[]>([]);
  const [students, setStudents] = useState<TeacherStudentSummary[]>([]);
  const [applications, setApplications] = useState<TeacherClassApplicationItem[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(canUseApi);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [inviteStudentNo, setInviteStudentNo] = useState("");

  async function loadAllData(preferredClassId?: string) {
    if (!canUseApi || !state.authToken) {
      setClasses([]);
      setStudents([]);
      setApplications([]);
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
      const nextSelectedId =
        preferredClassId && nextClasses.some((item) => item.id === preferredClassId)
          ? preferredClassId
          : nextClasses[0]?.id ?? "";

      setClasses(nextClasses);
      setStudents(dashboard.students);
      setSelectedClassId(nextSelectedId);

      if (nextSelectedId) {
        const pending = await fetchTeacherClassApplications(state.authToken, nextSelectedId);
        setApplications(pending);
      } else {
        setApplications([]);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "班级数据暂时无法刷新。",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAllData();
  }, [canUseApi, state.authToken]);

  useEffect(() => {
    if (!selectedClassId || !state.authToken || !canUseApi) {
      setApplications([]);
      return;
    }

    let cancelled = false;

    async function loadApplications() {
      try {
        const pending = await fetchTeacherClassApplications(state.authToken!, selectedClassId);

        if (!cancelled) {
          setApplications(pending);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "班级申请列表暂时无法刷新。",
          );
        }
      }
    }

    void loadApplications();

    return () => {
      cancelled = true;
    };
  }, [canUseApi, selectedClassId, state.authToken]);

  const selectedClass =
    classes.find((item) => item.id === selectedClassId) ?? classes[0] ?? null;
  const selectedStudents = selectedClass
    ? students.filter((student) => student.className === selectedClass.name)
    : [];
  const totalStudents = classes.reduce((count, item) => count + item.studentCount, 0);
  const totalPending = classes.reduce((count, item) => count + (item.pendingApplications ?? 0), 0);
  const priorityClass = useMemo(
    () => classes.slice().sort((left, right) => left.completedRate - right.completedRate)[0] ?? null,
    [classes],
  );

  function updateSelectedClass(field: "name" | "description", value: string) {
    setClasses((current) =>
      current.map((item) =>
        item.id === selectedClassId ? { ...item, [field]: value } : item,
      ),
    );
  }

  async function handleCreateClass() {
    const name = draftName.trim();
    const description = draftDescription.trim();

    if (!name) {
      setError("班级名称不能为空。");
      return;
    }

    if (!state.authToken) {
      setError("当前无法连接后端。");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const created = await createTeacherClass(state.authToken, { name, description });
      setDraftName("");
      setDraftDescription("");
      setShowCreateDialog(false);
      setNotice(`已创建班级 ${created.name}。`);
      await loadAllData(created.id);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "班级创建失败，请稍后重试。",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveSelectedClass() {
    if (!selectedClass || !state.authToken) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await updateTeacherClass(state.authToken, selectedClass.id, {
        name: selectedClass.name,
        description: selectedClass.description,
      });
      setNotice(`已保存 ${selectedClass.name} 的班级信息。`);
      await loadAllData(selectedClass.id);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "班级保存失败，请稍后重试。",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleInviteStudent() {
    const studentNo = inviteStudentNo.trim().toUpperCase();

    if (!studentNo || !selectedClass || !state.authToken) {
      setError("请输入学号并先选中班级。");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const membership = await inviteStudentToTeacherClass(
        state.authToken,
        selectedClass.id,
        studentNo,
      );
      setInviteStudentNo("");
      setNotice(
        `已邀请学号 ${membership.studentNo} 进入 ${membership.currentClass?.name ?? selectedClass.name}。`,
      );
      await loadAllData(selectedClass.id);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "学号邀请失败，请稍后重试。",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReviewApplication(
    applicationId: string,
    action: "approve" | "reject",
  ) {
    if (!selectedClass || !state.authToken) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const nextApplications =
        action === "approve"
          ? await approveTeacherClassApplication(
              state.authToken,
              selectedClass.id,
              applicationId,
            )
          : await rejectTeacherClassApplication(
              state.authToken,
              selectedClass.id,
              applicationId,
            );

      setApplications(nextApplications);
      setNotice(action === "approve" ? "已通过入班申请。" : "已拒绝入班申请。");
      await loadAllData(selectedClass.id);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "申请处理失败，请稍后重试。",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCopyClassCode(classCode: string) {
    try {
      await navigator.clipboard.writeText(classCode);
      setNotice(`班级号 ${classCode} 已复制。`);
    } catch {
      setNotice(`班级号 ${classCode} 可手动复制。`);
    }
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--teacher">
        <div>
          <span className="hero-banner__eyebrow">班级创建与管理</span>
          <h1>管理班级号、按学号邀请学生，并审批学生的入班申请</h1>
          <p>老师可以通过学号直接邀请学生入班，学生也可以通过班级号主动申请加入。这里会把班级、学生和申请流转统一汇总。</p>
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

      <article className="feedback-box feedback-box--compact">
        <strong>{error ? "班级管理同步失败" : "班级管理数据已从后端加载"}</strong>
        <p>{isLoading ? "正在同步班级、学生和申请列表..." : error || notice || "可以在这里维护班级信息、班级号和入班审批。"} </p>
      </article>

      <section className="card-grid card-grid--four">
        <article className="surface-card stat-card stat-card--compact">
          <span>班级数量</span>
          <strong>{classes.length}</strong>
          <p>当前教师账号下可维护的班级数量。</p>
        </article>
        <article className="surface-card stat-card stat-card--compact">
          <span>班级总人数</span>
          <strong>{totalStudents}</strong>
          <p>已经归入班级的学生人数汇总。</p>
        </article>
        <article className="surface-card stat-card stat-card--compact">
          <span>待审批申请</span>
          <strong>{totalPending}</strong>
          <p>学生通过班级号提交、等待老师审核的申请总数。</p>
        </article>
        <article className="surface-card stat-card stat-card--compact">
          <span>优先关注班级</span>
          <strong>{priorityClass?.name ?? "--"}</strong>
          <p>{priorityClass?.focusLabel ?? "当前暂无班级汇总。"} </p>
        </article>
      </section>

      <section className="class-management-layout">
        <div className="page-stack">
          {classes.map((classroom) => (
            <button
              key={classroom.id}
              type="button"
              className={
                classroom.id === selectedClass?.id
                  ? "management-list-card management-list-card--compact management-list-card--active"
                  : "management-list-card management-list-card--compact"
              }
              onClick={() => setSelectedClassId(classroom.id)}
            >
              <div className="row-between">
                <div>
                  <strong>{classroom.name}</strong>
                  <p className="management-list-card__meta">
                    {classroom.studentCount} 人 · 班级号 {classroom.classCode ?? "--"}
                  </p>
                </div>
                <span className="surface-tag">
                  {getTeacherAttentionLabel(
                    classroom.completedRate < 70
                      ? "urgent"
                      : classroom.completedRate < 85
                        ? "watch"
                        : "stable",
                  )}
                </span>
              </div>
              <p className="compact-copy compact-copy--two-line" title={classroom.description}>
                {classroom.description}
              </p>
              <div className="chip-row">
                <span className="surface-tag">三关 {classroom.completedRate}%</span>
                <span className="surface-tag">考试 {classroom.examCompletionRate}%</span>
                <span className="surface-tag">待审批 {classroom.pendingApplications ?? 0}</span>
              </div>
            </button>
          ))}
        </div>

        <article className="surface-card management-detail-card management-detail-card--compact">
          {selectedClass ? (
            <div className="page-stack">
              <div className="row-between">
                <div>
                  <span className="section-block__eyebrow">班级详情</span>
                  <h2>{selectedClass.name}</h2>
                </div>
                <span className="surface-tag">班级号 {selectedClass.classCode ?? "--"}</span>
              </div>

              <div className="card-grid card-grid--three">
                <article className="surface-card stat-card stat-card--compact">
                  <span>学生人数</span>
                  <strong>{selectedClass.studentCount}</strong>
                </article>
                <article className="surface-card stat-card stat-card--compact">
                  <span>待审批申请</span>
                  <strong>{selectedClass.pendingApplications ?? 0}</strong>
                </article>
                <article className="surface-card stat-card stat-card--compact">
                  <span>考试完成率</span>
                  <strong>{selectedClass.examCompletionRate}%</strong>
                </article>
              </div>

              <div className="editor-grid">
                <label className="form-field">
                  <span>班级名称</span>
                  <input
                    value={selectedClass.name}
                    onChange={(event) => updateSelectedClass("name", event.target.value)}
                  />
                </label>
                <label className="form-field">
                  <span>班级号</span>
                  <div className="button-row">
                    <input value={selectedClass.classCode ?? ""} readOnly />
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => void handleCopyClassCode(selectedClass.classCode ?? "")}
                    >
                      复制班级号
                    </button>
                  </div>
                </label>
                <label className="form-field form-field--wide">
                  <span>班级说明</span>
                  <textarea
                    rows={4}
                    className="text-area"
                    value={selectedClass.description}
                    onChange={(event) =>
                      updateSelectedClass("description", event.target.value)
                    }
                  />
                </label>
              </div>

              <article className="surface-card">
                <span className="section-block__eyebrow">按学号邀请入班</span>
                <div className="button-row">
                  <input
                    className="text-input"
                    value={inviteStudentNo}
                    onChange={(event) => setInviteStudentNo(event.target.value.toUpperCase())}
                    placeholder="输入学生学号，例如 S12345678"
                  />
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => void handleInviteStudent()}
                    disabled={isSaving}
                  >
                    直接邀请入班
                  </button>
                </div>
              </article>

              <article className="surface-card">
                <span className="section-block__eyebrow">待审批申请</span>
                <div className="page-stack page-stack--compact">
                  {applications.length > 0 ? (
                    applications.map((application) => (
                      <article
                        key={application.id}
                        className="teacher-analysis-card teacher-analysis-card--compact"
                      >
                        <div className="row-between">
                          <div>
                            <strong>{application.studentName}</strong>
                            <p className="teacher-analysis-card__meta">
                              学号 {application.studentNo ?? "--"} · 当前班级{" "}
                              {application.currentClassName ?? "未加入"}
                            </p>
                          </div>
                          <span className="surface-tag">{application.status}</span>
                        </div>
                        <div className="button-row">
                          <button
                            type="button"
                            className="primary-button"
                            onClick={() =>
                              void handleReviewApplication(application.id, "approve")
                            }
                            disabled={isSaving}
                          >
                            通过
                          </button>
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() =>
                              void handleReviewApplication(application.id, "reject")
                            }
                            disabled={isSaving}
                          >
                            拒绝
                          </button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <article className="feedback-box feedback-box--compact">
                      <strong>当前没有待审批申请</strong>
                      <p>学生通过班级号提交申请后，会在这里出现待审核列表。</p>
                    </article>
                  )}
                </div>
              </article>

              <article className="surface-card">
                <span className="section-block__eyebrow">班级学生预览</span>
                <div className="page-stack page-stack--compact">
                  {selectedStudents.length > 0 ? (
                    selectedStudents.slice(0, 6).map((student) => (
                      <article
                        key={student.id}
                        className="teacher-analysis-card teacher-analysis-card--compact"
                      >
                        <div className="row-between">
                          <div>
                            <strong>{student.name}</strong>
                            <p className="teacher-analysis-card__meta">
                              学号 {student.studentNo ?? "--"} · {student.className}
                            </p>
                          </div>
                          <Link
                            className="ghost-button link-button"
                            to={`/teacher/students/${student.id}`}
                          >
                            查看详情
                          </Link>
                        </div>
                      </article>
                    ))
                  ) : (
                    <article className="feedback-box feedback-box--compact">
                      <strong>当前班级还没有学生</strong>
                      <p>可以先复制班级号给学生申请，或者通过学号直接邀请。</p>
                    </article>
                  )}
                </div>
              </article>

              <div className="button-row">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => void handleSaveSelectedClass()}
                  disabled={isSaving}
                >
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
                <input
                  className="text-input"
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                />
              </label>
              <label className="field-group">
                <span className="field-label">班级说明</span>
                <textarea
                  className="text-area"
                  rows={4}
                  value={draftDescription}
                  onChange={(event) => setDraftDescription(event.target.value)}
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
              <button
                type="button"
                className="primary-button"
                onClick={() => void handleCreateClass()}
                disabled={isSaving}
              >
                {isSaving ? "创建中..." : "创建班级"}
              </button>
            </div>
          </article>
        </section>
      ) : null}
    </div>
  );
}
