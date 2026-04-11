export type UserRole = "student" | "teacher" | "admin";
export type ThemeAccent = "sky" | "mint" | "orange";
export type StudentStage = "小学低段" | "小学中段" | "小学高段";
export type AuthSource = "mock" | "api";
export type LearningStatus = "locked" | "available" | "in_progress" | "completed";
export type LevelId = "level-1" | "level-2" | "level-3";
export type GrowthDimensionId = "appearance" | "safety" | "scene";
export type LevelGameplayMode = "observation" | "route" | "guardian";
export type GuardianTaskType = "drag" | "tap" | "sequence";
export type ClassJoinRequestStatus = "pending" | "approved" | "rejected";
export type ObservationInteractionType =
  | "hotspot"
  | "danger_mark"
  | "state_judge"
  | "drag_marker";
export type ObservationTargetShape = "circle" | "pill" | "rect";
export type ObservationTargetAccent = "sky" | "mint" | "orange" | "danger";
export type LearningRecordType =
  | "login"
  | "profile_updated"
  | "level_started"
  | "level_completed"
  | "level_replayed"
  | "exam_unlocked"
  | "exam_completed"
  | "wrong_question_reviewed"
  | "growth_reward";
export type GrowthEventSourceType =
  | "level_completed"
  | "exam_completed"
  | "wrong_question_review"
  | "streak_bonus";

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  query?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends PaginationMeta {
  items: T[];
}

export interface ThemeCard {
  id: string;
  title: string;
  description: string;
  isOpen: boolean;
  progressLabel: string;
  cta: string;
  accent: ThemeAccent;
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

export interface AiKnowledgeItem {
  id: string;
  label: string;
  question: string;
  keywords: string[];
  answer: string;
}

export interface AiQuickPrompt {
  id: string;
  label: string;
  question: string;
  topic: string;
}

export interface StudentProfile {
  nickname: string;
  avatarId: string;
  avatarLabel: string;
  stage: StudentStage;
  studentNo?: string;
}

export interface StudentGrowthPreferences {
  appearance: string | null;
  scene: string | null;
}

export interface StudentRewardProgress {
  studyDates: string[];
  claimedStreakDays: number[];
  reviewedWrongQuestionIds: string[];
}

export interface ObservationTaskChoice {
  id: string;
  label: string;
  safe: boolean;
  feedback: string;
}

export interface ObservationSceneTarget {
  id: string;
  label: string;
  hint: string;
  top: number;
  left: number;
  width: number;
  height: number;
  shape: ObservationTargetShape;
  accent: ObservationTargetAccent;
}

export interface ObservationDragMarker {
  id: string;
  label: string;
  emoji: string;
  hint: string;
  targetId: string;
  successCopy: string;
}

export interface ObservationTaskStep {
  id: string;
  title: string;
  instruction: string;
  interactionType: ObservationInteractionType;
  targetIds: string[];
  successCopy: string;
  errorCopy: string;
  aiHint: string;
  choices?: ObservationTaskChoice[];
  stickerId?: string;
}

export interface ObservationSceneConfig {
  backgroundAsset: string;
  referenceLabel: string;
  sceneCaption: string;
  targets: ObservationSceneTarget[];
  dangerMarkers: ObservationSceneTarget[];
  dragMarkers: ObservationDragMarker[];
}

export interface ObservationLevelConfig {
  observationScene: ObservationSceneConfig;
  taskSteps: ObservationTaskStep[];
  midpointCopy: string;
  completionCopy: string;
}

export interface RouteChallengeChoice {
  id?: string;
  label: string;
  safe: boolean;
  feedback: string;
  safetyDelta?: number;
}

export interface RouteChallengeNode {
  id: string;
  title: string;
  mapLabel: string;
  scenario: string;
  hint: string;
  helperText: string;
  position: {
    top: number;
    left: number;
  };
  imageUrl?: string | null;
  sourcePageUrl?: string | null;
  options: RouteChallengeChoice[];
}

export interface RouteChallengeConfig {
  mapTitle: string;
  mapDescription: string;
  routeLabel: string;
  safetyLabel: string;
  currentRoleLabel: string;
  nodes: RouteChallengeNode[];
  completionCopy: string;
}

export interface GuardianTargetZone {
  top: number;
  left: number;
  width: number;
  height: number;
  label: string;
}

export interface GuardianTapTarget {
  id: string;
  label: string;
  hint: string;
  top: number;
  left: number;
  width: number;
  height: number;
  correct: boolean;
  feedback: string;
}

export interface GuardianSequenceItem {
  id: string;
  label: string;
  expectedOrder: number;
}

export interface GuardianChallengeStage {
  id: string;
  title: string;
  detail: string;
  toolLabel: string;
  toolHint: string;
  stageLabel: string;
  successText: string;
  taskType: GuardianTaskType;
  sceneImageUrl: string;
  sceneSourcePageUrl: string;
  sceneCaption: string;
  toolImageUrl?: string | null;
  toolSourcePageUrl?: string | null;
  toolCaption?: string | null;
  actionHint: string;
  targetZone?: GuardianTargetZone | null;
  tapTargets?: GuardianTapTarget[];
  sequenceItems?: GuardianSequenceItem[];
}

export interface GuardianChallengeConfig {
  stages: GuardianChallengeStage[];
  completionCopy: string;
}

export interface LevelBlueprint {
  id: LevelId;
  title: string;
  focus: string;
  description: string;
  duration: string;
  gameplayMode?: LevelGameplayMode;
  observationConfig?: ObservationLevelConfig | null;
  routeChallengeConfig?: RouteChallengeConfig | null;
  guardianChallengeConfig?: GuardianChallengeConfig | null;
}

export interface LevelProgress extends LevelBlueprint {
  status: LearningStatus;
}

export interface RouteChallengeOption extends RouteChallengeChoice {}
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
  reviewLevelId: LevelId;
  reviewLabel: string;
  reviewSuggestion: string;
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
  nextLevelLabel: string | null;
  streakDays: number;
  stageLabel: string;
  growthSummary: string;
  currentAppearance: string;
  currentScene: string;
  currentAbilityTag: string;
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
  studentNo?: string;
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
  classCode?: string;
  pendingApplications?: number;
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
  currentAppearance?: string;
  currentAbility?: string;
  currentScene?: string;
  growthLevelLabel?: string;
  levelStatuses: TeacherStudentLevelStatus[];
  wrongTopics: string[];
  recommendations: string[];
  growthPoints?: number;
  unlockedScenes?: string[];
}

