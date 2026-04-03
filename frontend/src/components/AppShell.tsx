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
import {
  buildGrowthSnapshot,
  buildGrowthUpgradeEncouragement,
} from "../utils/studentGrowth";
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
    { to: "/student/home", label: "棣栭〉" },
    { to: "/student/theme/road-safety", label: "涓婚瀛︿範" },
    { to: "/student/records", label: "瀛︿範璁板綍" },
    { to: "/student/growth", label: "鎴愰暱妗ｆ" },
    { to: "/student/ai", label: "AI 鍔╂墜" },
  ],
  teacher: [
    { to: "/teacher/dashboard", label: "鏁欏鎬昏" },
    { to: "/teacher/classes", label: "鐝骇姒傝" },
    { to: "/teacher/students", label: "瀛︾敓鍒楄〃" },
  ],
  admin: [
    { to: "/admin/dashboard", label: "鍚庡彴棣栭〉" },
    { to: "/admin/themes", label: "涓婚绠＄悊" },
    { to: "/admin/levels", label: "鍏冲崱鍐呭" },
    { to: "/admin/question-bank", label: "棰樺簱绠＄悊" },
    { to: "/admin/ai-copy", label: "AI 鏂囨" },
    { to: "/admin/users", label: "鐢ㄦ埛绠＄悊" },
    { to: "/admin/stats", label: "鏁版嵁缁熻" },
  ],
};

const roleNameMap: Record<UserRole, string> = {
  student: "瀛︾敓瀛︿範绔?,
  teacher: "鏁欏笀鏌ョ湅绔?,
  admin: "绠＄悊鍛樺悗鍙?,
};

