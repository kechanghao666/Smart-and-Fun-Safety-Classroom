# 后端联调交接给前端同事

这份文档用于前端同事直接联调 `feature/backend-core-api` 分支上的后端接口。

## 当前状态

- 后端分支：`feature/backend-core-api`
- 技术栈：`Node.js + Express + TypeScript + SQLite`
- 鉴权方式：`Authorization: Bearer <token>`
- 默认端口：`3001`
- 本轮未做真实 Spark 密钥联机验证，但 `/api/ai/chat` 的后端代理和 fallback 已可用

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

后端已按当前前端契约返回这些关键结构：

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

- 这个接口是我额外补的，方便你们把资料补全页真正落到后端
- 当前前端如果暂时还没接这个接口，也不会影响其他主链路

### 4. 开始关卡

`POST /api/student/levels/:levelId/start`

说明：

- 只能启动 `available` 或 `in_progress` 的关卡
- 如果当前关卡未解锁，后端会返回 `409`
- 返回最新 `StudentProgress`

### 5. 完成关卡

`POST /api/student/levels/:levelId/complete`

说明：

- 返回：

```json
{
  "progress": { "...": "StudentProgress" },
  "result": { "...": "LevelResult" }
}
```

- 完成上一关后会自动解锁下一关
- 完成三关后 `exam.status` 会自动变成 `available`

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
- 考试只允许本轮提交一次
- 提交后 `exam.status = completed`
- 返回最新 `StudentProgress`
- `wrongQuestionIds`、`score`、`points`、`badges` 都以后端结果为准

### 7. AI 助手

`POST /api/ai/chat`

请求：

```json
{
  "scene": "welcome"
}
```

或

```json
{
  "scene": "hint",
  "levelId": "level-2"
}
```

或

```json
{
  "scene": "qa",
  "message": "为什么过马路要走斑马线？"
}
```

返回：

```json
{
  "reply": "……",
  "suggestions": ["……", "……"]
}
```

说明：

- 只允许道路安全主题内问答
- 无关问题会拒答并引导回主题
- `hint` 只给方向，不给完整答案
- 当前管理员修改 `AI 文案管理` 后，`welcome` 和 `hint` 的 fallback 文案会直接受影响

## 教师端接口

- `GET /api/teacher/dashboard`
- `GET /api/teacher/students`
- `GET /api/teacher/students/:id`

说明：

- `stu-1` 是真实跟随学生主链路变化的动态数据
- 其他学生数据当前仍保留稳定 seed/mock，用于先完成页面联调

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

- `PUT /api/admin/themes/:id`
- `PUT /api/admin/levels/:id`
- `PUT /api/admin/question-bank/:id`
- `PUT /api/admin/ai-copy/:id`

说明：

- 这些内容现在已经落到 SQLite，不再只是静态返回
- 题库和 AI 文案的更新会影响后端实际运行结果
- 目前管理员写接口走“部分字段更新”，前端提交需要只传当前表单里真正修改的字段即可

## 前端接入注意点

- 非登录接口一律带 Bearer token
- 学生端不要自己计算关卡解锁、考试解锁、积分和徽章，直接信任后端返回
- `complete level` 接口返回的是 `{ progress, result }`，不要只取 `progress`
- 错题结果请使用 `wrongQuestionIds` 和题目自身的 `reviewLevelId` / `reviewLabel` / `reviewSuggestion`
- 管理员内容如果做保存按钮，可以直接开始接 `PUT` 接口
- 真实 Spark 还没做联机验收，所以如果你看到 AI 结果比较模板化，这是当前预期

## 已知未完成项

- Spark Lite 真实密钥联机验证还没做
- 管理员端还没有新增/删除接口，这一轮先补了读取和更新
- 教师/管理员统计仍以首版展示型数据为主，还没做更完整的动态分析
