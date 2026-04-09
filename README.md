# 智趣安全学堂

面向小学生的互动式安全教育系统，首发主题为“道路安全教育”。项目包含学生端、教师端、管理员端三套入口，支持闯关学习、主题考试、错题重学、成长档案、AI 助手、教师班级视图和管理员内容维护。

## 项目结构

```text
project/
├─ backend/                  # Express + TypeScript + SQLite
├─ frontend/                 # React + Vite + TypeScript
├─ docs/
│  ├─ backend-frontend-handoff.md
│  ├─ collaboration-guide.md
│  └─ v1-contracts.md
├─ 功能设计说明书.docx
├─ 界面设计说明书.docx
├─ 鉴权信息.docx
└─ README.md
```

## 环境要求

- Node.js `20+`
- npm `10+`
- Windows / macOS / Linux 均可

## 环境变量

### 前端

复制 [frontend/.env.example](frontend/.env.example) 为 `frontend/.env.local`：

```bash
VITE_API_BASE_URL=/api
VITE_API_TIMEOUT_MS=8000
```

默认推荐使用 `/api`，这样本地开发会走 Vite 代理，部署到服务器后会直接走同源后端地址，不会再写死某一台电脑的 `127.0.0.1`。

### 后端

复制 [backend/.env.example](backend/.env.example) 为 `backend/.env`：

```bash
HOST=0.0.0.0
PORT=3001
CORS_ORIGIN=http://127.0.0.1:5173,http://localhost:5173
DB_PATH=./data/smart-and-fun-safety-classroom.sqlite
SESSION_TTL_HOURS=72
SPARK_API_URL=https://spark-api-open.xf-yun.com/v1/chat/completions
SPARK_MODEL=lite
SPARK_APP_ID=
SPARK_API_KEY=
SPARK_API_SECRET=
SPARK_API_PASSWORD=
AI_FALLBACK_ENABLED=false
```

如果需要真实 Spark 联调，只填写 `SPARK_*` 凭据；不要把凭据提交到仓库。

## 本地开发

在仓库根目录执行：

```bash
npm install
```

启动前端：

```bash
npm run dev
```

启动后端：

```bash
npm run dev:backend
```

常用检查命令：

```bash
npm run check:backend
npm run build:backend
npm run build
```

默认地址：

- 前端：[http://localhost:5173](http://localhost:5173)
- 后端健康检查：[http://127.0.0.1:3001/api/health](http://127.0.0.1:3001/api/health)

本地开发建议：

- 前端优先使用 [http://localhost:5173](http://localhost:5173) 或终端实际显示的 Vite 地址。
- 如果 5173 被占用，Vite 可能自动切换到 `5174`、`5175` 等端口；后端现在默认允许本机 `localhost` 和 `127.0.0.1` 的开发端口访问。

## 远程部署与公开体验

当前项目已经支持“后端托管前端静态页”的单地址部署模式。也就是说，前端构建后会由后端直接提供页面，别人访问你的服务器地址就能使用，不再依赖你本机的 `127.0.0.1`。

### 适合的部署方式

- 云服务器 / 学校服务器 / 实验室公网主机
- 能长期运行 Node.js 进程，并允许外部访问 `PORT`

### 部署步骤

在服务器上执行：

```bash
npm install
```

复制环境文件：

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

如果服务器上已经有旧的 `frontend/.env.local`，请确认把 `VITE_API_BASE_URL` 改成 `/api`，不要继续保留 `http://127.0.0.1:3001`。

按需修改 `backend/.env`：

```bash
HOST=0.0.0.0
PORT=3001
```

构建前后端：

```bash
npm run build:all
```

启动生产服务：

```bash
npm run start:prod
```

启动成功后，访问：

- `http://你的服务器IP:3001`
- 或你绑定的域名

后端健康检查仍然是：

- `http://你的服务器IP:3001/api/health`

### 为什么现在可以远程打开

- 前端默认请求同源 `/api`
- 本地开发时由 Vite 代理到后端
- 生产环境下由后端直接托管 `frontend/dist`
- 所以部署后别人打开的是“你的服务器地址”，而不是他们自己电脑上的 `127.0.0.1`

### 如果你想给别人长期体验

- 推荐把项目部署到一台公网服务器
- 确保服务器防火墙和云平台安全组放行对应端口
- 如需更正式的访问方式，可再加 Nginx 反向代理和域名

## 测试入口

### 学生端

- 登录页：`/`
- 资料补全：`/student/profile-setup`
- 首页：`/student/home`
- 主题页：`/student/theme/road-safety`
- 关卡页：`/student/theme/road-safety/level/level-1`
- 考试页：`/student/theme/road-safety/exam`
- 错题页：`/student/theme/road-safety/wrong-questions`
- 成长档案：`/student/growth`
- 学习记录：`/student/records`
- AI 结果卡：`/student/ai-report`

### 教师端

- 总览：`/teacher/dashboard`
- 班级管理：`/teacher/classes`
- 学生列表：`/teacher/students`
- 学生详情：`/teacher/students/:studentId`

### 管理员端

- 后台首页：`/admin/dashboard`
- 主题管理：`/admin/themes`
- 关卡管理：`/admin/levels`
- 题库管理：`/admin/question-bank`
- AI 文案管理：`/admin/ai-copy`
- 用户管理：`/admin/users`
- 统计与成长规则：`/admin/stats`

## 种子账号

- 学生：`student001 / 123456`
- 教师：`teacher001 / 123456`
- 管理员：`admin001 / 123456`

额外演示学生账号：

- `student002 / 123456`
- `student003 / 123456`
- `student004 / 123456`

说明：

- `student001` 默认用于验证首次登录和资料补全过程。
- 其余学生账号用于教师班级统计、筛选和管理员统计联调。

## 联调说明

- 前后端交接文档在 [docs/backend-frontend-handoff.md](docs/backend-frontend-handoff.md)，不是仓库根目录下的 `backend-fronted-handoff.md`。
- 前端共享契约在 [docs/v1-contracts.md](docs/v1-contracts.md)。
- 学生端在 API 模式下以 `GET /api/student/progress`、`GET /api/student/growth`、`GET /api/student/records`、`GET /api/student/ai-report` 为准，不再自行计算解锁、成长值和奖励。
- 教师端使用后端提供的班级 CRUD、学生筛选和学生详情数据。
- 管理员端的主题、关卡、题库、AI 文案、用户状态和成长规则均已设计为真实保存流；当前主线不再把失败静默回退为业务 mock 数据。

## 文档索引

- [docs/backend-frontend-handoff.md](docs/backend-frontend-handoff.md)
- [docs/v1-contracts.md](docs/v1-contracts.md)
- [docs/collaboration-guide.md](docs/collaboration-guide.md)
- [docs/main-quality-alignment-log.md](docs/main-quality-alignment-log.md)
- [docs/aliyun-light-deployment-runbook.md](docs/aliyun-light-deployment-runbook.md)
- [backend/README.md](backend/README.md)