function resolvePageMeta(role: UserRole, pathname: string): PageMeta {
  if (role === "student") {
    if (pathname === "/student/home") {
      return {
        title: "瀛︿範棣栭〉",
        description: "娆㈣繋鍖恒€佷富棰樺涔犲尯銆佸涔犳瑙堝尯鍜?AI 娴獥缁熶竴鍦ㄨ繖閲屼覆璧蜂粖澶╃殑瀛︿範鍏ュ彛銆?,
      };
    }

    if (pathname === "/student/theme/road-safety") {
      return {
        title: "閬撹矾瀹夊叏鏁欒偛",
        description: "鎸夆€滀笁鍏冲涔?- 涓婚鑰冭瘯 - 缁撴灉鍙嶉鈥濈殑姝ｅ紡娴佺▼鎺ㄨ繘鏁磋妭涓婚璇俱€?,
      };
    }

    if (pathname.startsWith("/student/theme/road-safety/level/") && pathname.endsWith("/result")) {
      return {
        title: "鍏冲崱缁撶畻椤?,
        description: "闆嗕腑鏌ョ湅鏈叧寰楀垎銆佷寒鐐广€佹敞鎰忕偣銆佸鍔卞拰涓嬩竴姝ュ姩浣溿€?,
      };
    }

    if (pathname.startsWith("/student/theme/road-safety/level/")) {
      return {
        title: "鍏冲崱瀛︿範椤?,
        description: "鎸夎鏄庝功瑕佹眰瀹屾垚鍦烘櫙浠诲姟銆佸湴鍥惧垽鏂垨鍑鸿瀹堟姢浠诲姟锛屽啀杩涘叆鐙珛缁撶畻椤点€?,
      };
    }

    if (pathname === "/student/theme/road-safety/exam") {
      return {
        title: "涓婚鑰冭瘯",
        description: "浣跨敤棰樺彿瀵艰埅銆佷笂涓€棰樸€佷笅涓€棰樺拰缁熶竴鎻愪氦瀹屾垚鏈疆鐭ヨ瘑妫€娴嬨€?,
      };
    }

    if (pathname === "/student/theme/road-safety/exam/result") {
      return {
        title: "鑰冭瘯缁撴灉椤?,
        description: "闆嗕腑鏌ョ湅鑰冭瘯鍒嗘暟銆侀敊棰樻暟閲忋€佺粨鏋滃垎娴佸拰涓嬩竴姝ュ涔犲缓璁€?,
      };
    }

    if (pathname === "/student/theme/road-safety/wrong-questions") {
      return {
        title: "閿欓鍥炵湅椤?,
        description: "閫愰鍥炵湅閿欓銆佹纭瓟妗堛€佽В鏋愪笌寤鸿鍥炵湅鐨勫叧鍗″叆鍙ｃ€?,
      };
    }

    if (pathname === "/student/records") {
      return {
        title: "瀛︿範璁板綍",
        description: "鎶婂叧鍗＄粨绠椼€佽€冭瘯缁撴灉銆侀敊棰樺洖鐪嬪拰鎴愰暱蹇収鏀惧埌鍚屼竴鏉″涔犺建杩归噷銆?,
      };
    }

    if (pathname === "/student/growth") {
      return {
        title: "鎴愰暱妗ｆ",
        description: "灞曠ず鎴愰暱鍊笺€佷笁绫昏兘鍔涖€佸凡瑙ｉ攣鍐呭鍜屾垚闀胯建杩广€?,
      };
    }

    if (pathname === "/student/ai") {
      return {
        title: "AI 闂瓟椤?,
        description: "鍥寸粫閬撹矾瀹夊叏涓婚杩涜杞婚噺闂瓟銆佹彁绀哄拰澶嶄範锛屼笉鎵╁睍寮€鏀捐亰澶╄兘鍔涖€?,
      };
    }

    if (pathname === "/student/ai-report") {
      return {
        title: "AI 缁撴灉鍗￠〉",
        description: "鐢ㄦ暟鎹姞妯℃澘鐢熸垚鏈疆瀛︿範鎬荤粨銆侀噷绋嬬鍜屽悗缁姩浣溿€?,
      };
    }
  }

  if (role === "teacher") {
    if (pathname === "/teacher/dashboard") {
      return {
        title: "鏁欏笀鏁欏鎬昏",
        description: "鑱氬悎鐝骇瀛︿範鎬昏銆佷笁鍏冲畬鎴愮巼銆佽€冭瘯瀹屾垚鐜囧拰杩戞湡寮傚父鎻愰啋銆?,
      };
    }

    if (pathname === "/teacher/classes") {
      return {
        title: "鐝骇姒傝",
        description: "浠庣彮绾х矑搴︽煡鐪嬪畬鎴愮巼銆佽€冭瘯杩涘害鍜屾暀瀛﹀叧娉ㄧ偣銆?,
      };
    }

    if (pathname.startsWith("/teacher/students/")) {
      return {
        title: "瀛︾敓璇︽儏",
        description: "鏌ョ湅鍏冲崱瀹屾垚鎯呭喌銆佽€冭瘯缁撴灉銆侀敊棰橀闄┿€佹垚闀跨姸鎬佸拰鏁欏寤鸿銆?,
      };
    }

    return {
      title: "瀛︾敓鍒楄〃",
      description: "缁熶竴绛涢€夊鐢熺姸鎬侊紝杩涘叆璇︽儏鏌ョ湅瀹屾暣瀛︿範闂幆鍜屽悗缁缓璁€?,
    };
  }

  if (pathname === "/admin/dashboard") {
    return {
      title: "鍚庡彴棣栭〉",
      description: "缁熶竴杩涘叆涓婚绠＄悊銆佸叧鍗＄鐞嗐€侀搴撱€丄I 鏂囨銆佺敤鎴峰拰缁熻妯″潡銆?,
    };
  }

  if (pathname === "/admin/themes") {
    return {
      title: "涓婚绠＄悊",
      description: "缁存姢涓婚鍒楄〃銆佸睍绀虹姸鎬併€佸皝闈俊鎭拰棰勮鏁堟灉銆?,
    };
  }

  if (pathname === "/admin/levels") {
    return {
      title: "鍏冲崱鍐呭绠＄悊",
      description: "浠ュ弻鏍忓伐浣滃彴缁存姢鍏冲崱鍒楄〃銆佸満鏅厤缃拰濂栧姳鍙嶉銆?,
    };
  }

  if (pathname === "/admin/question-bank") {
    return {
      title: "棰樺簱绠＄悊",
      description: "缁熶竴缁存姢棰樼洰鍒楄〃銆佺瓟妗堛€佽В鏋愬拰澶嶄範鎸囧悜銆?,
    };
  }

  if (pathname === "/admin/ai-copy") {
    return {
      title: "AI 鏂囨绠＄悊",
      description: "鎸夊満鏅淮鎶ゆ杩庤銆佹彁绀鸿銆侀紦鍔辫鍜岀粨鏋滃崱妯℃澘銆?,
    };
  }

  if (pathname === "/admin/users") {
    return {
      title: "鐢ㄦ埛绠＄悊",
      description: "鏌ョ湅璐﹀彿瑙掕壊銆佺姸鎬併€佹渶杩戞椿璺冩椂闂村拰澶囨敞璇存槑銆?,
    };
  }

  return {
    title: "鏁版嵁缁熻",
    description: "鏌ョ湅璁块棶閲忋€佸畬鎴愮巼銆佽€冭瘯鎴愮哗鍜屽叧閿秼鍔挎寚鏍囥€?,
  };
}

