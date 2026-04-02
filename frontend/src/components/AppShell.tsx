import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FloatingAiAssistant } from "./FloatingAiAssistant";
import { fetchStudentProgress } from "../services/student";
import { ApiError } from "../services/http";
import { useAppState } from "../state/AppState";
import type { UserRole } from "../types";

interface NavItem {
  to: string;
  label: string;
}

const navByRole: Record<UserRole, NavItem[]> = {
  student: [
    { to: "/student/home", label: "学生首页" },
    { to: "/student/theme/road-safety", label: "主题详情" },
    { to: "/student/ai", label: "AI 问答" },
    { to: "/student/growth", label: "成长档案" },
    { to: "/student/records", label: "学习记录" },
    { to: "/student/ai-report", label: "AI 结果卡片" },
  ],
  teacher: [
    { to: "/teacher/classes", label: "班级概览" },
    { to: "/teacher/dashboard", label: "教师首页" },
    { to: "/teacher/students", label: "班级学生列表" },
  ],
  admin: [
    { to: "/admin/dashboard", label: "后台首页" },
    { to: "/admin/themes", label: "主题管理" },
    { to: "/admin/levels", label: "关卡管理" },
    { to: "/admin/question-bank", label: "题库管理" },
    { to: "/admin/ai-copy", label: "AI 文案" },
    { to: "/admin/users", label: "用户管理" },
    { to: "/admin/stats", label: "数据统计" },
  ],
};

const roleNameMap: Record<UserRole, string> = {
  student: "学生端",
  teacher: "教师端",
  admin: "管理员端",
};

export function AppShell({
  role,
  banner,
}: {
  role: UserRole;
  banner?: ReactNode;
}) {
  const { replaceProgress, resetDemo, signOut, state } = useAppState();
  const navigate = useNavigate();
  const navItems = navByRole[role];
  const canSyncStudentProgress =
    role === "student" && state.authSource === "api" && Boolean(state.authToken);
  const syncRequestRef = useRef(0);
  const lastVisitedRouteRef = useRef(state.progress.lastVisitedRoute);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState("");

  useEffect(() => {
    lastVisitedRouteRef.current = state.progress.lastVisitedRoute;
  }, [state.progress.lastVisitedRoute]);

  const syncStudentProgress = useCallback(
    async (silent = false) => {
      if (!canSyncStudentProgress) {
        return;
      }

      const requestId = syncRequestRef.current + 1;
      syncRequestRef.current = requestId;

      if (!silent) {
        setIsSyncing(true);
      }

      try {
        const progress = await fetchStudentProgress(state.authToken ?? "");

        if (syncRequestRef.current !== requestId) {
          return;
        }

        replaceProgress({
          ...progress,
          lastVisitedRoute:
            lastVisitedRouteRef.current || progress.lastVisitedRoute,
        });
        setSyncMessage("");
        setLastSyncedAt(
          new Intl.DateTimeFormat("zh-CN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }).format(new Date()),
        );
      } catch (error) {
        if (syncRequestRef.current !== requestId) {
          return;
        }

        setSyncMessage(
          error instanceof ApiError
            ? error.message
            : "暂时无法同步学生进度，当前继续使用本地已保存的学习状态。",
        );
      } finally {
        if (!silent && syncRequestRef.current === requestId) {
          setIsSyncing(false);
        }
      }
    },
    [
      canSyncStudentProgress,
      replaceProgress,
      state.authToken,
    ],
  );

  useEffect(() => {
    if (!canSyncStudentProgress) {
      setIsSyncing(false);
      setSyncMessage("");
      setLastSyncedAt("");
      return;
    }

    void syncStudentProgress();
  }, [canSyncStudentProgress, syncStudentProgress]);

  useEffect(() => {
    if (!canSyncStudentProgress) {
      return;
    }

    const handleFocus = () => {
      void syncStudentProgress(true);
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [canSyncStudentProgress, syncStudentProgress]);

  const syncSummary = useMemo(() => {
    if (syncMessage) {
      return syncMessage;
    }

    if (lastSyncedAt) {
      return `最近同步时间：${lastSyncedAt}`;
    }

    return "进入学生端后会自动向后端拉取最新学习进度。";
  }, [lastSyncedAt, syncMessage]);

  return (
    <div className={`app-shell app-shell--${role}`}>
      <aside className="sidebar">
        <div className="brand-card">
          <span className="brand-card__eyebrow">Smart & Fun</span>
          <h1>智趣安全学堂</h1>
          <p>围绕道路安全主题的儿童互动学习原型。</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? "sidebar-link sidebar-link--active" : "sidebar-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-role-card">
            <span>当前身份</span>
            <strong>{roleNameMap[role]}</strong>
            <p>{state.authSource === "api" ? "后端联调模式" : "本地演示模式"}</p>
            {role === "student" ? (
              <>
                <p>积分 {state.progress.points}</p>
                {state.studentProfile ? (
                  <p>
                    {state.studentProfile.nickname} · {state.studentProfile.stage}
                  </p>
                ) : null}
              </>
            ) : null}
          </div>

          {role === "student" && state.authSource === "mock" ? (
            <button type="button" className="ghost-button" onClick={resetDemo}>
              重置演示进度
            </button>
          ) : null}

          <button
            type="button"
            className="ghost-button"
            onClick={() => {
              signOut();
              navigate("/login");
            }}
          >
            退出当前身份
          </button>
        </div>
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <div>
            <span className="topbar__eyebrow">多人协作原型基线</span>
            <h2>{roleNameMap[role]}</h2>
          </div>
          <div className="topbar__actions">
            <span className="surface-tag">工作分支友好</span>
            <span className="surface-tag">说明书驱动</span>
            <span className="surface-tag">
              {state.authSource === "api" ? "后端联调中" : "Mock 数据可联调"}
            </span>
          </div>
        </header>

        {banner}
        {canSyncStudentProgress ? (
          <article className="feedback-box">
            <div className="row-between">
              <div>
                <strong>{isSyncing ? "正在同步学生进度..." : "学生端已连接后端"}</strong>
                <p>{syncSummary}</p>
              </div>
              <div className="button-row">
                <span className="surface-tag">
                  {isSyncing ? "同步中" : lastSyncedAt ? "已同步" : "待同步"}
                </span>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => {
                    void syncStudentProgress();
                  }}
                  disabled={isSyncing}
                >
                  {isSyncing ? "同步中..." : "刷新进度"}
                </button>
              </div>
            </div>
          </article>
        ) : null}
        <main className="content-area">
          <Outlet />
        </main>
      </div>

      {role === "student" ? <FloatingAiAssistant /> : null}
    </div>
  );
}
