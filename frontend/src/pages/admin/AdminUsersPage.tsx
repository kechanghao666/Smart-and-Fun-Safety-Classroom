import { useEffect, useMemo, useState } from "react";
import {
  adminUsersFallback,
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
  const [users, setUsers] = useState<AdminUserSummary[]>(adminUsersFallback);
  const [source, setSource] = useState<"api" | "mock">(canUseApi ? "api" : "mock");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pendingAction, setPendingAction] = useState<{
    user: AdminUserSummary;
    nextStatus: AdminUserSummary["status"];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!canUseApi || !state.authToken) {
      setUsers(adminUsersFallback);
      setSource("mock");
      setError("");
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    setError("");

    void fetchAdminUsers(state.authToken)
      .then((result) => {
        if (cancelled) {
          return;
        }

        setUsers(result);
        setSource("api");
      })
      .catch((requestError) => {
        if (cancelled) {
          return;
        }

        setUsers(adminUsersFallback);
        setSource("mock");
        setError(requestError instanceof Error ? requestError.message : "用户列表加载失败。")
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [canUseApi, state.authToken]);

  const hydratedUsers = useMemo(
    () =>
      users.map((user) => ({
        ...user,
        createdAt: resolveCreatedAt(user),
      })),
    [users],
  );

  const filteredUsers = useMemo(
    () =>
      hydratedUsers.filter((user) => {
        const keyword = query.trim();
        const matchesQuery =
          keyword.length === 0 ||
          user.name.includes(keyword) ||
          user.note.includes(keyword) ||
          user.id.includes(keyword);
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        const matchesStatus = statusFilter === "all" || user.status === statusFilter;

        return matchesQuery && matchesRole && matchesStatus;
      }),
    [hydratedUsers, query, roleFilter, statusFilter],
  );

  const activeCount = filteredUsers.filter((user) => user.status === "active").length;
  const pausedCount = filteredUsers.filter((user) => user.status === "paused").length;
  const roleCounts = {
    student: hydratedUsers.filter((user) => user.role === "student").length,
    teacher: hydratedUsers.filter((user) => user.role === "teacher").length,
    admin: hydratedUsers.filter((user) => user.role === "admin").length,
  };
  const hasFilters =
    query.trim().length > 0 || roleFilter !== "all" || statusFilter !== "all";

  async function confirmUserAction() {
    if (!pendingAction) {
      return;
    }

    const { user, nextStatus } = pendingAction;
    const nextNote = buildNextNote(nextStatus);

    setIsSubmitting(true);
    setError("");

    try {
      if (canUseApi && state.authToken) {
        const updatedUser = await updateAdminUserToApi(state.authToken, user.id, {
          status: nextStatus,
          note: nextNote,
        });

        setUsers((current) =>
          current.map((item) =>
            item.id === user.id
              ? updatedUser ?? { ...item, status: nextStatus, note: nextNote }
              : item,
          ),
        );
        setSource("api");
      } else {
        setUsers((current) =>
          current.map((item) =>
            item.id === user.id ? { ...item, status: nextStatus, note: nextNote } : item,
          ),
        );
        setSource("mock");
      }

      setPendingAction(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "账号状态更新失败。")
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">用户管理</span>
          <h1>按角色、状态和关键词查看平台账号</h1>
          <p>
            这一页保持标准后台表格结构，并把账号启停动作直接接入后端。管理员现在可以真正停用或恢复账号，而不是只在浏览器里做本地标记。
          </p>
        </div>
      </section>

      <article className="feedback-box">
        <strong>{source === "api" ? "用户列表已接入服务数据" : "用户列表当前使用预置数据"}</strong>
        <p>
          {isLoading
            ? "正在同步用户列表..."
            : error ||
              "异常账号处理会直接写入后端用户状态；如果当前没有接后端，则会回退到预置演示数据。"}
        </p>
      </article>

      <section className="card-grid card-grid--four">
        <article className="surface-card stat-card admin-summary-card">
          <span>账号总数</span>
          <strong>{hydratedUsers.length}</strong>
          <p>当前后台展示的是当前数据源可访问的全部账号。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>筛选结果</span>
          <strong>{filteredUsers.length}</strong>
          <p>根据关键词、角色和状态组合后可见的账号数量。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>启用中</span>
          <strong>{activeCount}</strong>
          <p>可正常访问前台或后台的账号。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>异常停用</span>
          <strong>{pausedCount}</strong>
          <p>已被管理员标记为暂停使用的账号。</p>
        </article>
      </section>

      <section className="surface-card filter-bar">
        <label className="form-field">
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
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card admin-preview-card">
          <span className="section-block__eyebrow">筛选反馈</span>
          <h2>当前查询条件</h2>
          <div className="chip-row">
            <span className="surface-tag">关键词：{query.trim().length > 0 ? query.trim() : "未设置"}</span>
            <span className="surface-tag">
              角色：{roleFilter === "all" ? "全部角色" : roleLabelMap[roleFilter as keyof typeof roleLabelMap]}
            </span>
            <span className="surface-tag">
              状态：{statusFilter === "all" ? "全部状态" : statusLabelMap[statusFilter as keyof typeof statusLabelMap]}
            </span>
          </div>
          <p>{hasFilters ? `当前共筛出 ${filteredUsers.length} 个账号。` : "当前未设置筛选条件，默认展示全部账号。"}</p>
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
        </article>

        <article className="surface-card admin-preview-card">
          <span className="section-block__eyebrow">角色分布</span>
          <h2>当前数据源中的账号结构</h2>
          <div className="mini-stat-list">
            <div className="stat-pair">
              <strong>{roleCounts.student}</strong>
              <span>学生账号</span>
            </div>
            <div className="stat-pair">
              <strong>{roleCounts.teacher}</strong>
              <span>教师账号</span>
            </div>
            <div className="stat-pair">
              <strong>{roleCounts.admin}</strong>
              <span>管理员账号</span>
            </div>
          </div>
        </article>
      </section>

      <section className="surface-card">
        <div className="section-block__header">
          <div>
            <span className="section-block__eyebrow">账号表格</span>
            <h2>标准账号列表</h2>
          </div>
        </div>

        {filteredUsers.length > 0 ? (
          <>
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
                {filteredUsers.map((user) => (
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
                    <td>{user.note}</td>
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
            <p className="inline-note">当前共展示 {filteredUsers.length} 个账号。</p>
          </>
        ) : (
          <article className="feedback-box empty-state-card">
            <strong>没有匹配的账号</strong>
            <p>可以清空筛选条件，或者修改搜索词后再试一次。</p>
          </article>
        )}
      </section>

      {pendingAction ? (
        <section className="overlay-modal-backdrop">
          <article className="surface-card overlay-modal">
            <span className="section-block__eyebrow">账号状态处理</span>
            <h2>{pendingAction.nextStatus === "paused" ? "确认停用这个账号？" : "确认恢复这个账号？"}</h2>
            <p>
              账号：{pendingAction.user.name}（{roleLabelMap[pendingAction.user.role]}）
            </p>
            <p>
              {pendingAction.nextStatus === "paused"
                ? "停用后，后端会更新该账号状态，并在需要时清理已有会话。"
                : "恢复后，该账号可以重新进入正常业务流程。"}
            </p>
            <div className="button-row">
              <button
                type="button"
                className="ghost-button"
                disabled={isSubmitting}
                onClick={() => setPendingAction(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="primary-button"
                disabled={isSubmitting}
                onClick={() => {
                  void confirmUserAction();
                }}
              >
                {isSubmitting ? "提交中..." : "确认"}
              </button>
            </div>
          </article>
        </section>
      ) : null}
    </div>
  );
}
