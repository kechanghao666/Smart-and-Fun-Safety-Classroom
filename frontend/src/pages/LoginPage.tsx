import { useMemo, useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { authModeLabel } from "../services/apiConfig";
import { loginWithPassword, type LoginResponse } from "../services/auth";
import { ApiError } from "../services/http";
import { fetchStudentProgress } from "../services/student";
import { defaultRoleRoute, useAppState } from "../state/AppState";

export function LoginPage() {
  const { replaceProgress, saveStudentProfile, signIn, state } = useAppState();
  const navigate = useNavigate();
  const location = useLocation();

  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const notice =
    typeof location.state === "object" &&
    location.state &&
    "notice" in location.state &&
    typeof location.state.notice === "string"
      ? location.state.notice
      : "";

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

  async function completeAuthFlow(authResult: LoginResponse, fallbackAccount: string) {
    let progress = authResult.progress ?? null;

    if (!progress && authResult.role === "student" && authResult.token) {
      try {
        progress = await fetchStudentProgress(authResult.token);
      } catch {
        progress = null;
      }
    }

    signIn(authResult.role, authResult.account ?? fallbackAccount, {
      token: authResult.token,
      source: "api",
    });

    if (authResult.studentProfile) {
      saveStudentProfile(authResult.studentProfile);
    }

    if (progress) {
      replaceProgress(progress);
    }

    const sameStudentAccount =
      state.sessionAccount === (authResult.account ?? fallbackAccount);
    const nextStudentProfile =
      authResult.studentProfile ?? (sameStudentAccount ? state.studentProfile : null);

    navigate(
      authResult.role === "student" && !nextStudentProfile
        ? "/student/profile-setup"
        : defaultRoleRoute[authResult.role],
    );
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
      await completeAuthFlow(loginResult, trimmedAccount);
    } catch (loginError) {
      if (loginError instanceof ApiError) {
        setError(loginError.message);
      } else {
        setError("登录失败，请稍后再试。");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="auth-shell auth-shell--immersive">
        <section className="hero-panel hero-panel--auth">
          <div className="auth-stage">
            <div className="hero-panel__content auth-stage__copy">
              <h1>智趣安全学堂</h1>
              <p>
                本项目以游戏化闯关教学为核心，融合AI大模型智能问答与学习反馈能力，构建了一个兼具趣味性、智能性、教育性和可推广性的中小学生安全教育数字化平台。
              </p>
              <ul className="hero-panel__feature-list">
                <li className="hero-panel__feature-item">趣味互动</li>
                <li className="hero-panel__feature-item">智能引导</li>
                <li className="hero-panel__feature-item">教学闭环</li>
                <li className="hero-panel__feature-item">易于推广</li>
              </ul>
            </div>

            <article className="surface-card auth-card auth-card--embedded">
              <div>
                <h2>账号密码登录</h2>
              </div>

              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-form__stack">
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
                    当前模式：{authModeLabel}，登录后会自动进入你对应的学习或工作界面。
                  </p>

                  {notice ? <p className="form-notice">{notice}</p> : null}
                  {error ? <p className="form-error">{error}</p> : null}
                </div>

                <div className="auth-form__footer">
                  <div className="auth-form__actions auth-form__actions--triple">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => navigate("/register")}
                    >
                      注册
                    </button>
                    <button type="submit" className="primary-button" disabled={isSubmitting}>
                      {isSubmitting ? "登录中..." : "登录"}
                    </button>
                    <button
                      type="button"
                      className="link-button auth-link-button auth-link-button--inline"
                      onClick={() => navigate("/forgot-password")}
                    >
                      忘记密码
                    </button>
                  </div>
                </div>
              </form>
            </article>
          </div>
        </section>
      </div>
    </div>
  );
}
