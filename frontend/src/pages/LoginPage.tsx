import { useMemo, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { demoAccounts } from "../data/mockData";
import { defaultRoleRoute, useAppState } from "../state/AppState";
import { loginWithPassword } from "../services/auth";
import { apiBaseUrl, apiEnabled, authModeLabel } from "../services/apiConfig";
import { ApiError } from "../services/http";
import { fetchStudentProgress } from "../services/student";

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
      if (apiEnabled) {
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
        return;
      }

      const matchedAccount = demoAccounts.find(
        (item) => item.account === trimmedAccount && item.password === password,
      );

      if (!matchedAccount) {
        setError("账号或密码不正确，请检查后重试。");
        return;
      }

      signIn(matchedAccount.role, matchedAccount.account, { source: "mock" });
      const nextStudentProfile =
        state.sessionAccount === matchedAccount.account ? state.studentProfile : null;
      navigate(
        matchedAccount.role === "student" && !nextStudentProfile
          ? "/student/profile-setup"
          : defaultRoleRoute[matchedAccount.role],
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
              onSubmit={handleSubmit}
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
                当前模式：{authModeLabel}
                {apiEnabled
                  ? `，会优先请求 ${apiBaseUrl}/api/auth/login。`
                  : "，未配置后端地址时继续使用本地示例账号和前端状态。"}
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
              <span className="section-block__eyebrow">账号与联调说明</span>
              <h2>{apiEnabled ? "后端联调已启用" : "三类账号入口"}</h2>
              <p>
                {apiEnabled
                  ? "如后端已导入种子数据，可继续使用以下账号联调；未导入时请以服务端实际返回为准。"
                  : "当前前端基线使用固定示例账号，后续将由后端真实鉴权接口替换。"}
              </p>
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

