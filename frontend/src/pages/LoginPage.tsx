import { useMemo, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { authModeLabel } from "../services/apiConfig";
import {
  loginWithPassword,
  registerWithPassword,
  type LoginResponse,
} from "../services/auth";
import { ApiError } from "../services/http";
import { fetchStudentProgress } from "../services/student";
import { defaultRoleRoute, useAppState } from "../state/AppState";
import type { UserRole } from "../types";

const registerRoleOptions: Array<{ id: UserRole; label: string }> = [
  { id: "student", label: "学生端" },
  { id: "teacher", label: "教师端" },
  { id: "admin", label: "管理员端" },
];

export function LoginPage() {
  const { replaceProgress, saveStudentProfile, signIn, state } = useAppState();
  const navigate = useNavigate();

  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  async function completeAuthFlow(
    authResult: LoginResponse,
    fallbackAccount: string,
  ) {
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
        setError("登录失败，请稍后重试。");
      }
    } finally {
      setIsSubmitting(false);
    }
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
              <p>
                已有账号可以直接登录。学生登录后会先进入资料补全页，教师与管理员会进入各自工作台。
              </p>
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
                当前模式：{authModeLabel}，登录后会自动进入你对应的学习或工作界面。
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
              <span className="section-block__eyebrow">新用户注册</span>
              <h2>创建一个新账号</h2>
              <p>
                在这里选择你要注册的账号类型。注册成功后会直接进入对应端口；学生账号会先进入资料补全页。
              </p>
            </div>

            <form className="auth-form" onSubmit={handleRegister}>
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

              <button
                type="submit"
                className="primary-button primary-button--wide"
                disabled={isRegistering}
              >
                {isRegistering ? "注册中..." : "注册并进入系统"}
              </button>
            </form>
          </article>
        </section>
      </div>
    </div>
  );
}
