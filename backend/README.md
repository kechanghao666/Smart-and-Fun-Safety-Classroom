# Backend

`backend/` 负责学生主链路、教师端/管理员端接口、SQLite 数据库、登录鉴权、AI 代理与 seed 数据。

## 技术栈

- Node.js 20+
- Express
- TypeScript
- SQLite

## 启动方式

在仓库根目录执行：

```bash
npm install
npm run dev:backend
```

默认启动地址：

- `http://127.0.0.1:3001`

生产构建：

```bash
npm run build:backend
npm --prefix backend run start
```

## 环境变量

可复制 `backend/.env.example` 为 `backend/.env` 后填写。

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `PORT` | 后端端口 | `3001` |
| `CORS_ORIGIN` | 允许访问的前端源 | `http://127.0.0.1:5173` |
| `DB_PATH` | SQLite 文件路径 | `./data/smart-and-fun-safety-classroom.sqlite` |
| `SESSION_TTL_HOURS` | 登录态有效期 | `72` |
| `SPARK_API_URL` | 讯飞 Spark Lite HTTP 地址 | `https://spark-api-open.xf-yun.com/v1/chat/completions` |
| `SPARK_MODEL` | 模型名 | `lite` |
| `SPARK_APP_ID` | 鉴权文档中的 APPID，仅保留后端环境变量 | 空 |
| `SPARK_API_KEY` | 鉴权文档中的 APIKey，仅保留后端环境变量 | 空 |
| `SPARK_API_SECRET` | 鉴权文档中的 APISecret，仅保留后端环境变量 | 空 |
| `SPARK_API_PASSWORD` | 鉴权文档中的 APIPassword，用于 HTTP 代理调用 | 空 |
| `AI_FALLBACK_ENABLED` | 未配置密钥或上游失败时是否回退到本地模板回复 | `true` |

说明：

- 真实密钥不能提交到仓库。
- 前端不能直接连接模型服务，只能访问本后端的 `POST /api/ai/chat`。

## Seed 账号

- `student001 / 123456`
- `teacher001 / 123456`
- `admin001 / 123456`

学生账号首次登录默认没有完善昵称/头像/学段，后端会先创建学习记录与默认进度。

## 已实现接口

### 鉴权

- `POST /api/auth/login`

请求体：

```json
{
  "account": "student001",
  "password": "123456"
}
```

响应示例：

```json
{
  "token": "session_xxx",
  "role": "student",
  "account": "student001",
  "displayName": "学生示例账号",
  "studentProfile": null,
  "progress": {
    "themeId": "road-safety",
    "themeTitle": "道路安全教育",
    "lastVisitedRoute": "/student/home",
    "points": 120,
    "badges": ["观察员新星"],
    "levels": [],
    "levelResults": {},
    "exam": {
      "status": "locked",
      "totalQuestions": 3,
      "score": null,
      "wrongQuestionIds": []
    }
  }
}
```

### 学生主链路

- `GET /api/student/progress`
- `POST /api/student/profile`
- `POST /api/student/levels/:levelId/start`
- `POST /api/student/levels/:levelId/complete`
- `POST /api/student/exam/submit`

其中：

- 第一关默认 `available`
- 第二、三关默认 `locked`
- 完成前一关自动解锁下一关
- 三关全部完成后 `exam.status = available`
- 提交考试后 `exam.status = completed`
- 后端统一返回 `points`、`badges`、`wrongQuestionIds`、`levelResults`

考试提交请求：

```json
{
  "answers": [
    { "questionId": "q-1", "selectedIndex": 1 },
    { "questionId": "q-2", "selectedIndex": 1 },
    { "questionId": "q-3", "selectedIndex": 2 }
  ]
}
```

### AI 代理

- `POST /api/ai/chat`

请求体：

```json
{
  "scene": "hint",
  "levelId": "level-2",
  "message": "这一关我有点卡住了"
}
```

响应：

```json
{
  "reply": "先看清楚关键节点的风险，再决定是否前进，不要被捷径带偏。",
  "suggestions": ["先看灯和车", "先避开大型车辆盲区"]
}
```

AI 约束：

- 只回答“道路安全教育”主题
- `hint` 只给方向，不直接给完整答案
- 无关问题会拒答并引导回道路安全主题

### 教师端

- `GET /api/teacher/dashboard`
- `GET /api/teacher/students`
- `GET /api/teacher/students/:id`

### 管理员端

- `GET /api/admin/modules`
- `GET /api/admin/themes`
- `GET /api/admin/levels`
- `GET /api/admin/question-bank`
- `GET /api/admin/ai-copy`
- `GET /api/admin/users`
- `GET /api/admin/stats`

## 鉴权方式

除登录接口外，其余接口都需要：

```http
Authorization: Bearer <token>
```

## 本地验证建议

可用任意 HTTP 客户端按顺序验证：

1. `POST /api/auth/login`
2. `GET /api/student/progress`
3. `POST /api/student/levels/level-1/start`
4. `POST /api/student/levels/level-1/complete`
5. 按顺序完成三关后调用 `POST /api/student/exam/submit`
6. `POST /api/ai/chat`
