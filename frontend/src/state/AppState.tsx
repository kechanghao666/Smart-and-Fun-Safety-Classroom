import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { examQuestions, levelBlueprints } from "../data/mockData";
import type {
  AppState,
  LevelId,
  LevelProgress,
  StudentProfile,
  UserRole,
} from "../types";

const STORAGE_KEY = "smart-safety-classroom-demo-state";

function buildInitialLevels(): LevelProgress[] {
  return levelBlueprints.map((level, index) => ({
    ...level,
    status: index === 0 ? "available" : "locked",
  }));
}

function createInitialState(): AppState {
  return {
    role: null,
    sessionAccount: null,
    studentProfile: null,
    progress: {
      themeId: "road-safety",
      themeTitle: "道路安全教育",
      lastVisitedRoute: "/student/home",
      points: 120,
      badges: ["观察员新星"],
      levels: buildInitialLevels(),
      exam: {
        status: "locked",
        totalQuestions: examQuestions.length,
        score: null,
        wrongQuestionIds: [],
      },
    },
  };
}

function loadInitialState(): AppState {
  if (typeof window === "undefined") {
    return createInitialState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return createInitialState();
    }

    const parsed = JSON.parse(raw) as AppState;
    const fallback = createInitialState();

    return {
      role: parsed.role ?? fallback.role,
      sessionAccount: parsed.sessionAccount ?? fallback.sessionAccount,
      studentProfile: parsed.studentProfile ?? fallback.studentProfile,
      progress: {
        ...fallback.progress,
        ...parsed.progress,
        levels: parsed.progress?.levels?.length
          ? parsed.progress.levels
          : fallback.progress.levels,
        exam: {
          ...fallback.progress.exam,
          ...parsed.progress?.exam,
        },
      },
    };
  } catch {
    return createInitialState();
  }
}

type AppAction =
  | { type: "signIn"; role: UserRole; account: string }
  | { type: "signOut" }
  | { type: "saveStudentProfile"; profile: StudentProfile }
  | { type: "setLastVisitedRoute"; route: string }
  | { type: "markLevelInProgress"; levelId: LevelId }
  | { type: "completeLevel"; levelId: LevelId }
  | { type: "submitExam"; score: number; wrongQuestionIds: string[] }
  | { type: "resetDemo" };