function resolveBreadcrumbs(role: UserRole, pathname: string): BreadcrumbItem[] {
  if (role === "student") {
    return [];
  }

  if (role === "teacher") {
    const breadcrumbs: BreadcrumbItem[] = [
      { label: "鏁欏笀宸ヤ綔鍙?, to: "/teacher/dashboard" },
    ];

    if (pathname === "/teacher/classes") {
      breadcrumbs.push({ label: "鐝骇姒傝" });
      return breadcrumbs;
    }

    if (pathname === "/teacher/students") {
      breadcrumbs.push({ label: "瀛︾敓鍒楄〃" });
      return breadcrumbs;
    }

    if (pathname.startsWith("/teacher/students/")) {
      breadcrumbs.push({ label: "瀛︾敓鍒楄〃", to: "/teacher/students" });
      breadcrumbs.push({ label: "瀛︾敓璇︽儏" });
      return breadcrumbs;
    }

    breadcrumbs.push({ label: "鏁欏鎬昏" });
    return breadcrumbs;
  }

  const breadcrumbs: BreadcrumbItem[] = [{ label: "绠＄悊鍛樺悗鍙?, to: "/admin/dashboard" }];

  if (pathname === "/admin/themes") {
    breadcrumbs.push({ label: "涓婚绠＄悊" });
    return breadcrumbs;
  }

  if (pathname === "/admin/levels") {
    breadcrumbs.push({ label: "鍏冲崱鍐呭绠＄悊" });
    return breadcrumbs;
  }

  if (pathname === "/admin/question-bank") {
    breadcrumbs.push({ label: "棰樺簱绠＄悊" });
    return breadcrumbs;
  }

  if (pathname === "/admin/ai-copy") {
    breadcrumbs.push({ label: "AI 鏂囨绠＄悊" });
    return breadcrumbs;
  }

  if (pathname === "/admin/users") {
    breadcrumbs.push({ label: "鐢ㄦ埛绠＄悊" });
    return breadcrumbs;
  }

  if (pathname === "/admin/stats") {
    breadcrumbs.push({ label: "鏁版嵁缁熻" });
    return breadcrumbs;
  }

  breadcrumbs.push({ label: "鍚庡彴棣栭〉" });
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
          <nav className="workspace-breadcrumbs" aria-label="闈㈠寘灞戝鑸?>
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
          {state.authSource === "api" ? "鏈嶅姟鏁版嵁妯″紡" : "棰勭疆鏁版嵁妯″紡"}
        </span>
        <button type="button" className="ghost-button" onClick={onSignOut}>
          閫€鍑虹櫥褰?
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
  const { recordStudyVisit, replaceProgress, resetDemo, signOut, state } = useAppState();
  const navItems = navByRole[role];
  const canSyncStudentProgress =
    role === "student" && state.authSource === "api" && Boolean(state.authToken);
  const syncRequestRef = useRef(0);
  const lastVisitedRouteRef = useRef(state.progress.lastVisitedRoute);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState("");
  const growthSnapshot = useMemo(
    () => (role === "student" && state.authSource !== "api" ? buildGrowthSnapshot(state) : null),
    [role, state],
  );
  const [growthTierSeenMap, setGrowthTierSeenMap] = usePersistedState<
    Record<string, string>
  >("student-growth-tier-seen", {});
  const [showGrowthUpgradeModal, setShowGrowthUpgradeModal] = useState(false);

  useEffect(() => {
    lastVisitedRouteRef.current = state.progress.lastVisitedRoute;
  }, [state.progress.lastVisitedRoute]);

  useEffect(() => {
    if (role === "student") {
      recordStudyVisit();
    }
  }, [recordStudyVisit, role]);

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
            : "鏆傛椂鏃犳硶鏇存柊鏈€鏂板涔犺繘搴︼紝褰撳墠缁х画浣跨敤宸蹭繚瀛樼殑瀛︿範鐘舵€併€?,
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
      return `鏈€杩戝悓姝ユ椂闂达細${lastSyncedAt}`;
    }

    return "杩涘叆瀛︾敓绔悗浼氳嚜鍔ㄥ悜鍚庣鎷夊彇鏈€鏂板涔犺繘搴︺€?;
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
              <span className="student-shell__eyebrow">瀛︾敓瀛︿範绔?/span>
              <div>
                <h1>鏅鸿叮瀹夊叏瀛﹀爞</h1>
                <p>閬撹矾瀹夊叏鏁欒偛涓婚 路 杞婚噺 AI 鍔╁ 路 涓夊叧瀛︿範闂幆</p>
              </div>
            </div>

            <div className="student-shell__status">
              <div className="student-shell__status-card">
                <span className="surface-tag">
                  {state.authSource === "api" ? "鏈嶅姟鏁版嵁妯″紡" : "棰勭疆鏁版嵁妯″紡"}
                </span>
                <strong>{state.studentProfile?.nickname ?? "寰呭畬鍠勫鐢熻祫鏂?}</strong>
                <p>
                  褰撳墠绉垎 {state.progress.points}
                  {state.studentProfile ? ` 路 ${state.studentProfile.stage}` : ""}
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
                    {isSyncing ? "鍚屾涓?.." : "鍒锋柊杩涘害"}
                  </button>
                ) : null}

                {state.authSource === "mock" ? (
                  <button type="button" className="ghost-button" onClick={resetDemo}>
                    閲嶆柊寮€濮嬪涔?
                  </button>
                ) : null}

                <button type="button" className="ghost-button" onClick={handleSignOut}>
                  閫€鍑虹櫥褰?
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
              <span className="topbar__eyebrow">褰撳墠椤甸潰</span>
              <h2>{pageMeta.title}</h2>
              <p>{pageMeta.description}</p>
            </div>
            <div className="student-shell__titlebar-tags">
              <span className="surface-tag">閬撹矾瀹夊叏涓婚闄愬畾</span>
              <span className="surface-tag">淇濇寔鍚庣鎺ュ彛涓嶅彉</span>
            </div>
          </section>

          {banner}

          {canSyncStudentProgress ? (
            <article className="feedback-box">
              <div className="row-between">
                <div>
                  <strong>{isSyncing ? "姝ｅ湪鏇存柊瀛︿範杩涘害..." : "瀛︿範杩涘害宸叉帴鍏ユ湇鍔℃暟鎹?}</strong>
                  <p>{syncSummary}</p>
                </div>
                <span className="surface-tag">
                  {isSyncing ? "鏇存柊涓? : lastSyncedAt ? "宸叉洿鏂? : "绛夊緟鏇存柊"}
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
              <span className="section-block__eyebrow">鎴愰暱鍗囩骇鎻愰啋</span>
              <h2>宸茶В閿佹柊鐨勬垚闀块樁娈碉細{growthSnapshot.currentTier.title}</h2>
              <p>{growthSnapshot.currentTier.description}</p>
              <ul className="plain-list">
                <li>鏂板瑙傦細{growthSnapshot.currentTier.appearance}</li>
                <li>鏂拌兘鍔涙爣绛撅細{growthSnapshot.currentTier.ability}</li>
                <li>鏂板満鏅細{growthSnapshot.currentTier.scene}</li>
              </ul>
              <article className="feedback-box growth-upgrade-ai-box">
                <strong>AI 榧撳姳璇?/strong>
                <p>{buildGrowthUpgradeEncouragement(growthSnapshot)}</p>
              </article>
              <div className="button-row">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => acknowledgeGrowthUpgrade(false)}
                >
                  绋嶅悗鏌ョ湅
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => acknowledgeGrowthUpgrade(true)}
                >
                  鍘绘垚闀挎。妗堥〉
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
          <h1>鏅鸿叮瀹夊叏瀛﹀爞</h1>
          <p>浠ュ姛鑳借鏄庝功鍜岀晫闈㈣鏄庝功涓哄噯鐨勫瑙掕壊鍗忎綔鍘熷瀷銆?/p>
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
            <span>褰撳墠韬唤</span>
            <strong>{roleNameMap[role]}</strong>
            <p>{state.authSource === "api" ? "褰撳墠浣跨敤鏈嶅姟鏁版嵁" : "褰撳墠浣跨敤棰勭疆鏁版嵁"}</p>
          </div>

          <button type="button" className="ghost-button" onClick={handleSignOut}>
            閫€鍑虹櫥褰?
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

