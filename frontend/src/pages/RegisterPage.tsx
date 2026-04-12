import { useMemo, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { registerWithPassword, type LoginResponse } from "../services/auth";
import { ApiError } from "../services/http";
import { fetchStudentProgress } from "../services/student";
import { defaultRoleRoute, useAppState } from "../state/AppState";
import type { UserRole } from "../types";

const registerRoleOptions: Array<{ id: UserRole; label: string }> = [
  { id: "student", label: "学生端" },
  { id: "teacher", label: "教师端" },
  { id: "admin", label: "管理员端" },
];

export function RegisterPage() {
  const { replaceProgress, saveStudentProfile, signIn, state } = useAppState();
  const navigate = useNavigate();

  const [registerName, setRegisterName] = useState("");
  const [registerAccount, setRegisterAccount] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerRole, setRegisterRole] = useState<UserRole>("student");
  const [registerError, setRegisterError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

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

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = registerName.trim();
    const trimmedAccount = registerAccount.trim();

    if (!trimmedName || !trimmedAccount || !registerPassword || !registerConfirmPassword) {
      setRegisterError("请完整填写注册信息。");
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setRegisterError("两次输入的密码不一致。");
      return;
    }

    setIsRegistering(true);
    setRegisterError("");

    try {
      const registerResult = await registerWithPassword({
        displayName: trimmedName,
        account: trimmedAccount,
        password: registerPassword,
        role: registerRole,
      });

      await completeAuthFlow(registerResult, trimmedAccount);
    } catch (registerRequestError) {
      if (registerRequestError instanceof ApiError) {
        setRegisterError(registerRequestError.message);
      } else {
        setRegisterError("注册失败，请稍后重试。");
      }
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <div className="login-page">
      <div className="auth-shell auth-shell--immersive">
        <section className="hero-panel hero-panel--auth hero-panel--auth-register">
          <div className="auth-stage auth-stage--framed">
            <div className="hero-panel__content auth-stage__header">
              <h1>智趣安全学堂</h1>
            </div>

            <div className="auth-stage__feature-column">
              <p className="auth-stage__feature-copy">
                本项目以游戏化闯关教学为核心，融合AI大模型智能问答与学习反馈能力，
                构建了一个兼具趣味性、智能性、教育性和可推广性的中小学生安全教育数字化平台。
              </p>
              <ul className="hero-panel__feature-list">
                <li className="hero-panel__feature-item">趣味互动</li>
                <li className="hero-panel__feature-item">智能引导</li>
                <li className="hero-panel__feature-item">教学闭环</li>
                <li className="hero-panel__feature-item">易于推广</li>
              </ul>
            </div>

            <article className="surface-card auth-card auth-card--embedded auth-card--register">
              <div>
                <h2>创建一个新账号</h2>
              </div>

              <form className="auth-form" onSubmit={handleRegister}>
                <div className="auth-form__stack">
                  <label className="field-group">
                    <span className="field-label">称呼</span>
                    <input
                      className="text-input"
                      value={registerName}
                      onChange={(event) => setRegisterName(event.target.value)}
                      placeholder="请输入你的称呼"
                    />
                  </label>

                  <label className="field-group">
                    <span className="field-label">注册账号</span>
                    <input
                      className="text-input"
                      value={registerAccount}
                      onChange={(event) => setRegisterAccount(event.target.value)}
                      placeholder="4-24 位字母、数字或下划线"
                    />
                  </label>

                  <div className="field-group">
                    <span className="field-label">选择账号类型</span>
                    <div className="auth-role-picker">
                      {registerRoleOptions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={
                            registerRole === item.id
                              ? "auth-role-chip auth-role-chip--active"
                              : "auth-role-chip"
                          }
                          onClick={() => setRegisterRole(item.id)}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="field-group">
                    <span className="field-label">设置密码</span>
                    <input
                      className="text-input"
                      type="password"
                      value={registerPassword}
                      onChange={(event) => setRegisterPassword(event.target.value)}
                      placeholder="请输入 6-32 位密码"
                    />
                  </label>

                  <label className="field-group">
                    <span className="field-label">确认密码</span>
                    <input
                      className="text-input"
                      type="password"
                      value={registerConfirmPassword}
                      onChange={(event) => setRegisterConfirmPassword(event.target.value)}
                      placeholder="请再次输入密码"
                    />
                  </label>

                  <p className="support-copy">
                    注册成功后会自动进入你选择的账号端，学生账号会先进入资料补全页。
                  </p>

                  {registerError ? <p className="form-error">{registerError}</p> : null}
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
                    <button type="submit" className="primary-button" disabled={isRegistering}>
                      {isRegistering ? "注册中..." : "注册"}
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
