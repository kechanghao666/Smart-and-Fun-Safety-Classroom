import { useMemo, useState } from "react";
import { adminUserSummaries } from "../../data/mockData";
import { fetchAdminUsers } from "../../services/admin";
import { useAppState } from "../../state/AppState";
import { useApiResource } from "../../utils/useApiResource";

const roleLabelMap = {
  student: "学生",
  teacher: "教师",
  admin: "管理员",
} as const;

const statusLabelMap = {
  active: "启用中",
  paused: "已停用",
} as const;

export function AdminUsersPage() {
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const { data, error, isLoading, source } = useApiResource({
    enabled: canUseApi,
    fallbackData: adminUserSummaries,
    fetcher: () => fetchAdminUsers(state.authToken ?? ""),
    dependencies: [state.authToken],
  });
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredUsers = useMemo(
    () =>
      data.filter((user) => {
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
    [data, query, roleFilter, statusFilter],
  );

  const activeCount = filteredUsers.filter((user) => user.status === "active").length;
  const pausedCount = filteredUsers.filter((user) => user.status === "paused").length;
  const roleCounts = {
    student: data.filter((user) => user.role === "student").length,
    teacher: data.filter((user) => user.role === "teacher").length,
    admin: data.filter((user) => user.role === "admin").length,
  };
  const hasFilters =
    query.trim().length > 0 || roleFilter !== "all" || statusFilter !== "all";

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">用户管理</span>
          <h1>按角色、状态和关键词查看平台账号</h1>
          <p>这一页继续保持“只读接口优先”的工作方式，但把筛选结果、状态标签和账号分布整理成更正式的后台工作台。</p>
        </div>
      </section>

      <article className="feedback-box">
        <strong>{source === "api" ? "用户列表来自后端" : "用户列表来自本地 mock"}</strong>
        <p>
          {isLoading
            ? "正在同步用户列表..."
            : error || "用户管理页已经具备真实接口读取占位。"}
        </p>
      </article>

      <section className="card-grid card-grid--four">
        <article className="surface-card stat-card admin-summary-card">
          <span>账号总数</span>
          <strong>{data.length}</strong>
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
          <span>已停用</span>
          <strong>{pausedCount}</strong>
          <p>已停用账号仅保留记录，不进入正式使用流程。</p>
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
            <span className="surface-tag">
              关键词：{query.trim().length > 0 ? query.trim() : "未设置"}
            </span>
            <span className="surface-tag">
              角色：{roleFilter === "all" ? "全部角色" : roleLabelMap[roleFilter as keyof typeof roleLabelMap]}
            </span>
            <span className="surface-tag">
              状态：{statusFilter === "all" ? "全部状态" : statusLabelMap[statusFilter as keyof typeof statusLabelMap]}
            </span>
          </div>
          <p>
            {hasFilters
              ? `当前共筛出 ${filteredUsers.length} 个账号。`
              : "当前未设置筛选条件，默认展示全部账号。"}
          </p>
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
                  <th>最近活跃</th>
                  <th>备注</th>
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
                    <td>{user.lastActiveAt}</td>
                    <td>{user.note}</td>
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
    </div>
  );
}
