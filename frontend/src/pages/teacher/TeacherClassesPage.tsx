import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../../components/EmptyState";
import { MetricCard } from "../../components/MetricCard";
import { PageHero } from "../../components/PageHero";
import { PaginationControls } from "../../components/PaginationControls";
import {
  approveTeacherClassApplication,
  createTeacherClass,
  fetchTeacherClassApplications,
  fetchTeacherClasses,
  fetchTeacherClassStudents,
  fetchTeacherDashboard,
  inviteStudentToTeacherClass,
  rejectTeacherClassApplication,
  updateTeacherClass,
  type TeacherDashboardResponse,
} from "../../services/teacher";
import { useAppState } from "../../state/AppState";
import type {
  TeacherClassApplicationItem,
  TeacherClassManagementItem,
  TeacherStudentSummary,
} from "../../types";
import { getTeacherAttentionLabel, getTeacherAttentionLevel } from "../../utils/teacherInsights";

type TeacherClassTab = "info" | "invite" | "applications" | "students";
type TeacherClassLike = {
  name: string;
  studentCount: number;
  focusLabel: string;
  classCode?: string;
  description?: string;
};

const CLASS_PAGE_SIZE = 10;
const APPLICATION_PAGE_SIZE = 10;
const STUDENT_PAGE_SIZE = 10;

const fallbackDashboard: TeacherDashboardResponse = {
  classSummaries: [],
  students: [],
};

function looksCorruptedText(value?: string | null) {
  const content = String(value ?? "").trim();
  if (!content) {
    return false;
  }

  const questionCount = [...content].filter((char) => char === "?").length;
  const replacementCount = [...content].filter((char) => char === "�").length;

  return replacementCount > 0 || questionCount >= Math.max(2, Math.ceil(content.length / 3));
}

function getReadableClassName(name: string, classCode?: string) {
  if (looksCorruptedText(name)) {
    return classCode ? `班级 ${classCode}` : "未命名班级";
  }

  return name;
}

function getReadableClassDescription(description?: string) {
  const content = String(description ?? "").trim();
  if (!content || looksCorruptedText(content)) {
    return "请补充班级说明，方便老师和学生快速识别这个班级。";
  }

  return content;
}

function getReadableFocusLabel(label: string, studentCount: number) {
  if (looksCorruptedText(label)) {
    return studentCount > 0 ? "请补充班级学习重点" : "暂无学生数据";
  }

  return label;
}

function sanitizeTeacherClassLike<T extends TeacherClassLike>(item: T): T {
  const nextItem = {
    ...item,
    name: getReadableClassName(item.name, item.classCode),
    focusLabel: getReadableFocusLabel(item.focusLabel, item.studentCount),
  } as T;

  if ("description" in item) {
    return {
      ...nextItem,
      description: getReadableClassDescription(item.description),
    } as T;
  }

  return nextItem;
}

