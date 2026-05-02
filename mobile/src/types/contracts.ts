export type UserRole = "student" | "teacher" | "admin";
export type LevelId = "level-1" | "level-2" | "level-3";
export type LearningStatus = "locked" | "available" | "in_progress" | "completed";
export type LevelGameplayMode = "observation" | "route" | "guardian";

export interface LoginResponse {
  token: string;
  role: UserRole;
  account?: string;
  displayName?: string;
  studentProfile?: StudentProfile | null;
  progress?: StudentProgress | null;
}

export interface StudentProfile {
  nickname: string;
  avatarId: string;
  avatarLabel: string;
  stage: string;
  studentNo?: string;
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
}

export interface ObservationDragMarker {
  id: string;
  label: string;
  emoji?: string;
  hint: string;
  targetId: string;
  successCopy: string;
}

export interface ObservationTaskStep {
  id: string;
  title: string;
  instruction: string;
  interactionType: "hotspot" | "danger_mark" | "state_judge" | "drag_marker";
  targetIds: string[];
  successCopy: string;
  errorCopy: string;
  aiHint: string;
  choices?: ObservationTaskChoice[];
  stickerId?: string;
}

export interface ObservationLevelConfig {
  observationScene: {
    sceneCaption: string;
    targets: ObservationSceneTarget[];
    dangerMarkers: ObservationSceneTarget[];
    dragMarkers: ObservationDragMarker[];
  };
  taskSteps: ObservationTaskStep[];
  midpointCopy: string;
  completionCopy: string;
}

export interface RouteChallengeChoice {
  id: string;
  label: string;
  safe: boolean;
  feedback: string;
  safetyDelta: number;
}

export interface RouteChallengeNode {
  id: string;
  title: string;
  mapLabel: string;
  scenario: string;
  hint: string;
  helperText: string;
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

export interface GuardianTapTarget {
  id: string;
  label: string;
  hint: string;
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
  taskType: "drag" | "tap" | "sequence";
  sceneCaption: string;
  actionHint: string;
  tapTargets?: GuardianTapTarget[];
  sequenceItems?: GuardianSequenceItem[];
}

export interface GuardianChallengeConfig {
  stages: GuardianChallengeStage[];
  completionCopy: string;
}

export interface LevelProgress {
  id: LevelId;
  title: string;
  focus: string;
  description: string;
  duration: string;
  gameplayMode?: LevelGameplayMode;
  observationConfig?: ObservationLevelConfig | null;
  routeChallengeConfig?: RouteChallengeConfig | null;
  guardianChallengeConfig?: GuardianChallengeConfig | null;
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

export interface CompleteLevelResponse {
  progress: StudentProgress;
  result?: LevelResult;
}

export interface ExamProgress {
  status: LearningStatus;
  totalQuestions: number;
  score: number | null;
  wrongQuestionIds: string[];
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

export interface StudentExamAnswer {
  questionId: string;
  selectedIndex: number;
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

export interface LearningRecordItem {
  id: string;
  type: string;
  title: string;
  description: string;
  route: string;
  createdAt: string;
}

export interface StudentRecordsResponse {
  overview: {
    completedLevels: number;
    totalLevels: number;
    examStatus: LearningStatus;
    examScore: number | null;
    lastVisitedRoute: string;
    lastLearnedAt: string | null;
    points: number;
    badges: string[];
  };
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

export interface CompleteWrongQuestionReviewResponse {
  review?: StudentExamReviewItem;
  growth: StudentGrowthResponse;
}

export interface StudentGrowthResponse {
  characterName: string;
  totalGrowthPoints: number;
  stageLabel: string;
  growthSummary: string;
  currentAppearance: string;
  currentScene: string;
  currentAbilityTag: string;
}

export interface AiChatRequest {
  scene: "welcome" | "hint" | "qa";
  levelId?: LevelId;
  message: string;
}

export interface AiChatResponse {
  reply: string;
  suggestions: string[];
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

export interface TeacherDashboardResponse {
  classSummaries: TeacherClassSummary[];
  students: TeacherStudentSummary[];
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
}
