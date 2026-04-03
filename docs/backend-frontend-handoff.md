# 后端联调交接给前端同事

这份文档用于前端同事直接联调 `feature/backend-core-api` 分支上的后端接口。

## 当前状态

- 后端分支：`feature/backend-core-api`
- 技术栈：`Node.js + Express + TypeScript + SQLite`
- 鉴权方式：`Authorization: Bearer <token>`
- 默认端口：`3001`
- 昨天已完成的后端接口保持不变
- 本轮已补完真实 Spark 联机验收，前端接口形状没有变化

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

- 学生：`student001 / 123456`
- 教师：`teacher001 / 123456`
- 管理员：`admin001 / 123456`

## 已对齐的核心结构

后端按当前前端契约返回这些关键结构：

- `LoginResponse`
- `StudentProgress`
- `LevelResult`
- `ExamQuestion`
- `ExamQuestion.reviewLevelId`
- `ExamQuestion.reviewLabel`
- `ExamQuestion.reviewSuggestion`
- `TeacherDashboardResponse`
- `TeacherStudentDetail`
- `AdminModuleCard`
- `ThemeManagementItem`
- `LevelManagementItem`
- `QuestionBankManagementItem`
- `AiCopyTemplateItem`

## 学生端接口

### 1. 登录

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

说明：

- 学生首次登录时 `studentProfile` 可能为 `null`
- 此时前端应进入资料补全页

### 2. 获取学习进度

`GET /api/student/progress`

返回重点：

- 第一关默认 `available`
- 第二、三关默认 `locked`
- `points`、`badges`、`levelResults`、`exam` 都由后端统一计算

### 3. 保存学生资料

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

- 这个接口是为了让资料补全页能真正落后端
- 即使前端暂时没接，也不影响主链路

### 4. 开始关卡

`POST /api/student/levels/:levelId/start`

说明：

- 只允许进入 `available` 或 `in_progress` 的关卡
- 未解锁时后端返回 `409`
- 返回最新 `StudentProgress`

### 5. 完成关卡

`POST /api/student/levels/:levelId/complete`

返回：

```json
{
  "progress": { "...": "StudentProgress" },
  "result": { "...": "LevelResult" }
}
```

说明：

- 完成上一关后自动解锁下一关
- 完成三关后 `exam.status` 自动变成 `available`

### 6. 提交考试

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

- 三关没完成前提交会返回 `409`
- 当前版本一次学习流程只允许提交一次
- 提交后 `exam.status = completed`
- 返回最新 `StudentProgress`
- `wrongQuestionIds`、`score`、`points`、`badges` 以后端结果为准

### 7. AI 助手

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

说明：

- 只允许道路安全教育主题内问答
- 无关问题会拒答并引导回主题
- `hint` 只给方向，不给完整答案
- `welcome` / `hint` 在上游不可用时会回退到后台配置文案

真实 Spark 验收结论：

- `welcome`：已验证走真实 `spark`
- `hint`：已验证走真实 `spark`
- 主题内 `qa`：已验证走真实 `spark`
- 无关主题 `qa`：已验证走拒答逻辑，`provider=fallback`

## 教师端接口

- `GET /api/teacher/dashboard`
- `GET /api/teacher/students`
- `GET /api/teacher/students/:id`

说明：

- `stu-1` 会跟随真实学生主链路动态变化
- 其他学生仍保留稳定 seed/mock 数据，方便先联调页面

## 管理员端接口

读接口：

- `GET /api/admin/modules`
- `GET /api/admin/themes`
- `GET /api/admin/levels`
- `GET /api/admin/question-bank`
- `GET /api/admin/ai-copy`
- `GET /api/admin/users`
- `GET /api/admin/stats`

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

说明：

- 这些内容都已落到 SQLite，不再只是静态返回
- 题库和 AI 文案的修改会影响后端真实运行结果
- `level-1`、`level-2`、`level-3` 是 v1 固定三关，只开放更新，不开放新增/删除

## 前端接入注意点

- 非登录接口一律带 Bearer token
- 学生端不要自己计算关卡解锁、考试解锁、积分和徽章，直接以后端返回为准
- `complete level` 返回的是 `{ progress, result }`，不要只取 `progress`
- 错题结果请使用 `wrongQuestionIds` 配合题目的 `reviewLevelId` / `reviewLabel` / `reviewSuggestion`
- 管理员端表单如果做保存，直接接已有 `PUT` / `POST` / `DELETE` 即可

## 这轮补完了什么

- 没有新增前端契约字段
- 没有重做昨天已完成的后端接口
- 只补完了真实 Spark 联机验收和文档状态更新
- 前端现有接入方式保持不变