export interface TeacherClassApplicationItem {
  id: string;
  studentId: string;
  studentNo?: string;
  studentName: string;
  requestedAt: string;
  currentClassName: string | null;
  status: ClassJoinRequestStatus;
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
  coverAccent: ThemeAccent;
  coverIllustration: string;
  isOpen: boolean;
  sortOrder: number;
}

export interface LevelManagementItem {
  id: LevelId;
  title: string;
  focus: string;
  duration: string;
  gameplayMode?: LevelGameplayMode;
  displayOrder: number;
  sceneAssetLabel: string;
  taskOutline: string[];
  rewardLabel: string;
  feedbackStyle: string;
  feedbackCopy: string;
  hotspotItems: string[];
  propItems: string[];
  targetAreaNotes: string[];
  observationScene?: ObservationSceneConfig | null;
  taskSteps?: ObservationTaskStep[];
  midpointCopy?: string;
  completionCopy?: string;
  routeChallengeConfig?: RouteChallengeConfig | null;
  guardianChallengeConfig?: GuardianChallengeConfig | null;
}

export interface QuestionBankManagementItem {
  id: string;
  themeId: string;
  themeTitle: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  correctLabel: string;
  explanation: string;
  reviewLevelId: LevelId;
  reviewLabel?: string;
  reviewSuggestion?: string;
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
  createdAt?: string;
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

export interface ExamProgress {
  status: LearningStatus;
  totalQuestions: number;
  score: number | null;
  wrongQuestionIds: string[];
  studentAnswers?: Partial<Record<string, number>>;
}

export interface LevelResult {
  levelId: LevelId;
  score: number;
  stars: number;
  completedAt: string;
  highlight: string;
  caution: string;
  aiSummary: string;
  keySafetyPoints?: string[];
  cautionPoints?: string[];
  rewardIcon?: string;
  rewardLabel?: string;
}

export interface LevelCompletionPayload {
  score: number;
  stars: number;
  highlight: string;
  caution: string;
  aiSummary: string;
  keySafetyPoints: string[];
  cautionPoints: string[];
  rewardIcon: string;
  rewardLabel: string;
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
  rewardProgress: StudentRewardProgress;
}

export interface StudentClassMembershipResponse {
  studentNo: string;
  currentClass: {
    id: string;
    name: string;
    classCode: string;
  } | null;
  pendingRequest: {
    id: string;
    classId: string;
    className: string;
    classCode: string;
    status: ClassJoinRequestStatus;
    requestedAt: string;
  } | null;
}

export interface AppState {
  role: UserRole | null;
  sessionAccount: string | null;
  authToken: string | null;
  authSource: AuthSource;
  studentProfile: StudentProfile | null;
  growthPreferences: StudentGrowthPreferences;
  progress: StudentProgress;
}
