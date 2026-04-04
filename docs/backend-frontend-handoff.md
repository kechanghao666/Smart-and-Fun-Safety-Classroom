# 后端交接给前端同事

这份文档说明当前仓库中后端接口的联调方式、种子账号、主要返回结构和关键业务规则。当前交接文档实际位置为 [docs/backend-frontend-handoff.md](backend-frontend-handoff.md)，并与 `main` 主干保持一致。

## 当前状态

- 技术栈：Node.js + Express + TypeScript + SQLite
- 默认端口：`3001`
- 鉴权方式：`Authorization: Bearer <token>`
- AI 统一经由后端代理访问 Spark
- 学生主链路、成长系统、教师班级与学生详情、管理员内容管理/用户管理/成长规则接口已齐备

## 本地启动

在仓库根目录执行：

```bash
npm install
npm run dev:backend
```

健康检查：

```bash
GET http://127.0.0.1:3001/api/health
```

后端默认 CORS 源：`http://127.0.0.1:5173`

## 环境变量

参考 [backend/.env.example](../backend/.env.example)：

```bash
PORT=3001
CORS_ORIGIN=http://127.0.0.1:5173
DB_PATH=./data/smart-and-fun-safety-classroom.sqlite
SESSION_TTL_HOURS=72
SPARK_API_URL=https://spark-api-open.xf-yun.com/v1/chat/completions
SPARK_MODEL=lite
SPARK_APP_ID=
SPARK_API_KEY=
SPARK_API_SECRET=
SPARK_API_PASSWORD=
AI_FALLBACK_ENABLED=true
```

说明：

- 不填 `SPARK_*` 时，可依赖 fallback 文案完成基础联调。
- 需要真实 AI 联调时，只在本地 `backend/.env` 填写 Spark 凭据，不要提交到仓库。

## 种子账号

- 学生：`student001 / 123456`
- 教师：`teacher001 / 123456`
- 管理员：`admin001 / 123456`

额外演示学生：

- `student002 / 123456`
- `student003 / 123456`
- `student004 / 123456`

说明：

- `student001` 默认用于首次登录和资料补全流程验证。
- 额外学生账号用于教师班级统计、筛选和管理员统计数据。

## 关键业务规则

### 学生端

- `POST /api/auth/login` 返回 `token`、`role`，学生角色可附带 `studentProfile` 与 `progress`。
- 当 `studentProfile === null` 时，前端必须引导到 `/student/profile-setup`。
- `POST /api/student/profile` 会真实落库，建议成功后立刻刷新 `GET /api/student/progress`。
- `GET /api/student/progress` 统一返回关卡状态、考试状态、积分、徽章、错题和最近访问路由。
- `POST /api/student/levels/:levelId/complete` 返回 `{ progress, result }`，结算页直接消费 `result`。
- `POST /api/student/exam/submit` 统一结算考试结果，并写入错题列表。
- `GET /api/student/exam/review` 返回错题详情、对应回看关卡和是否已完成重学。
- `POST /api/student/exam/review/:questionId/complete` 会发放成长奖励并更新重学状态。
- `GET /api/student/growth` 返回成长维度、阶段、已解锁外观/能力/场景、历史记录。
- `PUT /api/student/growth/preferences` 用于保存当前选择的外观和场景。
- `GET /api/student/ai-report` 返回 5 张结果卡片：`completion`、`performance`、`suggestion`、`reward`、`growth`。

### 教师端

- `GET /api/teacher/classes`、`POST /api/teacher/classes`、`PUT /api/teacher/classes/:id` 用于班级列表、创建和编辑。
- `GET /api/teacher/dashboard` 返回班级汇总和关键提醒。
- `GET /api/teacher/students` 支持 `className`、`completionStatus`、`examStatus` 查询参数。
- `GET /api/teacher/students/:studentId` 返回学生主链路表现、考试结果、成长摘要和建议动作。

### 管理员端

- `GET /api/admin/themes`、`PUT /api/admin/themes/:id` 等内容接口使用 SQLite 持久化。
- `PUT /api/admin/levels/:id` 支持保存关卡展示顺序、场景配置、任务清单、反馈文案与奖励配置。
- `PUT /api/admin/question-bank/:id` 支持保存主题归属、选项、正确答案和解析。
- `PUT /api/admin/ai-copy/:id` 支持保存 AI 文案模板。
- `PATCH /api/admin/users/:id` 支持停用/恢复账号和维护备注；停用时会清理现有会话。
- `GET /api/admin/growth-config`、`PUT /api/admin/growth-config` 用于成长奖励和阈值规则配置。
- 成长规则入口固定收在 `/admin/stats`，不新增新的一级导航。

## 当前主要接口清单

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

## 前端接入注意事项

- 不要在前端重新维护一套关卡解锁、考试解锁、积分、徽章或成长值计算逻辑。
- 学生端 API 模式下，以后端返回的 `StudentProgress`、`StudentGrowthResponse`、`StudentExamReviewResponse` 为准。
- AI 统一走 `/api/ai/chat`，不要直连 Spark。
- 管理员页的“保存”现在应视为真实写入，不再只是本地草稿保存提示。
- 对齐共享字段时，以 [docs/v1-contracts.md](v1-contracts.md) 为准。
