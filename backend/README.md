# Backend

`backend/` 负责学生主链路、教师端和管理员端接口、SQLite 数据库、登录鉴权、AI 代理、成长体系、seed 数据与后端文档。

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

复制 `backend/.env.example` 为 `backend/.env` 后填写：

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
| `SPARK_API_PASSWORD` | 后端实际发送给 Spark HTTP 接口的 Bearer 凭证 | 空 |
| `AI_FALLBACK_ENABLED` | 上游失败时是否回退到本地模板响应 | `true` |

说明：

- 真实密钥不能提交到仓库。
- 前端不能直连模型服务，只能调用后端的 `POST /api/ai/chat`。
- 当前代码实际读取 `SPARK_API_PASSWORD` 作为 Bearer 凭证。
- 已按仓库中的 `鉴权信息.docx` 完成真实 Spark 联机验收，且联机时只通过临时环境变量注入。

## Seed 账号

固定联调账号：

- `student001 / 123456`
- `teacher001 / 123456`
- `admin001 / 123456`

额外统计 seed：

- `student002 / 123456`
- `student003 / 123456`
- `student004 / 123456`

说明：

- `student001` 首次登录时默认没有资料补全，用于验证首次登录流程。
- 额外 student seed 主要用于教师端班级统计和管理员统计联调。

## 已实现接口

### 鉴权

- `POST /api/auth/login`

### 学生端

- `GET /api/student/progress`
- `GET /api/student/records`
- `GET /api/student/exam/review`
- `GET /api/student/growth`
- `GET /api/student/ai-report`
- `POST /api/student/profile`
- `POST /api/student/levels/:levelId/start`
- `POST /api/student/levels/:levelId/complete`
- `POST /api/student/exam/submit`
- `POST /api/student/exam/review/:questionId/complete`

### AI 代理

- `POST /api/ai/chat`

### 教师端

- `GET /api/teacher/classes`
- `POST /api/teacher/classes`
- `PUT /api/teacher/classes/:id`
- `GET /api/teacher/dashboard`
- `GET /api/teacher/students`
- `GET /api/teacher/students/:id`

`GET /api/teacher/students` 支持筛选参数：

- `className`
- `completionStatus`
- `examStatus`

### 管理员端

读取接口：

- `GET /api/admin/modules`
- `GET /api/admin/themes`
- `GET /api/admin/levels`
- `GET /api/admin/question-bank`
- `GET /api/admin/ai-copy`
- `GET /api/admin/growth-config`
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
- `PUT /api/admin/growth-config`
- `PATCH /api/admin/users/:id`

## 核心业务规则

学生主链路由后端强制执行：

- 第一关默认 `available`
- 第二、三关默认 `locked`
- 完成前一关后自动解锁下一关
- 三关全部完成后 `exam.status = available`
- 考试提交后 `exam.status = completed`
- 后端统一计算并返回 `points`、`badges`、`wrongQuestionIds`、`levelResults`
- `lastVisitedRoute` 在资料补全、关卡开始、关卡结算、考试提交等关键节点自动更新

## 成长体系

后端已落地以下能力：

- 成长值事件存储
- 三类成长维度存储：形象外观、安全能力、专属场景
- 成长值来源覆盖：
  - 关卡通关
  - 三星额外奖励
  - 主题考试
  - 错题重学
  - 连续 3/7 天学习奖励
- 成长档案接口
- AI 结果卡片中的成长板块
- 教师学生详情页的成长状态
- 管理员统计中的成长概览
- 后台成长规则配置预留：
  - 成长值规则
  - 升级阈值
  - 奖励配置

## 前端联调约定

- 除登录外，所有接口都要带：

```http
Authorization: Bearer <token>
```

- 学生端不要自己计算关卡解锁、考试解锁、积分和徽章。
- `POST /api/student/levels/:levelId/complete` 返回的是 `{ progress, result }`。
- 错题回看请使用题目上的 `reviewLevelId`、`reviewLabel`、`reviewSuggestion`。
- AI 结果卡片页可以直接使用 `GET /api/student/ai-report`。
- 成长档案页可以直接使用 `GET /api/student/growth`。

## 本机验证

本机已通过这些验证：

1. `npm run check:backend`
2. `npm run build:backend`
3. `POST /api/auth/login`
4. `POST /api/student/profile`
5. `GET /api/student/progress`
6. 顺序完成三关并验证考试自动解锁
7. `GET /api/student/records`
8. `GET /api/student/growth`
9. `POST /api/student/exam/submit`
10. `GET /api/student/exam/review`
11. `POST /api/student/exam/review/:questionId/complete`
12. `GET /api/student/ai-report`
13. `POST /api/ai/chat`
14. `GET /api/teacher/classes`
15. `GET /api/teacher/dashboard`
16. `GET /api/teacher/students` 含筛选
17. `POST /api/teacher/classes`
18. `PUT /api/teacher/classes/:id`
19. `GET /api/admin/users`
20. `PATCH /api/admin/users/:id`
21. `GET /api/admin/growth-config`
22. `PUT /api/admin/growth-config`
23. `GET /api/admin/stats`

真实 Spark 联机验收结论：

- 已直接请求 Spark 官方 HTTP 接口并拿到有效返回。
- 已通过后端完整链路验证 `welcome`、`hint`、主题内 `qa` 走真实 `spark`。
- 已验证无关主题 `qa` 被后端拒答并记录为 `fallback`。
- 验收时使用临时环境变量，不写入仓库，不提交密钥。
