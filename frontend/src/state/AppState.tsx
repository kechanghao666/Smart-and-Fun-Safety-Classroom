import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { levelBlueprints } from "../data/mockData";
import {
  createInitialRewardProgress,
  normalizeStudyDates,
} from "../utils/studentRewards";
import type {
  AppState,
  AuthSource,
  LevelId,
  LevelProgress,
  LevelResult,
  StudentGrowthPreferences,
  StudentProfile,
  UserRole,
} from "../types";

const STORAGE_KEY = "smart-safety-classroom-session";

interface PersistedAppState {
  role: AppState["role"];
  sessionAccount: string | null;
  authToken: string | null;
  authSource: AuthSource;
  studentProfile: StudentProfile | null;
  growthPreferences: StudentGrowthPreferences;
}

function buildInitialLevels(): LevelProgress[] {
  return levelBlueprints.map((level, index) => ({
    ...level,
    status: index === 0 ? "available" : "locked",
  }));
}

function createInitialProgress(): AppState["progress"] {
  return {
    themeId: "road-safety",
    themeTitle: "道路安全教育",
    lastVisitedRoute: "/student/home",
    points: 0,
    badges: [],
    levels: buildInitialLevels(),
    levelResults: {},
    exam: {
      status: "locked",
      totalQuestions: 0,
      score: null,
      wrongQuestionIds: [],
      studentAnswers: {},
    },
    rewardProgress: createInitialRewardProgress(),
  };
}

function createInitialState(): AppState {
  return {
    role: null,
    sessionAccount: null,
    authToken: null,
    authSource: "api",
    studentProfile: null,
    growthPreferences: {
      appearance: null,
      scene: null,
    },
    progress: createInitialProgress(),
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

    const parsed = JSON.parse(raw) as Partial<PersistedAppState>;
    const fallback = createInitialState();

    return {
      ...fallback,
      role: parsed.role ?? fallback.role,
      sessionAccount: parsed.sessionAccount ?? fallback.sessionAccount,
      authToken: parsed.authToken ?? fallback.authToken,
      authSource: parsed.authSource === "mock" ? "mock" : "api",
      studentProfile: parsed.studentProfile ?? fallback.studentProfile,
      growthPreferences: {
        ...fallback.growthPreferences,
        ...parsed.growthPreferences,
      },
    };
  } catch {
    return createInitialState();
  }
}

type AppAction =
  | {
      type: "signIn";
      role: UserRole;
      account: string;
      token?: string | null;
      source?: AuthSource;
    }
  | { type: "signOut" }
  | { type: "saveStudentProfile"; profile: StudentProfile }
  | { type: "saveGrowthPreferences"; preferences: Partial<StudentGrowthPreferences> }
  | { type: "replaceProgress"; progress: AppState["progress"] }
  | { type: "setLastVisitedRoute"; route: string };

