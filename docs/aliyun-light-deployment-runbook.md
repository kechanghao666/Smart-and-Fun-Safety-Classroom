# 阿里云轻量应用服务器部署运行手册

这份文档记录了 `星途知学` 当前在阿里云轻量应用服务器上的实际部署方式，方便后续同事接手、复现和排查问题。

## 适用范围

- 云平台：阿里云轻量应用服务器
- 系统：`Alibaba Cloud Linux 3`
- 运行方式：`Node.js + PM2`
- 对外访问：应用直接监听 `80` 端口
- 当前项目结构：
  - 前端构建产物由后端托管
  - 前端生产环境通过同源 `/api` 访问后端

## 部署目标

- 对外首页：`http://<服务器公网 IP>`
- 健康检查：`http://<服务器公网 IP>/api/health`
- 服务进程名：`smart-classroom`
- 应用目录：`/opt/smart-and-fun-safety-classroom`

## 部署前准备

### 1. 服务器信息

- 公网 IP
- SSH 端口，默认 `22`
- 可用的 SSH 登录方式：
  - `root + 密码`
  - 或 SSH 私钥

### 2. 仓库准备

- 建议先在本地确认要部署的分支可构建：

```bash
npm install
npm run build
npm run build:backend
```

### 3. 密钥与敏感信息

- `SPARK_*` 只允许放在服务器的 `backend/.env`
- 不要把真实密钥提交到 GitHub
- 不要把服务器密码写进仓库文档

## 服务器初始化

首次登录服务器后执行：

```bash
dnf install -y git
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
dnf install -y nodejs
npm install -g pm2
```

检查版本：

```bash
node -v
npm -v
pm2 -v
```

## 代码上传方式

如果服务器拉取 GitHub 不方便，推荐从本地打包上传。

### 本地打包

在仓库根目录执行：

```bash
git archive --format=tar.gz -o deploy-smart-classroom.tar.gz HEAD
```

### 上传到服务器

上传到服务器后，例如：

```text
/root/deploy-smart-classroom.tar.gz
```

### 服务器端解压

```bash
mkdir -p /opt/smart-and-fun-safety-classroom
tar -xzf /root/deploy-smart-classroom.tar.gz -C /opt/smart-and-fun-safety-classroom
cd /opt/smart-and-fun-safety-classroom
```

## 环境变量

### 前端

创建：

```text
frontend/.env.local
```

内容：

```bash
VITE_API_BASE_URL=/api
VITE_API_TIMEOUT_MS=8000
```

### 后端

创建：

```text
backend/.env
```

推荐配置：

```bash
HOST=0.0.0.0
PORT=80
CORS_ORIGIN=http://<服务器公网IP>,http://localhost:5173,http://127.0.0.1:5173
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

说明：

- 当前线上使用 `80` 端口对外，避免额外暴露 `3001`
- 如果 Spark 密钥未填，且 `AI_FALLBACK_ENABLED=false`，AI 会直接报错
- 如果暂时不接真实 Spark，可把 `AI_FALLBACK_ENABLED=true`

## 构建与启动

安装依赖：

```bash
npm install
```

构建前后端：

```bash
npm run build:all
```

启动生产服务：

```bash
pm2 start npm --name smart-classroom -- run start:prod
pm2 save
```

查看状态：

```bash
pm2 status
pm2 logs smart-classroom
```

## 开机自启

注册 `systemd` 自启：

```bash
pm2 startup systemd -u root --hp /root
pm2 save
systemctl start pm2-root
```

验证：

```bash
systemctl is-enabled pm2-root
systemctl is-active pm2-root
```

预期结果：

- `enabled`
- `active`

## 对外验证

### 基础验证

```bash
curl http://127.0.0.1/api/health
curl http://<服务器公网IP>/api/health
```

### 登录验证

```bash
curl -X POST http://<服务器公网IP>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"account":"student001","password":"123456"}'
```

### AI 验证

先登录拿到 `token`，再请求：

```bash
curl -X POST http://<服务器公网IP>/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"scene":"qa","message":"过马路前要先观察什么？"}'
```

如果已正确接入真实 Spark，应该返回一条正常的安全知识回答，而不是“暂时没有连上智能问答服务”。

## 当前线上已验证能力

- 首页可从公网访问
- 登录接口可用
- 学生、教师、管理员种子账号可登录
- 健康检查正常
- 真实 Spark 已通过服务器环境变量接入并联机验证
- PM2 已接管进程
- `pm2-root` 已启用开机自启

## 重要排错记录

### 1. 登录/注册提示“未找到对应接口”

根因：

- 前端基础地址已经是 `/api`
- 但业务 service 里又继续写了 `/api/auth/login`
- 最终拼成 `/api/api/auth/login`

修复方式：

- 前端 service 统一使用相对路径，例如：
  - `/auth/login`
  - `/student/progress`
  - `/teacher/dashboard`
  - `/admin/modules`

相关修复提交：

- `2b0409e` `Fix frontend API route prefixes`

### 2. AI 返回 fallback 提示

先检查：

```bash
cat /opt/smart-and-fun-safety-classroom/backend/.env
```

重点看：

- `SPARK_APP_ID`
- `SPARK_API_KEY`
- `SPARK_API_SECRET`
- `SPARK_API_PASSWORD`
- `AI_FALLBACK_ENABLED`

如果修改过环境变量，记得：

```bash
pm2 restart smart-classroom --update-env
```

### 3. 服务器重启后网站不自动恢复

检查：

```bash
systemctl is-enabled pm2-root
systemctl is-active pm2-root
```

如果未启用，重新执行：

```bash
pm2 startup systemd -u root --hp /root
pm2 save
systemctl start pm2-root
```

## 日常运维命令

进入项目目录：

```bash
cd /opt/smart-and-fun-safety-classroom
```

更新代码后重新部署：

```bash
npm install
npm run build:all
pm2 restart smart-classroom --update-env
```

查看监听端口：

```bash
ss -lntp | grep ':80 '
```

查看 PM2 日志：

```bash
tail -n 100 /root/.pm2/logs/smart-classroom-out.log
tail -n 100 /root/.pm2/logs/smart-classroom-error.log
```

## 安全建议

- 部署完成后及时修改 `root` 密码
- 更推荐改用 SSH 密钥登录
- 不要把 Spark 密钥写进仓库、截图或群聊
- 如果后续绑定域名，建议继续配置 HTTPS

## 后续建议

- 绑定域名后，将公网访问从 IP 切到域名
- 为正式环境增加 HTTPS
- 若用户量增大，再考虑把 SQLite 升级为 MySQL 或 PostgreSQL
