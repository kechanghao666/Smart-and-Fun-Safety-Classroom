# V1 共享契约基线

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

## 共享状态枚举

```ts
type LearningStatus = "locked" | "available" | "in_progress" | "completed";
type UserRole = "student" | "teacher" | "admin";
type LevelId = "level-1" | "level-2" | "level-3";
```

## 学生核心数据结构

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
interface ExamProgress {
  status: LearningStatus;
  totalQuestions: number;
  score: number | null;
  wrongQuestionIds: string[];
  studentAnswers?: Partial<Record<string, number>>;
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

## 前端扩展状态

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

## 当前前端行为规则

- 学生首次登录后，未完善资料时优先进入 `/student/profile-setup`。
- 学生端统一采用“顶部导航 + 主内容区 + 右下角 AI 浮窗”布局。
- 教师端与管理员端统一采用“左侧菜单 + 右侧内容区”布局。
- 第一关默认 `available`。
- 第二关、第三关默认 `locked`。
- 完成前一关后，下一关切为 `available`。
- 每关完成后进入独立结算页 `/student/theme/road-safety/level/:levelId/result`。
- 三关完成后，主题考试切为 `available`。
- 主题页在考试解锁时会弹出居中的“已解锁主题考试”提示层。
- 考试页只负责答题与统一提交。
- 考试提交成功后进入独立结果页 `/student/theme/road-safety/exam/result`。
- 错题独立展示在 `/student/theme/road-safety/wrong-questions`。
- 错题页优先读取 `progress.exam.studentAnswers` 展示学生作答；该字段当前作为前端本地回看缓存使用。
- 成长档案页 `/student/growth` 基于积分、关卡结算、考试成绩和徽章派生成长阶段展示。
- 学生端壳层会在积分跨过成长阶段阈值时弹出居中升级提醒。
- 学生端任意页面切换时会更新 `lastVisitedRoute`。

## 联调模式约定

- 在 `frontend/.env.local` 中配置 `VITE_API_BASE_URL=http://localhost:3000` 后，登录页切换为后端联调模式。
- 未配置 `VITE_API_BASE_URL` 时，默认继续使用本地示例账号和前端状态。
- 登录接口 `POST /api/auth/login` 至少返回 `token`、`role`，并可选返回 `account`、`studentProfile`、`progress`。
- 当前前端在切换到新的学生账号、教师账号或管理员账号时，会主动清空上一位学生的本地资料和学习进度；只有“同一个学生账号重新登录”时才会沿用本地资料等待后端刷新。
- 学生端在后端联调模式下会于进入学生壳层时自动请求一次 `GET /api/student/progress`，窗口重新聚焦后也会静默刷新；顶部同时保留“刷新进度”入口。
- 学生首页 AI 欢迎卡调用 `POST /api/ai/chat`，使用 `scene: "welcome"`。
- 学生主题页 AI 提醒卡与关卡页 AI 提示卡调用 `POST /api/ai/chat`，使用 `scene: "hint"`。
- AI 接口失败时，前端自动回退为本地提示，不阻断学习流程。
- AI 结果卡页继续采用“数据 + 模板”生成，不依赖真实 AI 返回。

## 预留接口

### 学生端
- `GET /api/student/progress`
- `POST /api/student/levels/:levelId/start`
- `POST /api/student/levels/:levelId/complete`
- `POST /api/student/exam/submit`
- `POST /api/ai/chat`

### 教师端
- `GET /api/teacher/dashboard`
- `GET /api/teacher/students`
- `GET /api/teacher/students/:studentId`

### 管理员端
- `GET /api/admin/modules`
- `GET /api/admin/themes`
- `GET /api/admin/levels`
- `GET /api/admin/question-bank`
- `GET /api/admin/ai-copy`
- `GET /api/admin/users`
- `GET /api/admin/stats`

## 教师端与管理员端补充约定

- 教师首页、班级页、学生列表页、学生详情页统一采用“读取接口优先，失败后回退 mock”的工作流，并在页面上明确展示当前数据来源。
- 教师首页包含当前班级选择器，学生列表页包含完成状态筛选，班级页补充前端本地“创建班级 / 编辑班级草稿”流程，但本轮不新增真实后端写接口。
- 教师学生详情页稳定展示四类信息：学习闭环概览、关卡表现、考试状态与风险点、教师建议动作。
- 管理后台的主题、关卡、题库、AI 文案四个编辑页统一采用显式保存工作流：编辑后先进入未保存状态，点击保存后写入 `localStorage`。
- 管理后台编辑页允许“撤销未保存修改”和“恢复同步 / 默认数据”，但本轮不新增真实后端写接口。
- 管理员用户管理页补充 `createdAt` 展示位与“异常账号处理”确认弹窗；停用/恢复动作当前仅写入前端本地工作台状态。
- 管理后台中的“保存成功”仅表示本地工作稿已更新，不代表已经写入服务器；后续若接真实写接口，再统一替换保存目标。
