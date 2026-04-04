import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { FloatingAiAssistant } from "./FloatingAiAssistant";
import { ApiError } from "../services/http";
import { fetchStudentProgress } from "../services/student";
import { useAppState } from "../state/AppState";
import type { UserRole } from "../types";
import { buildGrowthSnapshot } from "../utils/studentGrowth";
import { usePersistedState } from "../utils/usePersistedState";

interface NavItem {
  to: string;
  label: string;
}

interface PageMeta {
  title: string;
  description: string;
}

interface BreadcrumbItem {
  label: string;
  to?: string;
}

const navByRole: Record<UserRole, NavItem[]> = {
  student: [
    { to: "/student/home", label: "首页" },
    { to: "/student/theme/road-safety", label: "主题学习" },
    { to: "/student/records", label: "学习记录" },
    { to: "/student/growth", label: "成长档案" },
    { to: "/student/ai", label: "AI 助手" },
  ],
  teacher: [
    { to: "/teacher/dashboard", label: "教学总览" },
    { to: "/teacher/classes", label: "班级概览" },
    { to: "/teacher/students", label: "学生列表" },
  ],
  admin: [
    { to: "/admin/dashboard", label: "后台首页" },
    { to: "/admin/themes", label: "主题管理" },
    { to: "/admin/levels", label: "关卡内容" },
    { to: "/admin/question-bank", label: "题库管理" },
    { to: "/admin/ai-copy", label: "AI 文案" },
    { to: "/admin/users", label: "用户管理" },
    { to: "/admin/stats", label: "数据统计" },
  ],
};

const roleNameMap: Record<UserRole, string> = {
  student: "学生学习端",
  teacher: "教师查看端",
  admin: "管理员后台",
};

function resolvePageMeta(role: UserRole, pathname: string): PageMeta {
  if (role === "student") {
    if (pathname === "/student/home") {
      return {
        title: "学习首页",
        description: "欢迎区、主题学习区、学习概览区和 AI 浮窗统一在这里串起今天的学习入口。",
      };
    }

    if (pathname === "/student/theme/road-safety") {
      return {
        title: "道路安全教育",
        description: "按“三关学习 - 主题考试 - 结果反馈”的正式流程推进整节主题课。",
      };
    }

    if (pathname.startsWith("/student/theme/road-safety/level/") && pathname.endsWith("/result")) {
      return {
        title: "关卡结算页",
        description: "集中查看本关得分、亮点、注意点、奖励和下一步动作。",
      };
    }

    if (pathname.startsWith("/student/theme/road-safety/level/")) {
      return {
        title: "关卡学习页",
        description: "按说明书要求完成场景任务、地图判断或出行守护任务，再进入独立结算页。",
      };
    }

    if (pathname === "/student/theme/road-safety/exam") {
      return {
        title: "主题考试",
        description: "使用题号导航、上一题、下一题和统一提交完成本轮知识检测。",
      };
    }

    if (pathname === "/student/theme/road-safety/exam/result") {
      return {
        title: "考试结果页",
        description: "集中查看考试分数、错题数量、结果分流和下一步复习建议。",
      };
    }

    if (pathname === "/student/theme/road-safety/wrong-questions") {
      return {
        title: "错题回看页",
        description: "逐题回看错题、正确答案、解析与建议回看的关卡入口。",
      };
    }

    if (pathname === "/student/records") {
      return {
        title: "学习记录",
        description: "把关卡结算、考试结果、错题回看和成长快照放到同一条学习轨迹里。",
      };
    }

    if (pathname === "/student/growth") {
      return {
        title: "成长档案",
        description: "展示成长值、三类能力、已解锁内容和成长轨迹。",
      };
    }

    if (pathname === "/student/ai") {
      return {
        title: "AI 问答页",
        description: "围绕道路安全主题进行轻量问答、提示和复习，不扩展开放聊天能力。",
      };
    }

    if (pathname === "/student/ai-report") {
      return {
        title: "AI 结果卡页",
        description: "用数据加模板生成本轮学习总结、里程碑和后续动作。",
      };
    }
  }

  if (role === "teacher") {
    if (pathname === "/teacher/dashboard") {
      return {
        title: "教师教学总览",
        description: "聚合班级学习总览、三关完成率、考试完成率和近期异常提醒。",
      };
    }

    if (pathname === "/teacher/classes") {
      return {
        title: "班级概览",
        description: "从班级粒度查看完成率、考试进度和教学关注点。",
      };
    }

    if (pathname.startsWith("/teacher/students/")) {
      return {
        title: "学生详情",
        description: "查看关卡完成情况、考试结果、错题风险、成长状态和教学建议。",
      };
    }

    return {
      title: "学生列表",
      description: "统一筛选学生状态，进入详情查看完整学习闭环和后续建议。",
    };
  }

  if (pathname === "/admin/dashboard") {
    return {
      title: "后台首页",
      description: "统一进入主题管理、关卡管理、题库、AI 文案、用户和统计模块。",
    };
  }

  if (pathname === "/admin/themes") {
    return {
      title: "主题管理",
      description: "维护主题列表、展示状态、封面信息和预览效果。",
    };
  }

  if (pathname === "/admin/levels") {
    return {
      title: "关卡内容管理",
      description: "以双栏工作台维护关卡列表、场景配置和奖励反馈。",
    };
  }

  if (pathname === "/admin/question-bank") {
    return {
      title: "题库管理",
      description: "统一维护题目列表、答案、解析和复习指向。",
    };
  }

  if (pathname === "/admin/ai-copy") {
    return {
      title: "AI 文案管理",
      description: "按场景维护欢迎语、提示语、鼓励语和结果卡模板。",
    };
  }

  if (pathname === "/admin/users") {
    return {
      title: "用户管理",
      description: "查看账号角色、状态、最近活跃时间和备注说明。",
    };
  }

  return {
    title: "数据统计",
    description: "查看访问量、完成率、考试成绩和关键趋势指标。",
  };
}

