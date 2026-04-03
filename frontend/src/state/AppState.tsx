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
import {
  createInitialRewardProgress,
  getAvailableStreakRewardDays,
  getLocalDateKey,
  normalizeStudyDates,
  STREAK_REWARD_POINTS,
  WRONG_QUESTION_REVIEW_REWARD,
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

const STORAGE_KEY = "smart-safety-classroom-demo-state";

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
    points: 120,
    badges: ["观察员新星"],
    levels: buildInitialLevels(),
    levelResults: {},
    exam: {
      status: "locked",
      totalQuestions: examQuestions.length,
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
    authSource: "mock",
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

    const parsed = JSON.parse(raw) as AppState;
    const fallback = createInitialState();

    return {
      role: parsed.role ?? fallback.role,
      sessionAccount: parsed.sessionAccount ?? fallback.sessionAccount,
      authToken: parsed.authToken ?? fallback.authToken,
      authSource: parsed.authSource ?? fallback.authSource,
      studentProfile: parsed.studentProfile ?? fallback.studentProfile,
      growthPreferences: {
        ...fallback.growthPreferences,
        ...parsed.growthPreferences,
      },
      progress: {
        ...fallback.progress,
        ...parsed.progress,
        levels: parsed.progress?.levels?.length
          ? parsed.progress.levels
          : fallback.progress.levels,
        levelResults: {
          ...fallback.progress.levelResults,
          ...parsed.progress?.levelResults,
        },
        exam: {
          ...fallback.progress.exam,
          ...parsed.progress?.exam,
          studentAnswers: {
            ...fallback.progress.exam.studentAnswers,
            ...parsed.progress?.exam?.studentAnswers,
          },
        },
        rewardProgress: {
          ...fallback.progress.rewardProgress,
          ...parsed.progress?.rewardProgress,
          studyDates: parsed.progress?.rewardProgress?.studyDates?.length
            ? normalizeStudyDates(parsed.progress.rewardProgress.studyDates)
            : fallback.progress.rewardProgress.studyDates,
          claimedStreakDays:
            parsed.progress?.rewardProgress?.claimedStreakDays ??
            fallback.progress.rewardProgress.claimedStreakDays,
          reviewedWrongQuestionIds:
            parsed.progress?.rewardProgress?.reviewedWrongQuestionIds ??
            fallback.progress.rewardProgress.reviewedWrongQuestionIds,
        },
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
  | { type: "recordStudyVisit"; dateKey?: string }
  | { type: "claimStreakReward"; days: number }
  | { type: "completeWrongQuestionReview"; questionId: string }
  | { type: "setLastVisitedRoute"; route: string }
  | { type: "markLevelInProgress"; levelId: LevelId }
  | { type: "completeLevel"; levelId: LevelId; result?: LevelResult }
  | {
      type: "submitExam";
      score: number;
      wrongQuestionIds: string[];
      studentAnswers: Record<string, number>;
    }
  | { type: "resetDemo" };

function reducer(state: AppState, action: AppAction): AppState {
  if (action.type === "signIn") {
    const nextSource = action.source ?? (action.token ? "api" : "mock");
    const isSameStudentSession =
      action.role === "student" &&
      state.role === "student" &&
      state.sessionAccount === action.account;

    return {
      ...state,
      role: action.role,
      sessionAccount: action.account,
      authToken: action.token ?? null,
      authSource: nextSource,
      studentProfile: isSameStudentSession ? state.studentProfile : null,
      growthPreferences: isSameStudentSession
        ? state.growthPreferences
        : createInitialState().growthPreferences,
      progress: isSameStudentSession ? state.progress : createInitialProgress(),
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

  if (action.type === "recordStudyVisit") {
    const dateKey = action.dateKey ?? getLocalDateKey();

    if (state.progress.rewardProgress.studyDates.includes(dateKey)) {
      return state;
    }

    return {
      ...state,
      progress: {
        ...state.progress,
        rewardProgress: {
          ...state.progress.rewardProgress,
          studyDates: normalizeStudyDates([
            ...state.progress.rewardProgress.studyDates,
            dateKey,
          ]),
        },
      },
    };
  }

  if (action.type === "claimStreakReward") {
    const availableRewardDays = getAvailableStreakRewardDays(
      state.progress.rewardProgress,
    );

    if (!availableRewardDays.includes(action.days)) {
      return state;
    }

    return {
      ...state,
      progress: {
        ...state.progress,
        points:
          state.progress.points + (STREAK_REWARD_POINTS[action.days] ?? 0),
        rewardProgress: {
          ...state.progress.rewardProgress,
          claimedStreakDays: [
            ...state.progress.rewardProgress.claimedStreakDays,
            action.days,
          ].sort((left, right) => left - right),
        },
      },
    };
  }

  if (action.type === "completeWrongQuestionReview") {
    if (!state.progress.exam.wrongQuestionIds.includes(action.questionId)) {
      return state;
    }

    if (
      state.progress.rewardProgress.reviewedWrongQuestionIds.includes(
        action.questionId,
      )
    ) {
      return state;
    }

    return {
      ...state,
      progress: {
        ...state.progress,
        points: state.progress.points + WRONG_QUESTION_REVIEW_REWARD,
        rewardProgress: {
          ...state.progress.rewardProgress,
          reviewedWrongQuestionIds: [
            ...state.progress.rewardProgress.reviewedWrongQuestionIds,
            action.questionId,
          ],
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

  if (action.type === "markLevelInProgress") {
    return state;
  }

  if (action.type === "completeLevel") {
    const levelIndex = state.progress.levels.findIndex(
      (level) => level.id === action.levelId,
    );

    if (levelIndex === -1) {
      return state;
    }

    if (state.progress.levels[levelIndex]?.status === "completed") {
      if (!action.result) {
        return state;
      }

      return {
        ...state,
        progress: {
          ...state.progress,
          levelResults: {
            ...state.progress.levelResults,
            [action.levelId]: action.result,
          },
        },
      };
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
        levelResults: action.result
          ? {
              ...state.progress.levelResults,
              [action.levelId]: action.result,
            }
          : state.progress.levelResults,
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
          studentAnswers: action.studentAnswers,
        },
      },
    };
  }

  if (action.type === "resetDemo") {
    return {
      ...createInitialState(),
      role: state.role,
      sessionAccount: state.sessionAccount,
      authToken: state.authToken,
      authSource: state.authSource,
      studentProfile: state.studentProfile,
      growthPreferences: state.growthPreferences,
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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

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
        source: options?.source,
      });

      if (role === "student") {
        dispatch({ type: "recordStudyVisit" });
      }
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
  const recordStudyVisit = useCallback(
    () => dispatch({ type: "recordStudyVisit" }),
    [],
  );
  const claimStreakReward = useCallback(
    (days: number) => dispatch({ type: "claimStreakReward", days }),
    [],
  );
  const completeWrongQuestionReview = useCallback(
    (questionId: string) =>
      dispatch({ type: "completeWrongQuestionReview", questionId }),
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
    (levelId: LevelId, result?: LevelResult) =>
      dispatch({ type: "completeLevel", levelId, result }),
    [],
  );
  const submitExam = useCallback(
    (
      score: number,
      wrongQuestionIds: string[],
      studentAnswers: Record<string, number>,
    ) =>
      dispatch({ type: "submitExam", score, wrongQuestionIds, studentAnswers }),
    [],
  );
  const resetDemo = useCallback(() => dispatch({ type: "resetDemo" }), []);

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
      completeLevel,
      markLevelInProgress,
      resetDemo,
      replaceProgress,
      recordStudyVisit,
      claimStreakReward,
      completeWrongQuestionReview,
      saveStudentProfile,
      saveGrowthPreferences,
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
