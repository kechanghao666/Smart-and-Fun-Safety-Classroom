export type UserRole = "student" | "teacher" | "admin";
export type ThemeAccent = "sky" | "mint" | "orange";
export type StudentStage = "小学低段" | "小学中段" | "小学高段";

export type LearningStatus =
  | "locked"
  | "available"
  | "in_progress"
  | "completed";

export type LevelId = "level-1" | "level-2" | "level-3";

export interface ThemeCard {
  id: string;
  title: string;
  description: string;
  isOpen: boolean;
  progressLabel: string;
  cta: string;
  accent: ThemeAccent;
}

export interface LevelBlueprint {
  id: LevelId;
  title: string;
  focus: string;
  description: string;
  duration: string;
}

export interface LevelProgress extends LevelBlueprint {
  status: LearningStatus;
}

export interface RouteChallengeOption {
  label: string;
  safe: boolean;
  feedback: string;
}

export interface RouteChallengeStep {
  id: string;
  scenario: string;
  options: RouteChallengeOption[];
}

export interface GuardianTask {
  id: string;
  label: string;
  hint: string;
}

export interface ExamQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AiKnowledgeItem {
  id: string;
  label: string;
  question: string;
  keywords: string[];
  answer: string;
}

export interface DemoAccount {
  account: string;
  password: string;
  role: UserRole;
  roleLabel: string;
  displayName: string;
}

export interface AvatarOption {
  id: string;
  label: string;
  shortLabel: string;
  accent: ThemeAccent;
}

export interface StudentProfile {
  nickname: string;
  avatarId: string;
  avatarLabel: string;
  stage: StudentStage;
}

export interface TeacherStudentSummary {
  id: string;
  name: string;
  className: string;
  completedLevels: number;
  examStatus: string;
  score: number | null;
  lastActiveAt: string;
  weakSpot: string;
}

export interface AdminModuleCard {
  id: string;
  title: string;
  description: string;
  ownerSuggestion: string;
  status: string;
}

export interface ExamProgress {
  status: LearningStatus;
  totalQuestions: number;
  score: number | null;
  wrongQuestionIds: string[];
}

export interface StudentProgress {
  themeId: string;
  themeTitle: string;
  lastVisitedRoute: string;
  points: number;
  badges: string[];
  levels: LevelProgress[];
  exam: ExamProgress;
}

export interface AppState {
  role: UserRole | null;
  sessionAccount: string | null;
  studentProfile: StudentProfile | null;
  progress: StudentProgress;
}
