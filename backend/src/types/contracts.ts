export type UserRole = "student" | "teacher" | "admin";
export type LearningStatus =
  | "locked"
  | "available"
  | "in_progress"
  | "completed";
export type LevelId = "level-1" | "level-2" | "level-3";
export type StudentStage = "小学低段" | "小学中段" | "小学高段";
export type ThemeAccent = "sky" | "mint" | "orange";

export interface StudentProfile {
  nickname: string;
  avatarId: string;
  avatarLabel: string;
  stage: StudentStage;
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

export interface LevelResult {
  levelId: LevelId;
  score: number;
  stars: number;
  completedAt: string;
  highlight: string;
  caution: string;
  aiSummary: string;
}

export interface ExamQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  reviewLevelId: LevelId;
  reviewLabel: string;
  reviewSuggestion: string;
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
  levelResults: Partial<Record<LevelId, LevelResult>>;
  exam: ExamProgress;
}

export interface LoginResponse {
  token: string;
  role: UserRole;
  account?: string;
  displayName?: string;
  studentProfile?: StudentProfile | null;
  progress?: StudentProgress | null;
}

export interface StudentExamAnswer {
  questionId: string;
  selectedIndex: number;
}

export interface CompleteLevelResponse {
  progress: StudentProgress;
  result?: LevelResult;
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

export interface TeacherClassSummary {
  id: string;
  name: string;
  studentCount: number;
  completedRate: number;
  examCompletionRate: number;
  focusLabel: string;
}

export interface TeacherStudentLevelStatus {
  levelId: LevelId;
  title: string;
  status: LearningStatus;
  score: number | null;
  note: string;
}

export interface TeacherStudentDetail extends TeacherStudentSummary {
  growthStage: string;
  growthSummary: string;
  motivationLabel: string;
  levelStatuses: TeacherStudentLevelStatus[];
  wrongTopics: string[];
  recommendations: string[];
}

export interface AdminModuleCard {
  id: string;
  title: string;
  description: string;
  ownerSuggestion: string;
  status: string;
}

export interface ThemeManagementItem {
  id: string;
  title: string;
  description: string;
  coverLabel: string;
  isOpen: boolean;
  sortOrder: number;
}

export interface LevelManagementItem {
  id: LevelId;
  title: string;
  focus: string;
  duration: string;
  rewardLabel: string;
  feedbackStyle: string;
}

export interface QuestionBankManagementItem {
  id: string;
  prompt: string;
  correctLabel: string;
  explanation: string;
  reviewLevelId: LevelId;
  status: "enabled" | "draft";
}

export interface AiCopyTemplateItem {
  id: string;
  category: string;
  title: string;
  scene: string;
  promptText: string;
}

export interface AdminUserSummary {
  id: string;
  name: string;
  role: UserRole;
  status: "active" | "paused";
  lastActiveAt: string;
  note: string;
}

export interface AdminStatMetric {
  id: string;
  label: string;
  value: string;
  trend: string;
  accent: ThemeAccent;
}

export interface AuthenticatedUser {
  id: string;
  account: string;
  role: UserRole;
  displayName: string;
}

export interface StudentProfileRow {
  user_id: string;
  nickname: string | null;
  avatar_id: string | null;
  avatar_label: string | null;
  stage: StudentStage | null;
  class_name: string;
  base_points: number;
  starter_badges_json: string;
  last_visited_route: string;
  created_at: string;
  updated_at: string;
}

export interface LevelProgressRow {
  user_id: string;
  level_id: LevelId;
  status: LearningStatus;
  score: number | null;
  stars: number | null;
  highlight: string | null;
  caution: string | null;
  ai_summary: string | null;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

export interface ExamSubmissionRow {
  id: string;
  user_id: string;
  answers_json: string;
  score: number;
  wrong_question_ids_json: string;
  submitted_at: string;
}

export interface AiChatRequest {
  scene: "welcome" | "hint" | "qa";
  levelId?: LevelId;
  message?: string;
}

export interface AiChatResponse {
  reply: string;
  suggestions?: string[];
}