function reducer(state: AppState, action: AppAction): AppState {
  if (action.type === "signIn") {
    const isSameSession =
      action.role === state.role && action.account === state.sessionAccount;

    return {
      ...state,
      role: action.role,
      sessionAccount: action.account,
      authToken: action.token ?? null,
      authSource: "api",
      studentProfile: isSameSession ? state.studentProfile : null,
      growthPreferences: isSameSession
        ? state.growthPreferences
        : createInitialState().growthPreferences,
      progress: createInitialProgress(),
    };
  }

  if (action.type === "signOut") {
    return createInitialState();
  }

  if (action.type === "saveStudentProfile") {
    return {
      ...state,
      studentProfile: action.profile,
    };
  }

  if (action.type === "saveGrowthPreferences") {
    return {
      ...state,
      growthPreferences: {
        ...state.growthPreferences,
        ...action.preferences,
      },
    };
  }

  if (action.type === "replaceProgress") {
    return {
      ...state,
      progress: {
        ...action.progress,
        exam: {
          ...action.progress.exam,
          studentAnswers:
            action.progress.exam.studentAnswers ??
            state.progress.exam.studentAnswers ??
            {},
        },
        rewardProgress: {
          ...state.progress.rewardProgress,
          ...action.progress.rewardProgress,
          studyDates: action.progress.rewardProgress?.studyDates?.length
            ? normalizeStudyDates(action.progress.rewardProgress.studyDates)
            : state.progress.rewardProgress.studyDates,
          claimedStreakDays:
            action.progress.rewardProgress?.claimedStreakDays ??
            state.progress.rewardProgress.claimedStreakDays,
          reviewedWrongQuestionIds:
            action.progress.rewardProgress?.reviewedWrongQuestionIds ??
            state.progress.rewardProgress.reviewedWrongQuestionIds,
        },
      },
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

  return state;
}

interface AppStateContextValue {
  state: AppState;
  signIn: (
    role: UserRole,
    account: string,
    options?: { token?: string | null; source?: AuthSource },
  ) => void;
  signOut: () => void;
  saveStudentProfile: (profile: StudentProfile) => void;
  saveGrowthPreferences: (preferences: Partial<StudentGrowthPreferences>) => void;
  replaceProgress: (progress: AppState["progress"]) => void;
  recordStudyVisit: () => void;
  claimStreakReward: (days: number) => void;
  completeWrongQuestionReview: (questionId: string) => void;
  setLastVisitedRoute: (route: string) => void;
  markLevelInProgress: (levelId: LevelId) => void;
  completeLevel: (levelId: LevelId, result?: LevelResult) => void;
  submitExam: (
    score: number,
    wrongQuestionIds: string[],
    studentAnswers: Record<string, number>,
  ) => void;
  resetDemo: () => void;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(
  undefined,
);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);

  useEffect(() => {
    const persistedState: PersistedAppState = {
      role: state.role,
      sessionAccount: state.sessionAccount,
      authToken: state.authToken,
      authSource: "api",
      studentProfile: state.studentProfile,
      growthPreferences: state.growthPreferences,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));
  }, [
    state.authToken,
    state.growthPreferences,
    state.role,
    state.sessionAccount,
    state.studentProfile,
  ]);

  const signIn = useCallback(
    (
      role: UserRole,
      account: string,
      options?: { token?: string | null; source?: AuthSource },
    ) => {
      dispatch({
        type: "signIn",
        role,
        account,
        token: options?.token,
        source: "api",
      });
    },
    [],
  );
  const signOut = useCallback(() => dispatch({ type: "signOut" }), []);
  const saveStudentProfile = useCallback(
    (profile: StudentProfile) => dispatch({ type: "saveStudentProfile", profile }),
    [],
  );
  const saveGrowthPreferences = useCallback(
    (preferences: Partial<StudentGrowthPreferences>) =>
      dispatch({ type: "saveGrowthPreferences", preferences }),
    [],
  );
  const replaceProgress = useCallback(
    (progress: AppState["progress"]) => dispatch({ type: "replaceProgress", progress }),
    [],
  );
  const recordStudyVisit = useCallback(() => {}, []);
  const claimStreakReward = useCallback((_days: number) => {}, []);
  const completeWrongQuestionReview = useCallback((_questionId: string) => {}, []);
  const setLastVisitedRoute = useCallback(
    (route: string) => dispatch({ type: "setLastVisitedRoute", route }),
    [],
  );
  const markLevelInProgress = useCallback((_levelId: LevelId) => {}, []);
  const completeLevel = useCallback(
    (_levelId: LevelId, _result?: LevelResult) => {},
    [],
  );
  const submitExam = useCallback(
    (
      _score: number,
      _wrongQuestionIds: string[],
      _studentAnswers: Record<string, number>,
    ) => {},
    [],
  );
  const resetDemo = useCallback(() => {}, []);

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      signIn,
      signOut,
      saveStudentProfile,
      saveGrowthPreferences,
      replaceProgress,
      recordStudyVisit,
      claimStreakReward,
      completeWrongQuestionReview,
      setLastVisitedRoute,
      markLevelInProgress,
      completeLevel,
      submitExam,
      resetDemo,
    }),
    [
      claimStreakReward,
      completeLevel,
      completeWrongQuestionReview,
      markLevelInProgress,
      recordStudyVisit,
      replaceProgress,
      resetDemo,
      saveGrowthPreferences,
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
