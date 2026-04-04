import { useMemo, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { demoAccounts } from "../data/mockData";
import { apiBaseUrl, authModeLabel } from "../services/apiConfig";
import { loginWithPassword } from "../services/auth";
import { ApiError } from "../services/http";
import { fetchStudentProgress } from "../services/student";
import { defaultRoleRoute, useAppState } from "../state/AppState";

export function LoginPage() {
  const { replaceProgress, saveStudentProfile, signIn, state } = useAppState();
  const navigate = useNavigate();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedAccount = account.trim();

    if (!trimmedAccount || !password) {
      setError("请输入账号和密码。");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const loginResult = await loginWithPassword(trimmedAccount, password);
      let progress = loginResult.progress ?? null;

      if (!progress && loginResult.role === "student" && loginResult.token) {
        try {
          progress = await fetchStudentProgress(loginResult.token);
        } catch {
          progress = null;
        }
      }

      signIn(loginResult.role, loginResult.account ?? trimmedAccount, {
        token: loginResult.token,
        source: "api",
      });

      if (loginResult.studentProfile) {
        saveStudentProfile(loginResult.studentProfile);
      }

      if (progress) {
        replaceProgress(progress);
      }

      const sameStudentAccount =
        state.sessionAccount === (loginResult.account ?? trimmedAccount);
      const nextStudentProfile =
        loginResult.studentProfile ?? (sameStudentAccount ? state.studentProfile : null);

      navigate(
        loginResult.role === "student" && !nextStudentProfile
          ? "/student/profile-setup"
          : defaultRoleRoute[loginResult.role],
      );
    } catch (loginError) {
      if (loginError instanceof ApiError) {
        setError(loginError.message);
      } else {
        setError("登录失败，请稍后重试。");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="auth-shell">
        <section className="hero-panel">
          <div className="hero-panel__content">
            <span className="hero-panel__eyebrow">登录页</span>
            <h1>智趣安全学堂</h1>
            <p>
              以道路安全教育为首发主题，围绕学生学习、教师查看和管理员后台三类角色组织完整课堂流程。
            </p>
            <div className="hero-panel__tags">
              <span>学生端</span>
              <span>教师端</span>
              <span>管理员端</span>
              <span>AI 助学</span>
            </div>
          </div>
        </section>

        <section className="card-grid card-grid--two auth-layout">
          <article className="surface-card auth-card">
            <div>
              <span className="section-block__eyebrow">正式登录</span>
              <h2>账号密码登录</h2>
              <p>学生登录后将先进入资料补全页；教师与管理员将直接进入各自的工作台页面。</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
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
                当前模式：{authModeLabel}
                {`，当前会连接 ${apiBaseUrl}/api/auth/login。`}
              </p>

              {error ? <p className="form-error">{error}</p> : null}

              <button
                type="submit"
                className="primary-button primary-button--wide"
                disabled={isSubmitting}
              >
                {isSubmitting ? "登录中..." : "登录进入系统"}
              </button>
            </form>
          </article>

          <article className="surface-card auth-card">
            <div>
              <span className="section-block__eyebrow">账号说明</span>
              <h2>后端 seed 账号</h2>
              <p>当前只保留真实后端登录，前端不再提供本地 demo 登录分支。</p>
            </div>

            <ul className="plain-list help-list">
              {demoAccounts.map((item) => (
                <li key={item.account}>
                  <strong>{item.roleLabel}</strong>
                  <span>
                    {item.account} / {item.password}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </div>
  );
}
