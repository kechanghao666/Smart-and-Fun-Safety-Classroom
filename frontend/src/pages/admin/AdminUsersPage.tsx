import { useMemo, useState } from "react";
import { adminUserSummaries } from "../../data/mockData";
import { fetchAdminUsers } from "../../services/admin";
import { useAppState } from "../../state/AppState";
import { useApiResource } from "../../utils/useApiResource";

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
        const matchesQuery =
          query.trim().length === 0 ||
          user.name.includes(query.trim()) ||
          user.note.includes(query.trim());
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        const matchesStatus = statusFilter === "all" || user.status === statusFilter;

        return matchesQuery && matchesRole && matchesStatus;
      }),
    [data, query, roleFilter, statusFilter],
  );
  const activeCount = filteredUsers.filter((user) => user.status === "active").length;
  const pausedCount = filteredUsers.filter((user) => user.status === "paused").length;

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">用户管理</span>
          <h1>按角色和状态查看平台账号</h1>
          <p>当前侧重账号检索与状态展示，为后续真实用户管理能力预留结构。</p>
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

      <section className="card-grid card-grid--three">
        <article className="surface-card stat-card admin-summary-card">
          <span>当前筛出</span>
          <strong>{filteredUsers.length}</strong>
          <p>根据搜索词、角色和状态组合后的可见账号数量。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>启用中</span>
          <strong>{activeCount}</strong>
          <p>可正常访问前台或后台的账号。</p>
        </article>
        <article className="surface-card stat-card admin-summary-card">
          <span>已暂停</span>
          <strong>{pausedCount}</strong>
          <p>已暂停的账号仅保留记录，不进入正式使用流程。</p>
        </article>
      </section>

      <section className="surface-card filter-bar">
        <label className="form-field">
          <span>搜索账号</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索账号或备注"
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

      <section className="surface-card">
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
                    <td>{user.role}</td>
                    <td>
                      <span className="surface-tag">
                        {user.status === "active" ? "启用中" : "已停用"}
                      </span>
                    </td>
                    <td>{user.lastActiveAt}</td>
                    <td>{user.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="inline-note">当前共筛出 {filteredUsers.length} 个账号。</p>
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
