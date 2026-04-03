export type UserRole = "student" | "teacher" | "admin";
export type AdminUserStatus = "active" | "paused";
export type LearningStatus =
  | "locked"
  | "available"
  | "in_progress"
  | "completed";
export type LevelId = "level-1" | "level-2" | "level-3";
export type StudentStage = "小学低段" | "小学中段" | "小学高段";
export type ThemeAccent = "sky" | "mint" | "orange";
export type GrowthDimensionId = "appearance" | "safety" | "scene";
export type LearningRecordType =
  | "login"
  | "profile_updated"
  | "level_started"
  | "level_completed"
  | "exam_unlocked"
  | "exam_completed"
  | "wrong_question_reviewed"
  | "growth_reward";
export type GrowthEventSourceType =
  | "level_completed"
  | "exam_completed"
  | "wrong_question_review"
  | "streak_bonus";

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

export interface LearningRecordItem {
  id: string;
  type: LearningRecordType;
  title: string;
  description: string;
  route: string;
  createdAt: string;
}

export interface StudentRecordOverview {
  themeId: string;
  themeTitle: string;
  completedLevels: number;
  totalLevels: number;
  examStatus: LearningStatus;
  examScore: number | null;
  lastVisitedRoute: string;
  lastLearnedAt: string | null;
  continueRoute: string;
  badges: string[];
  points: number;
}

export interface StudentRecordsResponse {
  overview: StudentRecordOverview;
  records: LearningRecordItem[];
}

export interface StudentExamReviewItem {
  questionId: string;
  prompt: string;
  studentAnswer: string | null;
  correctAnswer: string;
  explanation: string;
  reviewLevelId: LevelId;
  reviewLabel: string;
  reviewSuggestion: string;
  reviewed: boolean;
  reviewedAt: string | null;
}

export interface StudentExamReviewResponse {
  totalWrongQuestions: number;
  suggestion: string;
  items: StudentExamReviewItem[];
}

export interface GrowthDimensionSummary {
  id: GrowthDimensionId;
  label: string;
  points: number;
  level: number;
  progressPercent: number;
  currentUnlockLabel: string;
  nextUnlockLabel: string | null;
}

export interface GrowthHistoryItem {
  id: string;
  sourceType: GrowthEventSourceType;
  title: string;
  description: string;
  points: number;
  createdAt: string;
}

export interface GrowthThresholdItem {
  threshold: number;
  label: string;
  summary?: string;
}

export interface GrowthAwardConfigItem {
  appearancePoints: number;
  safetyPoints: number;
  scenePoints: number;
}

export interface GrowthConfigItem {
  id: string;
  title: string;
  levelAwards: Record<LevelId, GrowthAwardConfigItem>;
  levelThreeStarBonusRate: number;
  examBasePoints: number;
  examBonus80: number;
  examBonus90: number;
  examAppearanceRatio: number;
  examSafetyRatio: number;
  wrongQuestionReviewAward: GrowthAwardConfigItem;
  streakAwards: {
    threeDay: GrowthAwardConfigItem;
    sevenDay: GrowthAwardConfigItem;
  };
  appearanceThresholds: GrowthThresholdItem[];
  safetyThresholds: GrowthThresholdItem[];
  sceneThresholds: GrowthThresholdItem[];
  stageThresholds: Array<GrowthThresholdItem & { summary: string }>;
}

export interface StudentGrowthResponse {
  characterName: string;
  linkedAiRole: string;
  totalGrowthPoints: number;
  nextLevelTarget: number | null;
  nextLevelRemaining: number | null;
  streakDays: number;
  stageLabel: string;
  growthSummary: string;
  dimensions: GrowthDimensionSummary[];
  unlockedAppearances: string[];
  unlockedAbilityTags: string[];
  unlockedScenes: string[];
  history: GrowthHistoryItem[];
}

export interface StudentAiReportCard {
  title: string;
  summary: string;
  bullets: string[];
}

export interface StudentAiReportResponse {
  completion: StudentAiReportCard;
  performance: StudentAiReportCard;
  suggestion: StudentAiReportCard;
  reward: StudentAiReportCard;
  growth: StudentAiReportCard;
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

export interface TeacherClassManagementItem extends TeacherClassSummary {
  description: string;
  createdAt: string;
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
  growthPoints?: number;
  unlockedScenes?: string[];
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
  status: AdminUserStatus;
  lastActiveAt: string;
  note: string;
  createdAt?: string;
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

export interface UserRow {
  id: string;
  account: string;
  role: UserRole;
  password_hash: string;
  password_salt: string;
  display_name: string;
  status: AdminUserStatus;
  admin_note: string;
  created_at: string;
  updated_at: string;
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

export interface LearningRecordRow {
  id: string;
  user_id: string;
  record_type: LearningRecordType;
  title: string;
  description: string;
  route: string;
  meta_json: string;
  dedupe_key: string | null;
  created_at: string;
}

export interface StudentGrowthProfileRow {
  user_id: string;
  total_points: number;
  appearance_points: number;
  safety_points: number;
  scene_points: number;
  streak_days: number;
  last_learning_date: string | null;
  selected_appearance: string;
  selected_scene: string;
  updated_at: string;
}

export interface GrowthEventRow {
  id: string;
  user_id: string;
  source_type: GrowthEventSourceType;
  source_ref: string | null;
  title: string;
  description: string;
  points: number;
  appearance_points: number;
  safety_points: number;
  scene_points: number;
  dedupe_key: string | null;
  created_at: string;
}

export interface QuestionReviewProgressRow {
  user_id: string;
  question_id: string;
  reviewed_at: string;
  created_at: string;
}

export interface TeacherClassRow {
  id: string;
  teacher_user_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface GrowthConfigRow {
  id: string;
  title: string;
  config_json: string;
  updated_at: string;
}

export interface ThemeManagementRow {
  id: string;
  title: string;
  description: string;
  cover_label: string;
  is_open: number;
  sort_order: number;
  updated_at: string;
}

export interface LevelManagementRow {
  id: LevelId;
  title: string;
  focus: string;
  duration: string;
  reward_label: string;
  feedback_style: string;
  updated_at: string;
}

export interface QuestionBankRow {
  id: string;
  prompt: string;
  options_json: string;
  correct_index: number;
  correct_label: string;
  explanation: string;
  review_level_id: LevelId;
  review_label: string;
  review_suggestion: string;
  status: "enabled" | "draft";
  updated_at: string;
}

export interface AiCopyTemplateRow {
  id: string;
  category: string;
  title: string;
  scene: string;
  prompt_text: string;
  updated_at: string;
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
