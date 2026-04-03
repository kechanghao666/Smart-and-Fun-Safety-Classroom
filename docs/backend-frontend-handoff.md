# 后端联调交接给前端同事

这份文档用于前端同事直接联调 `feature/backend-core-api` 分支上的后端接口。当前后端已按说明书补齐学生主链路、成长体系、教师班级与学生查看、管理员内容管理/用户管理/成长配置，并完成真实 Spark 联机验收。

## 当前状态

- 后端分支：`feature/backend-core-api`
- 技术栈：`Node.js + Express + TypeScript + SQLite`
- 鉴权方式：`Authorization: Bearer <token>`
- 默认端口：`3001`
- AI 统一走后端代理，前端不能直连 Spark
- 前端契约字段没有被破坏，新增的是后端支撑接口

## 本地启动

仓库根目录执行：

```bash
npm install
npm run dev:backend
```

健康检查：

```bash
GET http://127.0.0.1:3001/api/health
```

## Seed 账号

固定账号：

- 学生：`student001 / 123456`
- 教师：`teacher001 / 123456`
- 管理员：`admin001 / 123456`

额外统计账号：

- `student002 / 123456`
- `student003 / 123456`
- `student004 / 123456`

说明：

- `student001` 默认是“首次登录待补全资料”状态，适合验证登录和资料补全页。
- 额外学生用于教师班级统计、筛选和管理员统计联调。

## 已对齐的核心结构

后端保持并返回这些关键结构：

- `LoginResponse`
- `StudentProgress`
- `LevelResult`
- `ExamQuestion`
- `ExamQuestion.reviewLevelId`
- `ExamQuestion.reviewLabel`
- `ExamQuestion.reviewSuggestion`
- `StudentRecordsResponse`
- `StudentExamReviewResponse`
- `StudentGrowthResponse`
- `StudentAiReportResponse`
- `TeacherDashboardResponse`
- `TeacherClassManagementItem`
- `TeacherStudentDetail`
- `AdminModuleCard`
- `ThemeManagementItem`
- `LevelManagementItem`
- `QuestionBankManagementItem`
- `AiCopyTemplateItem`
- `GrowthConfigItem`

## 通用接入规则

- 除 `POST /api/auth/login` 外，所有接口都要带 Bearer token：

```http
Authorization: Bearer <token>
```

- 后端会根据 token 里的登录角色限制访问范围，前端不需要再模拟一套角色权限。
- `paused` 状态用户会被后端直接拒绝登录或踢出会话。

## 登录与资料补全

### 登录

`POST /api/auth/login`

请求：

```json
{
  "account": "student001",
  "password": "123456"
}
```

返回重点：

- `token`
- `role`
- `account`
- `displayName`
- `studentProfile`
- `progress`

学生端注意：

- `studentProfile === null` 代表首次登录，需要进入资料补全页。
- 资料补全完成后，建议立即刷新一次 `GET /api/student/progress`，让首页状态和角色欢迎文案一致。

### 资料补全

`POST /api/student/profile`

请求：

```json
{
  "nickname": "小安",
  "avatarId": "sunny-guard",
  "avatarLabel": "阳光小卫士",
  "stage": "小学中段"
}
```

说明：

- 资料会真正落库，不再只是前端本地状态。
- 后端会同步更新 `lastVisitedRoute` 和学习记录。

## 学生端主链路

### 1. 获取学习进度

`GET /api/student/progress`

你可以直接使用这些关键字段：

- `themeId`
- `themeTitle`
- `lastVisitedRoute`
- `points`
- `badges`
- `levels`
- `levelResults`
- `exam`

规则由后端统一控制：

- 第一关默认 `available`
- 第二、三关默认 `locked`
- 完成前一关后自动解锁下一关
- 三关全部完成后 `exam.status = available`
- 提交考试后 `exam.status = completed`
- `points`、`badges`、`wrongQuestionIds`、`levelResults` 一律以后端返回为准

### 2. 开始关卡

`POST /api/student/levels/:levelId/start`

说明：

- 只允许进入 `available` 或 `in_progress` 的关卡
- 未解锁时返回 `409`
- 返回最新 `StudentProgress`

### 3. 完成关卡

`POST /api/student/levels/:levelId/complete`

返回：

```json
{
  "progress": { "...": "StudentProgress" },
  "result": { "...": "LevelResult" }
}
```

前端注意：

- 关卡结算页不要只取 `progress`，还要消费 `result`
- `result` 里有星级、奖励、结果摘要，适合直接渲染结算页

### 4. 提交考试

`POST /api/student/exam/submit`

请求：

```json
{
  "answers": [
    { "questionId": "q-1", "selectedIndex": 1 },
    { "questionId": "q-2", "selectedIndex": 1 },
    { "questionId": "q-3", "selectedIndex": 2 }
  ]
}
```

说明：

- 三关未完成前提交会返回 `409`
- 当前版本单次学习流程只允许提交一次
- 提交后 `exam.status = completed`
- 返回更新后的完整 `StudentProgress`

## 学习记录、错题回看、成长档案、AI 结果卡片

### 学习记录

`GET /api/student/records`

适合对接：

- 学习记录页 `/student/records`
- 首页“最近学习轨迹”
- 学习回顾列表

返回会包含：

- 学习记录列表
- 最近一次学习时间
- 已完成关卡数
- 是否已完成考试

