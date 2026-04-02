import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { demoAccounts } from "../data/mockData";
import { defaultRoleRoute, useAppState } from "../state/AppState";

export function LoginPage() {
  const { signIn, state } = useAppState();
  const navigate = useNavigate();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const nextRoute = useMemo(() => {
    if (!state.role) {
      return null;
    }

    if (state.role === "student" && !state.studentProfile) {
      return "/student/profile-setup";
    }

    return defaultRoleRoute[state.role];
  }, [state.role, state.studentProfile]);

  if (nextRoute) {
    return <Navigate to={nextRoute} replace />;
  }

  return (
    <div className="login-page">
      <div className="auth-shell">
        <section className="hero-panel">
          <div className="hero-panel__content">
            <span className="hero-panel__eyebrow">儿童友好 + 安全教育 + 多端协作</span>
            <h1>智趣安全学堂</h1>
            <p>
              请使用学生、教师或管理员账号登录系统。首版重点围绕道路安全教育，
              通过主题学习、闯关任务、主题考试和 AI 结果反馈完成完整课堂流程。
            </p>
            <div className="hero-panel__tags">
              <span>道路安全教育</span>
              <span>三关闯关</span>
              <span>主题考试</span>
              <span>AI 结果卡片</span>
            </div>
          </div>
        </section>

        <section className="card-grid card-grid--two auth-layout">
          <article className="surface-card auth-card">
            <div>
              <span className="section-block__eyebrow">正式登录</span>
              <h2>账号登录</h2>
              <p>学生登录后将进入学习端；教师与管理员将进入各自后台页面。</p>
            </div>

            <form
              className="auth-form"
              onSubmit={(event) => {
                event.preventDefault();
                const matchedAccount = demoAccounts.find(
                  (item) => item.account === account.trim() && item.password === password,
                );

                if (!matchedAccount) {
                  setError("账号或密码不正确，请检查后重试。");
                  return;
                }

                setError("");
                signIn(matchedAccount.role, matchedAccount.account);
                navigate(
                  matchedAccount.role === "student" && !state.studentProfile
                    ? "/student/profile-setup"
                    : defaultRoleRoute[matchedAccount.role],
                );
              }}
            >
              <label className="field-group">
                <span className="field-label">账号</span>
                <input
                  className="text-input"
                  value={account}
                  onChange={(event) => setAccount(event.target.value)}
                  placeholder="请输入账号"
                />
              </label>

              <label className="field-group">
                <span className="field-label">密码</span>
                <input
                  className="text-input"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="请输入密码"
                />
              </label>

              <p className="support-copy">
                身份提示：学生、教师、管理员使用各自账号登录，系统会自动分配对应页面与权限。
              </p>

              {error ? <p className="form-error">{error}</p> : null}

              <button type="submit" className="primary-button primary-button--wide">
                登录进入系统
              </button>
            </form>
          </article>

          <article className="surface-card auth-card">
            <div>
              <span className="section-block__eyebrow">当前演示账号</span>
              <h2>三类账号入口</h2>
              <p>当前前端基线使用固定示例账号，后续将由后端真实鉴权接口替换。</p>
            </div>

            <ul className="plain-list help-list">
              {demoAccounts.map((item) => (
                <li key={item.account}>
                  <strong>{item.roleLabel}</strong>
                  <span>{item.account} / {item.password}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </div>
  );
}

