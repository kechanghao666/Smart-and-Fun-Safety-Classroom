import { useMemo, useState } from "react";
import { adminUserSummaries } from "../../data/mockData";

export function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredUsers = useMemo(
    () =>
      adminUserSummaries.filter((user) => {
        const matchesQuery =
          query.trim().length === 0 ||
          user.name.includes(query.trim()) ||
          user.note.includes(query.trim());
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        const matchesStatus = statusFilter === "all" || user.status === statusFilter;

        return matchesQuery && matchesRole && matchesStatus;
      }),
    [query, roleFilter, statusFilter],
  );

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--admin">
        <div>
          <span className="hero-banner__eyebrow">用户管理</span>
          <h1>按角色和状态查看平台账号</h1>
          <p>当前原型侧重管理视图与筛选结构，为后续真实后端接入预留位置。</p>
        </div>
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
                <td>{user.name}</td>
                <td>{user.role}</td>
                <td>{user.status === "active" ? "启用中" : "已停用"}</td>
                <td>{user.lastActiveAt}</td>
                <td>{user.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="inline-note">当前筛出 {filteredUsers.length} 个账号。</p>
      </section>
    </div>
  );
}
