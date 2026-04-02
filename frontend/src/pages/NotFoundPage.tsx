import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="surface-card">
      <h1>页面未找到</h1>
      <p>你可以返回登录页，或进入当前角色的默认首页。</p>
      <Link className="primary-button link-button" to="/login">
        返回登录页
      </Link>
    </section>
  );
}

