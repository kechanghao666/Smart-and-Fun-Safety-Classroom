# Backend

`backend/` 负责学生主链路、教师端/管理员端接口、SQLite 数据库、登录鉴权、AI 代理和 seed 数据。

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

默认地址：

- `http://127.0.0.1:3001`

生产构建：

```bash
npm run build:backend
npm --prefix backend run start
```

## 环境变量

复制 `backend/.env.example` 为 `backend/.env` 后填写。

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
- 前端不能直接访问模型服务，只能调用后端的 `POST /api/ai/chat`。

## Seed 账号

- `student001 / 123456`
- `teacher001 / 123456`
- `admin001 / 123456`

学生账号首次登录默认没有资料补全，后端会先创建学习记录和默认进度。

## 已实现接口

### 鉴权

- `POST /api/auth/login`

### 学生主链路

- `GET /api/student/progress`
- `POST /api/student/profile`
- `POST /api/student/levels/:levelId/start`
- `POST /api/student/levels/:levelId/complete`
- `POST /api/student/exam/submit`

后端会强制执行这些规则：

- 第一关默认 `available`
- 第二、三关默认 `locked`
- 完成前一关后解锁下一关
- 三关全部完成后 `exam.status = available`
- 提交考试后 `exam.status = completed`
- 后端统一计算并返回 `points`、`badges`、`wrongQuestionIds`、`levelResults`

### AI 代理

- `POST /api/ai/chat`

规则：

- 只回答道路安全教育主题
- `hint` 只给方向，不直接给完整答案
- 无关问题会拒答并引导回主题
- 当前管理员维护的 `ai-copy` 文案会影响 `welcome` / `hint` 的 fallback 回复

### 教师端

- `GET /api/teacher/dashboard`
- `GET /api/teacher/students`
- `GET /api/teacher/students/:id`

### 管理员端

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

- 主题、关卡、题库、AI 文案现在都已落到 SQLite。
- `question-bank` 的更新会影响考试判分和错题回看基础数据。
- `ai-copy` 的更新会影响 AI 助手 fallback 文案。
- `level-1/2/3` 是 v1 固定三关，因此目前只开放更新，不开放新增/删除。

## 鉴权方式

除登录接口外，其余接口都需要：

```http
Authorization: Bearer <token>
```

## 本地验证

本机已通过这些验证：

1. `POST /api/auth/login`
2. `GET /api/student/progress`
3. `POST /api/student/levels/level-1/start`
4. `POST /api/student/levels/level-1/complete`
5. 顺序完成三关后调用 `POST /api/student/exam/submit`
6. `POST /api/ai/chat`
7. `GET /api/teacher/dashboard`
8. `GET /api/admin/modules`
9. `PUT /api/admin/themes/:id` 等管理员内容更新接口

## 前端联调说明

前端同事请优先看：

- `docs/backend-frontend-handoff.md`