function resolveBreadcrumbs(role: UserRole, pathname: string): BreadcrumbItem[] {
  if (role === "student") {
    return [];
  }

  if (role === "teacher") {
    const breadcrumbs: BreadcrumbItem[] = [
      { label: "教师工作台", to: "/teacher/dashboard" },
    ];

    if (pathname === "/teacher/classes") {
      breadcrumbs.push({ label: "班级概览" });
      return breadcrumbs;
    }

    if (pathname === "/teacher/students") {
      breadcrumbs.push({ label: "学生列表" });
      return breadcrumbs;
    }

    if (pathname.startsWith("/teacher/students/")) {
      breadcrumbs.push({ label: "学生列表", to: "/teacher/students" });
      breadcrumbs.push({ label: "学生详情" });
      return breadcrumbs;
    }

    breadcrumbs.push({ label: "教学总览" });
    return breadcrumbs;
  }

  const breadcrumbs: BreadcrumbItem[] = [{ label: "管理员后台", to: "/admin/dashboard" }];

  if (pathname === "/admin/themes") {
    breadcrumbs.push({ label: "主题管理" });
    return breadcrumbs;
  }

  if (pathname === "/admin/levels") {
    breadcrumbs.push({ label: "关卡内容管理" });
    return breadcrumbs;
  }

  if (pathname === "/admin/question-bank") {
    breadcrumbs.push({ label: "题库管理" });
    return breadcrumbs;
  }

  if (pathname === "/admin/ai-copy") {
    breadcrumbs.push({ label: "AI 文案管理" });
    return breadcrumbs;
  }

  if (pathname === "/admin/users") {
    breadcrumbs.push({ label: "用户管理" });
    return breadcrumbs;
  }

  if (pathname === "/admin/stats") {
    breadcrumbs.push({ label: "数据统计" });
    return breadcrumbs;
  }

  breadcrumbs.push({ label: "后台首页" });
  return breadcrumbs;
}