### 错题回看

`GET /api/student/exam/review`

适合对接：

- 考试反馈页里的错题区
- 独立错题回看页

返回每道错题会包含：

- `questionId`
- `prompt`
- `studentAnswer`
- `correctAnswer`
- `explanation`
- `reviewLevelId`
- `reviewLabel`
- `reviewSuggestion`
- `reviewed`
- `reviewedAt`

错题回看完成：

`POST /api/student/exam/review/:questionId/complete`

作用：

- 标记该错题已完成重学
- 触发后端成长值奖励
- 返回最新成长档案，便于前端即时刷新成长展示

### 成长档案

`GET /api/student/growth`

适合对接：

- 成长档案页 `/student/growth`
- 学生个人成长弹窗

返回重点：

- `totalGrowthPoints`
- 三类成长维度当前值
- 当前成长阶段
- 已解锁外观
- 已解锁场景
- 成长历史列表

### AI 结果卡片

`GET /api/student/ai-report`

适合对接：

- AI 学习结果页 `/student/ai-report`
- 考试后 AI 反馈卡片

当前后端返回 5 张卡片：

- `completion`
- `performance`
- `suggestion`
- `reward`
- `growth`

## AI 助手

`POST /api/ai/chat`

请求示例：

```json
{
  "scene": "welcome"
}
```

```json
{
  "scene": "hint",
  "levelId": "level-2",
  "message": "我卡住了"
}
```

```json
{
  "scene": "qa",
  "message": "为什么过马路要走斑马线？"
}
```

返回：

```json
{
  "reply": "…",
  "suggestions": ["…", "…"]
}
```

规则：

- 只允许道路安全教育主题内问答
- 无关问题会拒答并引导回主题
- `hint` 只能给方向，不能直接给完整答案
- 上游不可用时会按配置选择 fallback

真实 Spark 验收结论：

- `welcome`：已验证走真实 `spark`
- `hint`：已验证走真实 `spark`
- 主题内 `qa`：已验证走真实 `spark`
- 无关主题 `qa`：已验证走拒答逻辑，记录 `provider=fallback`

## 教师端接口

### 班级管理

- `GET /api/teacher/classes`
- `POST /api/teacher/classes`
- `PUT /api/teacher/classes/:id`

适合对接：

- 教师班级总览
- 班级创建弹窗
- 班级编辑表单

### 教师仪表盘

- `GET /api/teacher/dashboard`

适合对接：

- 教师首页总览卡片
- 班级学习概览
- 异常提醒

### 学生列表与详情

- `GET /api/teacher/students`
- `GET /api/teacher/students/:id`

`GET /api/teacher/students` 支持这些查询参数：

- `className`
- `completionStatus`
- `examStatus`

说明：

- `stu-1` 会跟随真实学生主链路动态变化
- 其他学生是稳定 seed 数据，用于保证教师页面稳定联调
- 详情页已经带成长阶段、成长值、考试表现、学习记录摘要

## 管理员端接口

### 内容管理

读接口：

- `GET /api/admin/modules`
- `GET /api/admin/themes`
- `GET /api/admin/levels`
- `GET /api/admin/question-bank`
- `GET /api/admin/ai-copy`
- `GET /api/admin/growth-config`

写接口：

- `POST /api/admin/themes`
- `PUT /api/admin/themes/:id`
- `DELETE /api/admin/themes/:id`
- `PUT /api/admin/levels/:id`
- `POST /api/admin/question-bank`
- `PUT /api/admin/question-bank/:id`
- `DELETE /api/admin/question-bank/:id`
- `POST /api/admin/ai-copy`
- `PUT /api/admin/ai-copy/:id`
- `DELETE /api/admin/ai-copy/:id`
- `PUT /api/admin/growth-config`

说明：

- 这些内容都已落到 SQLite，不再只是静态返回
- 题库和 AI 文案的修改会影响真实业务结果
- `level-1`、`level-2`、`level-3` 是 v1 固定三关，只开放更新

### 用户管理与统计

- `GET /api/admin/users`
- `PATCH /api/admin/users/:id`
- `GET /api/admin/stats`

`GET /api/admin/users` 支持查询参数：

- `query`
- `status`
- `role`

`PATCH /api/admin/users/:id` 支持：

- `status`
- `note`

用户状态说明：

- `active`：正常可登录
- `paused`：后端直接拒绝登录，并清理已有会话

## 前端接入时最需要注意的点

- 不要在前端重新维护一套关卡状态机
- 不要自己计算考试是否解锁
- 不要自己计算积分、徽章、成长值和成长阶段
- `complete level` 返回的是 `{ progress, result }`
- 错题页直接使用后端返回的完整错题详情
- AI 只调 `/api/ai/chat`，不要直连上游模型
- 管理员页现在不是 mock，保存后会真实影响后端运行结果

## 这轮后端新增支撑的页面能力

- 学习记录页
- 错题回看页
- 成长档案页
- AI 结果卡片页
- 教师班级管理页
- 教师学生筛选页
- 管理员用户管理页
- 管理员成长规则配置页

## 如果你只想记住一句话

学生主链路、成长体系、AI、教师班级与学生查看、管理员内容/用户/成长配置都已经能联调；前端只需要按现有契约取值和渲染，不要在前端自己再算业务状态。
