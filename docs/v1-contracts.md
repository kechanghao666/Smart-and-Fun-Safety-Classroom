# V1 共享契约基线

## 路由分组

- 学生端
  - `/student/profile-setup`
  - `/student/home`
  - `/student/theme/road-safety`
  - `/student/theme/road-safety/level/:levelId`
  - `/student/theme/road-safety/level/:levelId/result`
  - `/student/theme/road-safety/exam`
  - `/student/ai`
  - `/student/growth`
  - `/student/records`
  - `/student/ai-report`
- 教师端
  - `/teacher/classes`
  - `/teacher/dashboard`
  - `/teacher/students`
  - `/teacher/students/:studentId`
- 管理员端
  - `/admin/dashboard`
  - `/admin/themes`
  - `/admin/levels`
  - `/admin/question-bank`
  - `/admin/ai-copy`
  - `/admin/users`
  - `/admin/stats`

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
  authToken: string | null;
  authSource: "mock" | "api";
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

## 前端联调约定

- `frontend/.env.local` 中配置 `VITE_API_BASE_URL=http://localhost:3000` 后，登录页切换为后端联调模式
- 未配置 `VITE_API_BASE_URL` 时，默认继续使用本地示例账号和前端状态
- 登录接口约定：`POST /api/auth/login` 至少返回 `token`、`role`，并可选返回 `account`、`studentProfile`、`progress`
- 前端在切换到新的学生账号、教师账号或管理员账号时，会主动清空上一位学生的本地资料和学习进度，避免跨账号残留；只有“同一个学生账号重新登录”时才会沿用本地资料等待后端刷新
- 学生端在后端联调模式下会于进入学生壳层时自动请求一次 `GET /api/student/progress`，窗口重新聚焦后也会静默刷新；页面顶部同时保留“刷新进度”手动入口
- 学生首页与主题页的 AI 欢迎卡/提醒卡会调用 `POST /api/ai/chat`，分别使用 `scene: "welcome"` 与 `scene: "hint"`；接口失败时前端自动回退为本地提示
- 学生端接口预留：
  - `GET /api/student/progress`
  - `POST /api/student/levels/:levelId/start`
  - `POST /api/student/levels/:levelId/complete`
  - `POST /api/student/exam/submit`
  - `POST /api/ai/chat`
- 教师端接口预留：
  - `GET /api/teacher/dashboard`
  - `GET /api/teacher/students`
  - `GET /api/teacher/students/:studentId`
- 管理员端接口预留：
  - `GET /api/admin/modules`
  - `GET /api/admin/themes`
  - `GET /api/admin/levels`
  - `GET /api/admin/question-bank`
  - `GET /api/admin/ai-copy`
  - `GET /api/admin/users`
  - `GET /api/admin/stats`
