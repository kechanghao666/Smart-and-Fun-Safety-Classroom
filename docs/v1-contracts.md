# V1 共享契约基线

## 路由分组

- 学生端
  - `/student/profile-setup`
  - `/student/home`
  - `/student/theme/road-safety`
  - `/student/theme/road-safety/level/:levelId`
  - `/student/theme/road-safety/level/:levelId/result`
  - `/student/theme/road-safety/exam`
  - `/student/growth`
  - `/student/records`
  - `/student/ai-report`
- 教师端
  - `/teacher/dashboard`
  - `/teacher/students`
  - `/teacher/students/:studentId`
- 管理员端
  - `/admin/dashboard`

## 共享状态枚举

```ts
type LearningStatus = "locked" | "available" | "in_progress" | "completed";
type UserRole = "student" | "teacher" | "admin";
type LevelId = "level-1" | "level-2" | "level-3";
```

## 学生学习状态

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
}
```

```ts
interface LevelResult {
  levelId: LevelId;
  score: number;
  stars: number;
  completedAt: string;
  highlight: string;
  caution: string;
  aiSummary: string;
}
```

```ts
interface ExamQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  reviewLevelId: LevelId;
  reviewLabel: string;
  reviewSuggestion: string;
}
```

## 当前前端基线新增状态

```ts
interface StudentProfile {
  nickname: string;
  avatarId: string;
  avatarLabel: string;
  stage: "小学低段" | "小学中段" | "小学高段";
}

interface AppState {
  role: UserRole | null;
  sessionAccount: string | null;
  studentProfile: StudentProfile | null;
  progress: StudentProgress;
}
```

## 当前前端原型默认规则

- 学生首次登录后，未完善资料时优先进入 `/student/profile-setup`
- 第一关默认 `available`
- 第二、三关默认 `locked`
- 完成前一关后，下一关切为 `available`
- 每关完成后进入独立结算页 `/student/theme/road-safety/level/:levelId/result`
- 三关完成后，主题考试切为 `available`
- 考试提交后切为 `completed`
- 考试页采用题号导航 + 上一题/下一题 + 统一提交结构
- 考试提交后在同页展示错题、正确答案、解析和建议回看关卡
- 成长档案页 `/student/growth` 基于积分、关卡结算、考试成绩和徽章派生成长阶段展示
- 学生端任意页面切换时更新 `lastVisitedRoute`

## 协作注意事项

- 页面和状态判断统一复用 `frontend/src/types.ts`
- 本地 mock 数据统一维护在 `frontend/src/data/mockData.ts`
- 需要改动积分、徽章、解锁条件时，同步更新 `frontend/src/state/AppState.tsx`
- 接入真实后端后，先保持字段名不变，再逐步替换数据源
