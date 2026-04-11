import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { PaginationControls } from "../../components/PaginationControls";
import {
  fetchAdminUsers,
  updateAdminUser as updateAdminUserToApi,
} from "../../services/admin";
import { useAppState } from "../../state/AppState";
import type { AdminUserSummary } from "../../types";

const roleLabelMap = {
  student: "学生",
  teacher: "教师",
  admin: "管理员",
} as const;

const statusLabelMap = {
  active: "启用中",
  paused: "已停用",
} as const;

const USERS_PER_PAGE = 10;

function resolveCreatedAt(user: AdminUserSummary) {
  if (user.createdAt) {
    return user.createdAt;
  }

  if (user.role === "student") {
    return "2026-03-20 09:00";
  }

  if (user.role === "teacher") {
    return "2026-03-18 14:20";
  }

  return "2026-03-15 08:30";
}

function buildNextNote(nextStatus: AdminUserSummary["status"]) {
  return nextStatus === "paused"
    ? "异常账号待核查，当前已在后台停用。"
    : "账号状态已恢复，可继续进入正式流程。";
}

export function AdminUsersPage() {
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingAction, setPendingAction] = useState<{
    user: AdminUserSummary;
    nextStatus: AdminUserSummary["status"];
  } | null>(null);

  useEffect(() => {
    setPage(1);
  }, [query, roleFilter, statusFilter]);

  useEffect(() => {
    let cancelled = false;

    if (!canUseApi || !state.authToken) {
      setUsers([]);
      setError("");
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    setError("");

    void fetchAdminUsers(state.authToken, {
      query,
      role: roleFilter,
      status: statusFilter,
      page,
      pageSize: USERS_PER_PAGE,
    })
      .then((result) => {
        if (cancelled) {
          return;
        }

        setUsers(result.items);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      })
      .catch((requestError) => {
        if (cancelled) {
          return;
        }

        setError(requestError instanceof Error ? requestError.message : "用户列表加载失败。");
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [canUseApi, page, query, roleFilter, state.authToken, statusFilter]);

  const hydratedUsers = useMemo(
    () =>
      users.map((user) => ({
        ...user,
        createdAt: resolveCreatedAt(user),
      })),
    [users],
  );

  const activeCount = hydratedUsers.filter((user) => user.status === "active").length;
  const pausedCount = hydratedUsers.filter((user) => user.status === "paused").length;
  const roleCounts = {
    student: hydratedUsers.filter((user) => user.role === "student").length,
    teacher: hydratedUsers.filter((user) => user.role === "teacher").length,
    admin: hydratedUsers.filter((user) => user.role === "admin").length,
  };
  const hasFilters =
    query.trim().length > 0 || roleFilter !== "all" || statusFilter !== "all";

  async function confirmUserAction() {
    if (!pendingAction || !state.authToken || !canUseApi) {
      return;
    }

    const { user, nextStatus } = pendingAction;
    const nextNote = buildNextNote(nextStatus);

    setIsSubmitting(true);
    setError("");

    try {
      await updateAdminUserToApi(state.authToken, user.id, {
        status: nextStatus,
        note: nextNote,
      });

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id ? { ...item, status: nextStatus, note: nextNote } : item,
        ),
      );
      setPendingAction(null);
      setNotice(nextStatus === "paused" ? "已停用该账号。" : "已恢复该账号。");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "账号状态更新失败。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">用户管理</span>
          <h1>按角色、状态和关键字筛选平台账号</h1>
          <p>用户页现在改成固定工具栏 + 分页表格，备注默认截断展示，适合数据变多后的持续管理。</p>
        </div>
      </section>

      <article className="feedback-box feedback-box--compact">
        <strong>{error ? "用户列表同步失败" : "用户列表已从后端加载"}</strong>
        <p>
          {isLoading
            ? "正在同步用户列表..."
            : error || notice || "你可以在这里继续查看账号状态、备注说明和异常处理结果。"}
        </p>
      </article>

      <section className="card-grid card-grid--four">
        <article className="surface-card stat-card stat-card--compact admin-summary-card">
          <span>筛选结果</span>
          <strong>{total}</strong>
          <p>符合当前查询条件的账号总数。</p>
        </article>
        <article className="surface-card stat-card stat-card--compact admin-summary-card">
          <span>当前页启用</span>
          <strong>{activeCount}</strong>
          <p>当前页中仍可正常进入系统的账号数量。</p>
        </article>
        <article className="surface-card stat-card stat-card--compact admin-summary-card">
          <span>当前页停用</span>
          <strong>{pausedCount}</strong>
          <p>当前页中已被标记为异常停用的账号数量。</p>
        </article>
        <article className="surface-card stat-card stat-card--compact admin-summary-card">
          <span>角色分布</span>
          <strong>
            {roleCounts.student} / {roleCounts.teacher} / {roleCounts.admin}
          </strong>
          <p>当前页内学生、教师、管理员三类账号的数量分布。</p>
        </article>
      </section>

      <section className="surface-card surface-card--compact-section">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">筛选工具栏</span>
            <h2>先缩小范围，再处理账号</h2>
          </div>
          {hasFilters ? (
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                setQuery("");
                setRoleFilter("all");
                setStatusFilter("all");
              }}
            >
              清空筛选
            </button>
          ) : null}
        </div>
        <div className="filter-bar filter-bar--admin">
          <label className="form-field form-field--wide">
            <span>搜索账号</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索账号、备注或 ID"
            />
          </label>
          <label className="form-field">
            <span>角色</span>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="all">全部角色</option>
              <option value="student">学生</option>
              <option value="teacher">教师</option>
              <option value="admin">管理员</option>
            </select>
          </label>
          <label className="form-field">
            <span>状态</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">全部状态</option>
              <option value="active">启用中</option>
              <option value="paused">已停用</option>
            </select>
          </label>
        </div>
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">账号表格</span>
            <h2>分页浏览平台账号</h2>
          </div>
          <span className="inline-note">每页 {USERS_PER_PAGE} 条</span>
        </div>

        {hydratedUsers.length > 0 ? (
          <>
            <div className="admin-table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>账号</th>
                    <th>角色</th>
                    <th>状态</th>
                    <th>创建时间</th>
                    <th>最近活跃</th>
                    <th>备注</th>
                    <th>异常处理</th>
                  </tr>
                </thead>
                <tbody>
                  {hydratedUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="data-table__cell-stack">
                          <strong>{user.name}</strong>
                          <span className="data-table__muted">{user.id}</span>
                        </div>
                      </td>
                      <td>{roleLabelMap[user.role]}</td>
                      <td>
                        <span
                          className={
                            user.status === "active"
                              ? "table-status-badge table-status-badge--active"
                              : "table-status-badge table-status-badge--paused"
                          }
                        >
                          {statusLabelMap[user.status]}
                        </span>
                      </td>
                      <td>{user.createdAt ?? "--"}</td>
                      <td>{user.lastActiveAt}</td>
                      <td>
                        <p className="table-note-clamp" title={user.note}>
                          {user.note}
                        </p>
                      </td>
                      <td>
                        <div className="data-table__actions">
                          {user.status === "active" ? (
                            <button
                              type="button"
                              className="table-action-button table-action-button--danger"
                              onClick={() => setPendingAction({ user, nextStatus: "paused" })}
                            >
                              标记异常
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="table-action-button table-action-button--safe"
                              onClick={() => setPendingAction({ user, nextStatus: "active" })}
                            >
                              恢复账号
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <PaginationControls
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              label={`用户列表 · 共 ${total} 个`}
            />
          </>
        ) : (
          <EmptyState
            title="当前没有命中的账号"
            description="可以清空筛选条件，或者稍后再刷新一次当前数据。"
          />
        )}
      </section>

      {pendingAction ? (
        <section className="overlay-modal-backdrop">
          <article className="surface-card overlay-modal overlay-modal--compact">
            <div className="page-stack page-stack--compact">
              <div>
                <span className="section-block__eyebrow">异常账号处理</span>
                <h2>{pendingAction.nextStatus === "paused" ? "确认停用该账号？" : "确认恢复该账号？"}</h2>
              </div>
              <p>
                账号：{pendingAction.user.name}（{roleLabelMap[pendingAction.user.role]}）
              </p>
              <p className="compact-copy compact-copy--two-line" title={pendingAction.user.note}>
                当前备注：{pendingAction.user.note}
              </p>
              <div className="button-row">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => void confirmUserAction()}
                  disabled={isSubmitting}
                >
                  {pendingAction.nextStatus === "paused" ? "确认停用" : "确认恢复"}
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setPendingAction(null)}
                  disabled={isSubmitting}
                >
                  取消
                </button>
              </div>
            </div>
          </article>
        </section>
      ) : null}
    </div>
  );
}