function reducer(state: AppState, action: AppAction): AppState {
  if (action.type === "signIn") {
    return {
      ...state,
      role: action.role,
      sessionAccount: action.account,
    };
  }

  if (action.type === "signOut") {
    return {
      ...state,
      role: null,
      sessionAccount: null,
    };
  }

  if (action.type === "saveStudentProfile") {
    return {
      ...state,
      studentProfile: action.profile,
    };
  }

  if (action.type === "setLastVisitedRoute") {
    if (state.progress.lastVisitedRoute === action.route) {
      return state;
    }

    return {
      ...state,
      progress: {
        ...state.progress,
        lastVisitedRoute: action.route,
      },
    };
  }

  if (action.type === "markLevelInProgress") {
    const shouldUpdate = state.progress.levels.some(
      (level) => level.id === action.levelId && level.status === "available",
    );

    if (!shouldUpdate) {
      return state;
    }

    const levels = state.progress.levels.map((level) => {
      if (level.id === action.levelId && level.status === "available") {
        return {
          ...level,
          status: "in_progress" as const,
        };
      }

      return level;
    });

    return {
      ...state,
      progress: {
        ...state.progress,
        levels,
      },
    };
  }

  if (action.type === "completeLevel") {
    const levelIndex = state.progress.levels.findIndex(
      (level) => level.id === action.levelId,
    );

    if (levelIndex === -1) {
      return state;
    }

    if (state.progress.levels[levelIndex]?.status === "completed") {
      return state;
    }

    const levels = state.progress.levels.map((level, index) => {
      if (index === levelIndex) {
        return {
          ...level,
          status: "completed" as const,
        };
      }

      if (index === levelIndex + 1 && level.status === "locked") {
        return {
          ...level,
          status: "available" as const,
        };
      }

      return level;
    });

    const allCompleted = levels.every((level) => level.status === "completed");
    const badgeMap: Record<LevelId, string> = {
      "level-1": "交通观察员",
      "level-2": "路线小先锋",
      "level-3": "出行守护达人",
    };
    const nextBadges = state.progress.badges.includes(badgeMap[action.levelId])
      ? state.progress.badges
      : [...state.progress.badges, badgeMap[action.levelId]];

    return {
      ...state,
      progress: {
        ...state.progress,
        points: state.progress.points + 40,
        badges: nextBadges,
        levels,
        exam: {
          ...state.progress.exam,
          status:
            state.progress.exam.status === "completed"
              ? "completed"
              : allCompleted
                ? "available"
                : state.progress.exam.status,
        },
      },
    };
  }

  if (action.type === "submitExam") {
    if (state.progress.exam.status === "completed") {
      return state;
    }

    const nextBadges =
      action.score >= 80 && !state.progress.badges.includes("道路安全小卫士")
        ? [...state.progress.badges, "道路安全小卫士"]
        : state.progress.badges;

    return {
      ...state,
      progress: {
        ...state.progress,
        points: state.progress.points + (action.score >= 80 ? 60 : 30),
        badges: nextBadges,
        exam: {
          ...state.progress.exam,
          status: "completed",
          score: action.score,
          wrongQuestionIds: action.wrongQuestionIds,
        },
      },
    };
  }

  if (action.type === "resetDemo") {
    return {
      ...createInitialState(),
      role: state.role,
      sessionAccount: state.sessionAccount,
      studentProfile: state.studentProfile,
    };
  }

  return state;
}

interface AppStateContextValue {
  state: AppState;
  signIn: (role: UserRole, account: string) => void;
  signOut: () => void;
  saveStudentProfile: (profile: StudentProfile) => void;
  setLastVisitedRoute: (route: string) => void;
  markLevelInProgress: (levelId: LevelId) => void;
  completeLevel: (levelId: LevelId) => void;
  submitExam: (score: number, wrongQuestionIds: string[]) => void;
  resetDemo: () => void;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(
  undefined,
);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const signIn = useCallback(
    (role: UserRole, account: string) => dispatch({ type: "signIn", role, account }),
    [],
  );
  const signOut = useCallback(() => dispatch({ type: "signOut" }), []);
  const saveStudentProfile = useCallback(
    (profile: StudentProfile) => dispatch({ type: "saveStudentProfile", profile }),
    [],
  );
  const setLastVisitedRoute = useCallback(
    (route: string) => dispatch({ type: "setLastVisitedRoute", route }),
    [],
  );
  const markLevelInProgress = useCallback(
    (levelId: LevelId) => dispatch({ type: "markLevelInProgress", levelId }),
    [],
  );
  const completeLevel = useCallback(
    (levelId: LevelId) => dispatch({ type: "completeLevel", levelId }),
    [],
  );
  const submitExam = useCallback(
    (score: number, wrongQuestionIds: string[]) =>
      dispatch({ type: "submitExam", score, wrongQuestionIds }),
    [],
  );
  const resetDemo = useCallback(() => dispatch({ type: "resetDemo" }), []);

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      signIn,
      signOut,
      saveStudentProfile,
      setLastVisitedRoute,
      markLevelInProgress,
      completeLevel,
      submitExam,
      resetDemo,
    }),
    [
      completeLevel,
      markLevelInProgress,
      resetDemo,
      saveStudentProfile,
      setLastVisitedRoute,
      signIn,
      signOut,
      state,
      submitExam,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }

  return context;
}

export const defaultRoleRoute: Record<UserRole, string> = {
  student: "/student/home",
  teacher: "/teacher/dashboard",
  admin: "/admin/dashboard",
};