export function TeacherClassesPage() {
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);

  const [dashboard, setDashboard] = useState<TeacherDashboardResponse>(fallbackDashboard);
  const [classes, setClasses] = useState<TeacherClassManagementItem[]>([]);
  const [classPage, setClassPage] = useState(1);
  const [classQuery, setClassQuery] = useState("");
  const [classTotal, setClassTotal] = useState(0);
  const [classTotalPages, setClassTotalPages] = useState(1);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [activeTab, setActiveTab] = useState<TeacherClassTab>("info");

  const [applicationQuery, setApplicationQuery] = useState("");
  const [applicationPage, setApplicationPage] = useState(1);
  const [applications, setApplications] = useState<TeacherClassApplicationItem[]>([]);
  const [applicationTotal, setApplicationTotal] = useState(0);
  const [applicationTotalPages, setApplicationTotalPages] = useState(1);

  const [studentQuery, setStudentQuery] = useState("");
  const [studentPage, setStudentPage] = useState(1);
  const [students, setStudents] = useState<TeacherStudentSummary[]>([]);
  const [studentTotal, setStudentTotal] = useState(0);
  const [studentTotalPages, setStudentTotalPages] = useState(1);

  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [newClassName, setNewClassName] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");
  const [inviteStudentNo, setInviteStudentNo] = useState("");

  const [isLoading, setIsLoading] = useState(canUseApi);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setClassPage(1);
  }, [classQuery]);

  useEffect(() => {
    setApplicationPage(1);
  }, [applicationQuery, selectedClassId]);

  useEffect(() => {
    setStudentPage(1);
  }, [studentQuery, selectedClassId]);

  useEffect(() => {
    if (!canUseApi || !state.authToken) {
      setDashboard(fallbackDashboard);
      setClasses([]);
      setClassTotal(0);
      setClassTotalPages(1);
      setSelectedClassId("");
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError("");

    async function loadClassWorkbench() {
      try {
        const [nextDashboard, nextClasses] = await Promise.all([
          fetchTeacherDashboard(state.authToken ?? ""),
          fetchTeacherClasses(state.authToken ?? "", {
            query: classQuery,
            page: classPage,
            pageSize: CLASS_PAGE_SIZE,
          }),
        ]);

        if (cancelled) {
          return;
        }

        setDashboard({
          ...nextDashboard,
          classSummaries: nextDashboard.classSummaries.map((item) =>
            sanitizeTeacherClassLike(item),
          ),
        });
        setClasses(nextClasses.items.map((item) => sanitizeTeacherClassLike(item)));
        setClassTotal(nextClasses.total);
        setClassTotalPages(nextClasses.totalPages);
        setSelectedClassId((current) => {
          if (current && nextClasses.items.some((item) => item.id === current)) {
            return current;
          }

          return nextClasses.items[0]?.id ?? "";
        });
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "班级数据暂时无法同步，请稍后再试。",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadClassWorkbench();

    return () => {
      cancelled = true;
    };
  }, [canUseApi, classPage, classQuery, state.authToken]);

  const selectedClass = useMemo<TeacherClassManagementItem | null>(() => {
    const inPage = classes.find((item) => item.id === selectedClassId);
    if (inPage) {
      return inPage;
    }

    const summary = dashboard.classSummaries.find((item) => item.id === selectedClassId);
    if (!summary) {
      return null;
    }

    return {
      ...sanitizeTeacherClassLike(summary),
      description: "",
      createdAt: "",
      classCode: undefined,
      pendingApplications: 0,
    };
  }, [classes, dashboard.classSummaries, selectedClassId]);

  useEffect(() => {
    if (!selectedClass || !state.authToken || !canUseApi) {
      setApplications([]);
      setApplicationTotal(0);
      setApplicationTotalPages(1);
      return;
    }

    const currentClass = selectedClass;
    let cancelled = false;

    async function loadApplications() {
      try {
        const nextApplications = await fetchTeacherClassApplications(
          state.authToken ?? "",
          currentClass.id,
          {
            query: applicationQuery,
            page: applicationPage,
            pageSize: APPLICATION_PAGE_SIZE,
          },
        );

        if (!cancelled) {
          setApplications(nextApplications.items);
          setApplicationTotal(nextApplications.total);
          setApplicationTotalPages(nextApplications.totalPages);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "入班申请列表暂时无法刷新。",
          );
        }
      }
    }

    void loadApplications();

    return () => {
      cancelled = true;
    };
  }, [
    activeTab,
    applicationPage,
    applicationQuery,
    canUseApi,
    selectedClass,
    state.authToken,
  ]);

  useEffect(() => {
    if (!selectedClass || !state.authToken || !canUseApi) {
      setStudents([]);
      setStudentTotal(0);
      setStudentTotalPages(1);
      return;
    }

    const currentClass = selectedClass;
    let cancelled = false;

    async function loadStudents() {
      try {
        const nextStudents = await fetchTeacherClassStudents(
          state.authToken ?? "",
          currentClass.id,
          {
            query: studentQuery,
            page: studentPage,
            pageSize: STUDENT_PAGE_SIZE,
          },
        );

        if (!cancelled) {
          setStudents(nextStudents.items);
          setStudentTotal(nextStudents.total);
          setStudentTotalPages(nextStudents.totalPages);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "班级成员列表暂时无法刷新。",
          );
        }
      }
    }

    void loadStudents();

    return () => {
      cancelled = true;
    };
  }, [activeTab, canUseApi, selectedClass, state.authToken, studentPage, studentQuery]);

  useEffect(() => {
    if (!selectedClass) {
      setDraftName("");
      setDraftDescription("");
      return;
    }

    setDraftName(selectedClass.name);
    setDraftDescription(selectedClass.description ?? "");
  }, [selectedClass]);

  const totalStudents = dashboard.students.length;
  const totalPendingApplications = dashboard.classSummaries.reduce(
    (count: number, item) =>
      count +
      (classes.find((classroom) => classroom.id === item.id)?.pendingApplications ?? 0),
    0,
  );
  const priorityClass =
    dashboard.classSummaries
      .slice()
      .sort((left, right) => left.completedRate - right.completedRate)[0] ?? null;
  const topActionStudent = useMemo(
    () =>
      dashboard.students
        .slice()
        .sort((left: TeacherStudentSummary, right: TeacherStudentSummary) => {
          const leftScore = getTeacherAttentionLevel(left) === "urgent" ? 0 : 1;
          const rightScore = getTeacherAttentionLevel(right) === "urgent" ? 0 : 1;
          return leftScore - rightScore;
        })[0] ?? null,
    [dashboard.students],
  );

  async function refreshCurrentViews(preferredClassId?: string) {
    if (!state.authToken || !canUseApi) {
      return;
    }

    const nextDashboard = await fetchTeacherDashboard(state.authToken);
    const nextClasses = await fetchTeacherClasses(state.authToken, {
      query: classQuery,
      page: classPage,
      pageSize: CLASS_PAGE_SIZE,
    });

    setDashboard({
      ...nextDashboard,
      classSummaries: nextDashboard.classSummaries.map((item) =>
        sanitizeTeacherClassLike(item),
      ),
    });
    setClasses(nextClasses.items.map((item) => sanitizeTeacherClassLike(item)));
    setClassTotal(nextClasses.total);
    setClassTotalPages(nextClasses.totalPages);

    const resolvedClassId =
      preferredClassId && nextClasses.items.some((item) => item.id === preferredClassId)
        ? preferredClassId
        : nextClasses.items[0]?.id ?? "";
    setSelectedClassId(resolvedClassId);
  }

  async function handleCreateClass() {
    if (!state.authToken || !canUseApi) {
      setError("当前无法连接后端。");
      return;
    }

    const name = newClassName.trim();
    const description = newClassDescription.trim();

    if (!name) {
      setError("请先输入班级名称。");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const created = await createTeacherClass(state.authToken, { name, description });
      setNewClassName("");
      setNewClassDescription("");
      setNotice(`已创建班级 ${created.name}。`);
      await refreshCurrentViews(created.id);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "班级创建失败，请稍后重试。",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveClassInfo() {
    if (!selectedClass || !state.authToken || !canUseApi) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await updateTeacherClass(state.authToken, selectedClass.id, {
        name: draftName.trim(),
        description: draftDescription.trim(),
      });
      setNotice(`已保存 ${draftName.trim() || selectedClass.name} 的班级信息。`);
      await refreshCurrentViews(selectedClass.id);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "班级信息保存失败，请稍后重试。",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleInviteStudent() {
    if (!selectedClass || !state.authToken || !canUseApi) {
      return;
    }

    const currentClass = selectedClass;
    const studentNo = inviteStudentNo.trim().toUpperCase();
    if (!studentNo) {
      setError("请先输入要邀请的学号。");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const membership = await inviteStudentToTeacherClass(
        state.authToken,
        currentClass.id,
        studentNo,
      );
      setInviteStudentNo("");
      setNotice(
        `已邀请学号 ${membership.studentNo} 进入 ${
          membership.currentClass?.name ?? currentClass.name
        }。`,
      );
      await refreshCurrentViews(currentClass.id);
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
    if (!selectedClass || !state.authToken || !canUseApi) {
      return;
    }

    const currentClass = selectedClass;
    setIsSaving(true);
    setError("");

    try {
      if (action === "approve") {
        await approveTeacherClassApplication(state.authToken, currentClass.id, applicationId);
        setNotice("已通过这条入班申请。");
      } else {
        await rejectTeacherClassApplication(state.authToken, currentClass.id, applicationId);
        setNotice("已拒绝这条入班申请。");
      }

      await refreshCurrentViews(currentClass.id);
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
      <PageHero
        eyebrow="班级管理"
        title="先锁定班级，再邀请、审批和查看完整成员名单"
        description="班级页现在把班级信息、学号邀请、申请审批和成员名单拆进同一页的标签里，老师不用在长页面里来回找。"
        tone="teacher"
        stats={[
          { label: "当前班级总数", value: `${dashboard.classSummaries.length}` },
          { label: "平台学生总数", value: `${totalStudents}` },
          { label: "待审批申请", value: `${totalPendingApplications}` },
        ]}
        actions={
          <>
            <Link className="ghost-button link-button teacher-neutral-button" to="/teacher/students">
              打开学生列表
            </Link>
            <button
              type="button"
              className="ghost-button"
              onClick={() => setActiveTab("invite")}
            >
              直接邀请学生
            </button>
          </>
        }
      />

      <section className="card-grid card-grid--four">
        <MetricCard
          label="班级总数"
          value={`${dashboard.classSummaries.length}`}
          description="当前教师账号下可管理的班级数量。"
          tone="teacher"
        />
        <MetricCard
          label="已归班学生"
          value={`${totalStudents}`}
          description="已经通过邀请或审批进入班级的学生总数。"
          tone="teacher"
        />
        <MetricCard
          label="待审批申请"
          value={`${totalPendingApplications}`}
          description="学生通过班级号提交、等待老师确认的申请数量。"
          tone="teacher"
        />
        <MetricCard
          label="当前优先班级"
          value={priorityClass?.name ?? "--"}
          description={priorityClass?.focusLabel ?? "当前暂无班级风险摘要。"}
          tone="teacher"
        />
      </section>

      <article className="feedback-box feedback-box--compact">
        <strong>{error ? "班级数据同步失败" : "班级管理数据已从后端加载"}</strong>
        <p>
          {isLoading
            ? "正在同步班级、申请和成员名单..."
            : error || notice || "可以在这里集中完成班级维护、学号邀请、申请审批和班级成员查看。"}
        </p>
      </article>

      <section className="card-grid card-grid--two">
        <article className="surface-card teacher-inline-form-card">
          <span className="section-block__eyebrow">新建班级</span>
          <h2>先把新班级挂进工作台</h2>
          <div className="teacher-inline-form teacher-inline-form--two-line">
            <label className="form-field">
              <span>班级名称</span>
              <input
                value={newClassName}
                onChange={(event) => setNewClassName(event.target.value)}
                placeholder="例如：三年级一班"
              />
            </label>
            <label className="form-field form-field--wide">
              <span>班级说明</span>
              <input
                value={newClassDescription}
                onChange={(event) => setNewClassDescription(event.target.value)}
                placeholder="例如：周三下午集中复盘道路安全主题"
              />
            </label>
            <div className="teacher-inline-form__actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => void handleCreateClass()}
                disabled={isSaving}
              >
                创建班级
              </button>
            </div>
          </div>
        </article>

        <article className="surface-card teacher-inline-summary-card">
          <span className="section-block__eyebrow">教师提示</span>
          <h2>先做哪三件事最省力</h2>
          <div className="page-stack page-stack--compact">
            <article className="teacher-analysis-card teacher-analysis-card--compact">
              <strong>先锁定班级</strong>
              <p>用左侧搜索和分页快速切到目标班级，避免在所有数据里反复滚动。</p>
            </article>
            <article className="teacher-analysis-card teacher-analysis-card--compact">
              <strong>再处理入班</strong>
              <p>学号邀请和班级号申请都收在同一页内，审批后会自动刷新成员名单。</p>
            </article>
            <article className="teacher-analysis-card teacher-analysis-card--compact">
              <strong>最后看成员</strong>
              <p>成员名单现在有独立分页，适合在同一班里完整浏览全部学生。</p>
            </article>
          </div>
        </article>
      </section>

      <section className="management-layout management-layout--teacher">
        <div className="page-stack">
          <article className="surface-card surface-card--compact-section">
            <div className="section-block__header">
              <div>
                <span className="section-block__eyebrow">班级列表</span>
                <h2>搜索并切换班级</h2>
              </div>
              <span className="inline-note">共 {classTotal} 个班级</span>
            </div>
            <div className="filter-bar filter-bar--teacher">
              <label className="form-field form-field--wide">
                <span>搜索班级</span>
                <input
                  value={classQuery}
                  onChange={(event) => setClassQuery(event.target.value)}
                  placeholder="搜索班级名称或说明"
                />
              </label>
            </div>
          </article>

          {classes.length > 0 ? (
            <>
              <div className="management-list-panel management-list-panel--teacher">
                {classes.map((classroom) => (
                  <button
                    key={classroom.id}
                    type="button"
                    className={
                      classroom.id === selectedClass?.id
                        ? "management-list-card management-list-card--compact management-list-card--active teacher-class-list-card"
                        : "management-list-card management-list-card--compact teacher-class-list-card"
                    }
                    onClick={() => setSelectedClassId(classroom.id)}
                  >
                    <div className="teacher-class-list-card__head">
                      <div className="teacher-class-list-card__summary">
                        <strong>{classroom.name}</strong>
                        <p className="management-list-card__meta">
                          {classroom.studentCount} 人 · 班级号 {classroom.classCode ?? "--"}
                        </p>
                      </div>
                      <span className="surface-tag teacher-class-list-card__focus">
                        {classroom.focusLabel}
                      </span>
                    </div>
                    <p
                      className="compact-copy compact-copy--two-line teacher-class-list-card__description"
                      title={classroom.description}
                    >
                      {classroom.description}
                    </p>
                    <div className="chip-row teacher-class-list-card__chips">
                      <span className="surface-tag">三关 {classroom.completedRate}%</span>
                      <span className="surface-tag">考试 {classroom.examCompletionRate}%</span>
                      <span className="surface-tag">待审批 {classroom.pendingApplications ?? 0}</span>
                    </div>
                  </button>
                ))}
              </div>

              <PaginationControls
                page={classPage}
                totalPages={classTotalPages}
                onPageChange={setClassPage}
                label={`班级列表 · 共 ${classTotal} 个`}
              />
            </>
          ) : (
            <EmptyState
              title="当前没有命中的班级"
              description="可以清空搜索条件，或者先创建一个新的班级。"
            />
          )}
        </div>

        {selectedClass ? (
          <div className="page-stack">
            <article className="surface-card teacher-detail-shell">
              <div className="section-block__header">
                <div>
                  <span className="section-block__eyebrow">当前班级</span>
                  <h2>{selectedClass.name}</h2>
                </div>
                <div className="chip-row teacher-class-detail__chips">
                  <span className="surface-tag">班级号 {selectedClass.classCode ?? "--"}</span>
                  <span className="surface-tag">待审批 {selectedClass.pendingApplications ?? 0}</span>
                  <span className="surface-tag">{selectedClass.focusLabel}</span>
                </div>
              </div>

              <div className="teacher-tab-row" role="tablist" aria-label="班级详情标签">
                {[
                  ["info", "班级信息"],
                  ["invite", "邀请入班"],
                  ["applications", "申请审批"],
                  ["students", "学生名单"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      activeTab === value ? "teacher-tab teacher-tab--active" : "teacher-tab"
                    }
                    onClick={() => setActiveTab(value as TeacherClassTab)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {activeTab === "info" ? (
                <div className="page-stack">
                  <section className="card-grid card-grid--three">
                    <article className="surface-card stat-card stat-card--compact">
                      <span>班级成员</span>
                      <strong>{selectedClass.studentCount}</strong>
                      <p>当前班级里已经归入的学生人数。</p>
                    </article>
                    <article className="surface-card stat-card stat-card--compact">
                      <span>三关完成率</span>
                      <strong>{selectedClass.completedRate}%</strong>
                      <p>用于判断这一个班离主题主链路收口还有多远。</p>
                    </article>
                    <article className="surface-card stat-card stat-card--compact">
                      <span>考试完成率</span>
                      <strong>{selectedClass.examCompletionRate}%</strong>
                      <p>帮助老师判断是否要优先推进考试阶段。</p>
                    </article>
                  </section>

                  <article className="surface-card teacher-editor-panel">
                    <div className="section-block__header">
                      <div>
                        <span className="section-block__eyebrow">班级资料</span>
                        <h3>保持班级说明简洁可读</h3>
                      </div>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() =>
                          selectedClass.classCode ? void handleCopyClassCode(selectedClass.classCode) : null
                        }
                        disabled={!selectedClass.classCode}
                      >
                        复制班级号
                      </button>
                    </div>

                    <div className="editor-grid">
                      <label className="form-field">
                        <span>班级名称</span>
                        <input
                          value={draftName}
                          onChange={(event) => setDraftName(event.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>班级号</span>
                        <input value={selectedClass.classCode ?? "--"} readOnly />
                      </label>
                      <label className="form-field form-field--wide">
                        <span>班级说明</span>
                        <textarea
                          rows={4}
                          value={draftDescription}
                          onChange={(event) => setDraftDescription(event.target.value)}
                        />
                      </label>
                    </div>

                    <div className="button-row">
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => void handleSaveClassInfo()}
                        disabled={isSaving}
                      >
                        保存班级信息
                      </button>
                    </div>
                  </article>
                </div>
              ) : null}

              {activeTab === "invite" ? (
                <div className="page-stack">
                  <article className="surface-card teacher-editor-panel">
                    <span className="section-block__eyebrow">按学号直接邀请</span>
                    <h3>通过唯一学号把学生直接拉进班级</h3>
                    <div className="teacher-inline-form">
                      <label className="form-field form-field--wide">
                        <span>学生学号</span>
                        <input
                          value={inviteStudentNo}
                          onChange={(event) => setInviteStudentNo(event.target.value)}
                          placeholder="例如：S00000001"
                        />
                      </label>
                      <div className="teacher-inline-form__actions">
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => void handleInviteStudent()}
                          disabled={isSaving}
                        >
                          邀请入班
                        </button>
                      </div>
                    </div>
                  </article>

                  <article className="surface-card teacher-inline-summary-card">
                    <span className="section-block__eyebrow">邀请说明</span>
                    <ul className="plain-list">
                      <li>老师按学号邀请后，学生会直接归入当前班级。</li>
                      <li>班级号适合发给学生自主申请；学号邀请更适合老师快速处理已知学生。</li>
                      <li>如果学生已在别的班，后端会按最新邀请结果更新归属。</li>
                    </ul>
                  </article>
                </div>
              ) : null}

              {activeTab === "applications" ? (
                <div className="page-stack">
                  <article className="surface-card surface-card--compact-section">
                    <div className="section-block__header">
                      <div>
                        <span className="section-block__eyebrow">待审批申请</span>
                        <h3>搜索并处理学生的入班申请</h3>
                      </div>
                      <span className="inline-note">共 {applicationTotal} 条</span>
                    </div>
                    <div className="filter-bar filter-bar--teacher">
                      <label className="form-field form-field--wide">
                        <span>搜索申请</span>
                        <input
                          value={applicationQuery}
                          onChange={(event) => setApplicationQuery(event.target.value)}
                          placeholder="搜索姓名、学号或原班级"
                        />
                      </label>
                    </div>
                  </article>

                  {applications.length > 0 ? (
                    <>
                      <div className="page-stack page-stack--compact">
                        {applications.map((application) => (
                          <article
                            key={application.id}
                            className="teacher-analysis-card teacher-analysis-card--compact"
                          >
                            <div className="row-between">
                              <div>
                                <strong>{application.studentName}</strong>
                                <p className="teacher-analysis-card__meta">
                                  学号 {application.studentNo ?? "--"} · 申请时间 {application.requestedAt}
                                </p>
                              </div>
                              <span className="surface-tag">
                                {application.currentClassName
                                  ? `当前在 ${application.currentClassName}`
                                  : "当前未绑定班级"}
                              </span>
                            </div>
                            <div className="teacher-inline-form__actions teacher-inline-form__actions--spread">
                              <button
                                type="button"
                                className="primary-button"
                                onClick={() =>
                                  void handleReviewApplication(application.id, "approve")
                                }
                                disabled={isSaving}
                              >
                                通过申请
                              </button>
                              <button
                                type="button"
                                className="ghost-button"
                                onClick={() =>
                                  void handleReviewApplication(application.id, "reject")
                                }
                                disabled={isSaving}
                              >
                                拒绝申请
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>

                      <PaginationControls
                        page={applicationPage}
                        totalPages={applicationTotalPages}
                        onPageChange={setApplicationPage}
                        label={`入班申请 · 共 ${applicationTotal} 条`}
                      />
                    </>
                  ) : (
                    <EmptyState
                      title="当前没有待处理申请"
                      description="这意味着学生还没有通过班级号提交申请，或者当前搜索条件下没有结果。"
                    />
                  )}
                </div>
              ) : null}

              {activeTab === "students" ? (
                <div className="page-stack">
                  <article className="surface-card surface-card--compact-section">
                    <div className="section-block__header">
                      <div>
                        <span className="section-block__eyebrow">班级成员</span>
                        <h3>完整浏览这一个班的学生名单</h3>
                      </div>
                      <span className="inline-note">共 {studentTotal} 人</span>
                    </div>
                    <div className="filter-bar filter-bar--teacher">
                      <label className="form-field form-field--wide">
                        <span>搜索成员</span>
                        <input
                          value={studentQuery}
                          onChange={(event) => setStudentQuery(event.target.value)}
                          placeholder="搜索姓名、学号或薄弱点"
                        />
                      </label>
                    </div>
                  </article>

                  {students.length > 0 ? (
                    <>
                      <div className="page-stack page-stack--compact">
                        {students.map((student) => {
                          const attentionLevel = getTeacherAttentionLevel(student);
                          return (
                            <article
                              key={student.id}
                              className="teacher-student-row teacher-student-row--class"
                            >
                              <div className="teacher-student-row__main">
                                <div className="teacher-student-row__identity">
                                  <strong>{student.name}</strong>
                                  <span className="inline-note">
                                    学号 {student.studentNo ?? "--"} · 最近学习 {student.lastActiveAt}
                                  </span>
                                </div>

                                <div className="teacher-student-row__metrics">
                                  <span className="surface-tag">三关 {student.completedLevels}/3</span>
                                  <span className="surface-tag">考试 {student.examStatus}</span>
                                  <span className="surface-tag">
                                    {student.score === null ? "未出成绩" : `${student.score} 分`}
                                  </span>
                                </div>

                                <p className="compact-copy compact-copy--two-line" title={student.weakSpot}>
                                  {student.weakSpot}
                                </p>
                              </div>

                              <div className="teacher-student-row__side">
                                <span
                                  className={`teacher-attention-pill teacher-attention-pill--${attentionLevel}`}
                                >
                                  {getTeacherAttentionLabel(attentionLevel)}
                                </span>
                                <Link
                                  className="ghost-button link-button"
                                  to={`/teacher/students/${student.id}`}
                                >
                                  查看详情
                                </Link>
                              </div>
                            </article>
                          );
                        })}
                      </div>

                      <PaginationControls
                        page={studentPage}
                        totalPages={studentTotalPages}
                        onPageChange={setStudentPage}
                        label={`班级成员 · 共 ${studentTotal} 人`}
                      />
                    </>
                  ) : (
                    <EmptyState
                      title="当前班级暂无成员"
                      description="可以先通过学号邀请学生，或者等待学生使用班级号提交申请。"
                    />
                  )}
                </div>
              ) : null}
            </article>
          </div>
        ) : (
          <EmptyState
            title="请先在左侧选择一个班级"
            description="选中班级后，就可以在右侧继续编辑班级信息、邀请学生、审批申请和查看成员名单。"
          />
        )}
      </section>

      {topActionStudent ? (
        <section className="surface-card teacher-followup-card">
          <div className="section-block__header">
            <div>
              <span className="section-block__eyebrow">今日优先动作</span>
              <h2>如果只跟进一位学生，建议先看他</h2>
            </div>
            <Link className="ghost-button link-button" to={`/teacher/students/${topActionStudent.id}`}>
              进入学生详情
            </Link>
          </div>
          <p>
            {topActionStudent.name} 当前薄弱点是“{topActionStudent.weakSpot}”，已完成{" "}
            {topActionStudent.completedLevels} / 3 关，考试状态为 {topActionStudent.examStatus}。
          </p>
        </section>
      ) : null}
    </div>
  );
}
