import { useMemo, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ApiError } from "../services/http";
import { resetPasswordWithAccount } from "../services/auth";
import { defaultRoleRoute, useAppState } from "../state/AppState";

export function ForgotPasswordPage() {
  const { state } = useAppState();
  const navigate = useNavigate();

  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    if (!account.trim() || !password || !confirmPassword) {
      setError("请填写账号、新密码和确认密码。");
      return;
    }

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致。");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result = await resetPasswordWithAccount({
        account: account.trim(),
        password,
      });

      navigate("/login", {
        replace: true,
        state: { notice: result.message },
      });
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError("重置失败，请稍后重试。");
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
                <h2>重置密码</h2>
              </div>

              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-form__stack">
                  <label className="field-group">
                    <span className="field-label">账号</span>
                    <input
                      className="text-input"
                      value={account}
                      onChange={(event) => setAccount(event.target.value)}
                      placeholder="请输入需要重置的账号"
                    />
                  </label>

                  <label className="field-group">
                    <span className="field-label">新密码</span>
                    <input
                      className="text-input"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="请输入新的密码"
                    />
                  </label>

                  <label className="field-group">
                    <span className="field-label">确认新密码</span>
                    <input
                      className="text-input"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="请再次输入新密码"
                    />
                  </label>

                  <p className="support-copy">
                    当前版本提供基础重置流程，重置成功后可直接返回登录页使用新密码进入系统。
                  </p>

                  {error ? <p className="form-error">{error}</p> : null}
                </div>

                <div className="auth-form__footer">
                  <div className="auth-form__actions">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => navigate("/login")}
                    >
                      返回登录
                    </button>
                    <button type="submit" className="primary-button" disabled={isSubmitting}>
                      {isSubmitting ? "提交中..." : "更新密码"}
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