function WorkspaceHeader({
  role,
  meta,
  breadcrumbs,
  onSignOut,
}: {
  role: UserRole;
  meta: PageMeta;
  breadcrumbs: BreadcrumbItem[];
  onSignOut: () => void;
}) {
  const { state } = useAppState();

  return (
    <header className="workspace-header">
      <div className="workspace-header__copy">
        {breadcrumbs.length > 0 ? (
          <nav className="workspace-breadcrumbs" aria-label="面包屑导航">
            {breadcrumbs.map((item, index) => (
              <span key={`${item.label}-${index}`} className="workspace-breadcrumbs__item">
                {item.to && index < breadcrumbs.length - 1 ? (
                  <Link className="workspace-breadcrumbs__link" to={item.to}>
                    {item.label}
                  </Link>
                ) : (
                  <span>{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : null}
        <span className="topbar__eyebrow">{roleNameMap[role]}</span>
        <h1>{meta.title}</h1>
        <p>{meta.description}</p>
      </div>

      <div className="workspace-header__actions">
        <span className="surface-tag">
          {state.authSource === "api" ? "服务数据模式" : "预置数据模式"}
        </span>
        <button type="button" className="ghost-button" onClick={onSignOut}>
          退出登录
        </button>
      </div>
    </header>
  );
}

export function AppShell({
  role,
  banner,
}: {
  role: UserRole;
  banner?: ReactNode;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { replaceProgress, resetDemo, signOut, state } = useAppState();
  const navItems = navByRole[role];
  const canSyncStudentProgress =
    role === "student" && state.authSource === "api" && Boolean(state.authToken);
  const syncRequestRef = useRef(0);
  const lastVisitedRouteRef = useRef(state.progress.lastVisitedRoute);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState("");
  const growthSnapshot = useMemo(
    () => (role === "student" ? buildGrowthSnapshot(state) : null),
    [role, state],
  );
  const [growthTierSeenMap, setGrowthTierSeenMap] = usePersistedState<
    Record<string, string>
  >("student-growth-tier-seen", {});
  const [showGrowthUpgradeModal, setShowGrowthUpgradeModal] = useState(false);

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
            : "暂时无法更新最新学习进度，当前继续使用已保存的学习状态。",
        );
      } finally {
        if (!silent && syncRequestRef.current === requestId) {
          setIsSyncing(false);
        }
      }
    },
    [canSyncStudentProgress, replaceProgress, state.authToken],
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

  const pageMeta = useMemo(
    () => resolvePageMeta(role, location.pathname),
    [location.pathname, role],
  );
  const breadcrumbs = useMemo(
    () => resolveBreadcrumbs(role, location.pathname),
    [location.pathname, role],
  );
  const studentAccountKey = state.sessionAccount ?? "";
  const currentGrowthTierId = growthSnapshot?.currentTier.id ?? "";

  useEffect(() => {
    if (role !== "student" || !studentAccountKey || !currentGrowthTierId) {
      setShowGrowthUpgradeModal(false);
      return;
    }

    const seenTierId = growthTierSeenMap[studentAccountKey];

    if (!seenTierId) {
      setGrowthTierSeenMap((current) => ({
        ...current,
        [studentAccountKey]: currentGrowthTierId,
      }));
      return;
    }

    if (seenTierId !== currentGrowthTierId) {
      setShowGrowthUpgradeModal(true);
    }
  }, [
    currentGrowthTierId,
    growthTierSeenMap,
    role,
    setGrowthTierSeenMap,
    state.authSource,
    studentAccountKey,
  ]);

  const handleSignOut = useCallback(() => {
    signOut();
    navigate("/login");
  }, [navigate, signOut]);

  const acknowledgeGrowthUpgrade = useCallback(
    (openGrowthPage: boolean) => {
      if (role !== "student" || !studentAccountKey || !currentGrowthTierId) {
        setShowGrowthUpgradeModal(false);
        return;
      }

      setGrowthTierSeenMap((current) => ({
        ...current,
        [studentAccountKey]: currentGrowthTierId,
      }));
      setShowGrowthUpgradeModal(false);

      if (openGrowthPage) {
        navigate("/student/growth");
      }
    },
    [
      currentGrowthTierId,
      navigate,
      role,
      setGrowthTierSeenMap,
      studentAccountKey,
    ],
  );

  if (role === "student") {
    return (
      <div className="student-shell">
        <header className="student-shell__header">
          <div className="student-shell__topline">
            <div className="student-shell__brand">
              <span className="student-shell__eyebrow">学生学习端</span>
              <div>
                <h1>智趣安全学堂</h1>
                <p>道路安全教育主题 · 轻量 AI 助学 · 三关学习闭环</p>
              </div>
            </div>

            <div className="student-shell__status">
              <div className="student-shell__status-card">
                <span className="surface-tag">
                  {state.authSource === "api" ? "服务数据模式" : "预置数据模式"}
                </span>
                <strong>{state.studentProfile?.nickname ?? "待完善学生资料"}</strong>
                <p>
                  当前积分 {state.progress.points}
                  {state.studentProfile ? ` · ${state.studentProfile.stage}` : ""}
                </p>
              </div>

              <div className="button-row">
                {canSyncStudentProgress ? (
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
                ) : null}

                {state.authSource === "mock" ? (
                  <button type="button" className="ghost-button" onClick={resetDemo}>
                    重新开始学习
                  </button>
                ) : null}

                <button type="button" className="ghost-button" onClick={handleSignOut}>
                  退出登录
                </button>
              </div>
            </div>
          </div>

          <nav className="student-shell__nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive
                    ? "student-shell__nav-link student-shell__nav-link--active"
                    : "student-shell__nav-link"
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <div className="student-shell__main">
          <section className="student-shell__titlebar">
            <div>
              <span className="topbar__eyebrow">当前页面</span>
              <h2>{pageMeta.title}</h2>
              <p>{pageMeta.description}</p>
            </div>
            <div className="student-shell__titlebar-tags">
              <span className="surface-tag">道路安全主题限定</span>
              <span className="surface-tag">保持后端接口不变</span>
            </div>
          </section>

          {banner}

          {canSyncStudentProgress ? (
            <article className="feedback-box">
              <div className="row-between">
                <div>
                  <strong>{isSyncing ? "正在更新学习进度..." : "学习进度已接入服务数据"}</strong>
                  <p>{syncSummary}</p>
                </div>
                <span className="surface-tag">
                  {isSyncing ? "更新中" : lastSyncedAt ? "已更新" : "等待更新"}
                </span>
              </div>
            </article>
          ) : null}

          <main className="content-area">
            <Outlet />
          </main>
        </div>

        {showGrowthUpgradeModal && growthSnapshot ? (
          <section className="overlay-modal-backdrop">
            <article className="surface-card overlay-modal">
              <span className="section-block__eyebrow">成长升级提醒</span>
              <h2>已解锁新的成长阶段：{growthSnapshot.currentTier.title}</h2>
              <p>{growthSnapshot.currentTier.description}</p>
              <ul className="plain-list">
                <li>新外观：{growthSnapshot.currentTier.appearance}</li>
                <li>新能力标签：{growthSnapshot.currentTier.ability}</li>
                <li>新场景：{growthSnapshot.currentTier.scene}</li>
              </ul>
              <div className="button-row">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => acknowledgeGrowthUpgrade(false)}
                >
                  稍后查看
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => acknowledgeGrowthUpgrade(true)}
                >
                  去成长档案页
                </button>
              </div>
            </article>
          </section>
        ) : null}

        <FloatingAiAssistant />
      </div>
    );
  }

  return (
    <div className={`app-shell app-shell--${role}`}>
      <aside className="sidebar">
        <div className="brand-card">
          <span className="brand-card__eyebrow">Smart & Fun</span>
          <h1>智趣安全学堂</h1>
          <p>以功能说明书和界面说明书为准的多角色协作原型。</p>
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
            <p>{state.authSource === "api" ? "当前使用服务数据" : "当前使用预置数据"}</p>
          </div>

          <button type="button" className="ghost-button" onClick={handleSignOut}>
            退出登录
          </button>
        </div>
      </aside>

      <div className="shell-main">
        <WorkspaceHeader
          role={role}
          meta={pageMeta}
          breadcrumbs={breadcrumbs}
          onSignOut={handleSignOut}
        />
        {banner}
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
