# V1 共享契约基线

本文档用于约束当前一体化版本的前后端交互结构，和 [docs/backend-frontend-handoff.md](/E:/实践部工作/启智科创/易班技术创新大会/project/docs/backend-frontend-handoff.md) 保持一致。

## 路由分组

### 学生端

- `/student/profile-setup`
- `/student/home`
- `/student/theme/road-safety`
- `/student/theme/road-safety/level/:levelId`
- `/student/theme/road-safety/level/:levelId/result`
- `/student/theme/road-safety/exam`
- `/student/theme/road-safety/exam/result`
- `/student/theme/road-safety/wrong-questions`
- `/student/ai`
- `/student/growth`
- `/student/records`
- `/student/ai-report`

### 教师端

- `/teacher/dashboard`
- `/teacher/classes`
- `/teacher/students`
- `/teacher/students/:studentId`

### 管理员端

- `/admin/dashboard`
- `/admin/themes`
- `/admin/levels`
- `/admin/question-bank`
- `/admin/ai-copy`
- `/admin/users`
- `/admin/stats`

## 共享基础类型

```ts
export type UserRole = "student" | "teacher" | "admin";
export type LearningStatus = "locked" | "available" | "in_progress" | "completed";
export type LevelId = "level-1" | "level-2" | "level-3";
export type StudentStage = "小学低段" | "小学中段" | "小学高段";
```

## 学生端核心结构

```ts
interface StudentProgress {
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
```

```ts
interface StudentRewardProgress {
  studyDates: string[];
  claimedStreakDays: number[];
  reviewedWrongQuestionIds: string[];
}
```

```ts
interface ExamProgress {
  status: LearningStatus;
  totalQuestions: number;
  score: number | null;
  wrongQuestionIds: string[];
  studentAnswers?: Partial<Record<string, number>>;
}
```

```ts
interface StudentRecordsResponse {
  overview: {
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
  };
  records: LearningRecordItem[];
}
```

```ts
interface StudentExamReviewResponse {
  totalWrongQuestions: number;
  suggestion: string;
  items: Array<{
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
  }>;
}
```

```ts
interface StudentGrowthResponse {
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
```

```ts
interface StudentAiReportResponse {
  completion: StudentAiReportCard;
  performance: StudentAiReportCard;
  suggestion: StudentAiReportCard;
  reward: StudentAiReportCard;
  growth: StudentAiReportCard;
}
```

## 教师端核心结构

```ts
interface TeacherClassManagementItem {
  id: string;
  name: string;
  studentCount: number;
  completedRate: number;
  examCompletionRate: number;
  focusLabel: string;
  description: string;
  createdAt: string;
}
```

```ts
interface TeacherStudentDetail {
  id: string;
  name: string;
  className: string;
  completedLevels: number;
  examStatus: string;
  score: number | null;
  lastActiveAt: string;
  weakSpot: string;
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
```

## 管理员端核心结构

```ts
interface ThemeManagementItem {
  id: string;
  title: string;
  description: string;
  coverLabel: string;
  coverAccent: "sky" | "mint" | "orange";
  coverIllustration: string;
  isOpen: boolean;
  sortOrder: number;
}
```

```ts
interface LevelManagementItem {
  id: LevelId;
  title: string;
  focus: string;
  duration: string;
  displayOrder: number;
  sceneAssetLabel: string;
  taskOutline: string[];
  rewardLabel: string;
  feedbackStyle: string;
  feedbackCopy: string;
  hotspotItems: string[];
  propItems: string[];
  targetAreaNotes: string[];
}
```

```ts
interface QuestionBankManagementItem {
  id: string;
  themeId: string;
  themeTitle: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  correctLabel: string;
  explanation: string;
  reviewLevelId: LevelId;
  status: "enabled" | "draft";
}
```

```ts
interface AiCopyTemplateItem {
  id: string;
  category: string;
  title: string;
  scene: string;
  promptText: string;
}
```

```ts
interface GrowthConfigItem {
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
```

## 行为约束

### 学生端

- 首次登录且 `studentProfile === null` 时，必须进入 `/student/profile-setup`。
- API 模式下，前端以 `GET /api/student/progress` 返回的关卡状态、考试状态、积分、徽章和错题为准，不自行推导。
- 关卡完成页必须消费 `POST /api/student/levels/:levelId/complete` 返回的 `{ progress, result }`。
- 错题页以 `GET /api/student/exam/review` 返回的题目详情为准；完成单题重学后调用 `POST /api/student/exam/review/:questionId/complete` 刷新成长结果。
- 成长页和 AI 结果页以 `GET /api/student/growth`、`GET /api/student/ai-report` 为准，不再使用本地成长规则推演。
- AI 助手统一走 `POST /api/ai/chat`，不直连 Spark。

### 教师端

- 班级页走 `GET /api/teacher/classes`、`POST /api/teacher/classes`、`PUT /api/teacher/classes/:id`。
- 学生列表页支持 `className`、`completionStatus`、`examStatus` 查询参数。
- 学生详情页以后端返回的完成情况、考试结果、成长状态和建议为主数据源。

### 管理员端

- 主题、关卡、题库、AI 文案页面使用显式保存流，但“保存”必须对应真实后端写请求。
- 用户管理页的停用/恢复动作必须调用 `PATCH /api/admin/users/:id`。
- 成长规则配置入口固定放在 `/admin/stats` 页面内，不新增新的一级导航。
- 未配置后端时可回退到预置数据模式，但只作为开发兜底。

## 联调环境约定

- 前端接口地址：`VITE_API_BASE_URL=http://127.0.0.1:3001`
- 前端默认地址：`http://127.0.0.1:5173`
- 后端默认地址：`http://127.0.0.1:3001`
- 健康检查：`GET /api/health`

## 当前 API 清单

### 鉴权

- `POST /api/auth/login`

### 学生端

- `POST /api/student/profile`
- `GET /api/student/progress`
- `POST /api/student/levels/:levelId/start`
- `POST /api/student/levels/:levelId/complete`
- `POST /api/student/exam/submit`
- `GET /api/student/records`
- `GET /api/student/exam/review`
- `POST /api/student/exam/review/:questionId/complete`
- `GET /api/student/growth`
- `PUT /api/student/growth/preferences`
- `GET /api/student/ai-report`
- `POST /api/ai/chat`

### 教师端

- `GET /api/teacher/dashboard`
- `GET /api/teacher/classes`
- `POST /api/teacher/classes`
- `PUT /api/teacher/classes/:id`
- `GET /api/teacher/students`
- `GET /api/teacher/students/:studentId`

### 管理员端

- `GET /api/admin/modules`
- `GET /api/admin/themes`
- `POST /api/admin/themes`
- `PUT /api/admin/themes/:id`
- `DELETE /api/admin/themes/:id`
- `GET /api/admin/levels`
- `PUT /api/admin/levels/:id`
- `GET /api/admin/question-bank`
- `POST /api/admin/question-bank`
- `PUT /api/admin/question-bank/:id`
- `DELETE /api/admin/question-bank/:id`
- `GET /api/admin/ai-copy`
- `POST /api/admin/ai-copy`
- `PUT /api/admin/ai-copy/:id`
- `DELETE /api/admin/ai-copy/:id`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id`
- `GET /api/admin/stats`
- `GET /api/admin/growth-config`
- `PUT /api/admin/growth-config`
