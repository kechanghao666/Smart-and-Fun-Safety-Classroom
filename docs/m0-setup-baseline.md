# M0 仓库接入与基线盘点

## 已完成

- 本地仓库已绑定远端：`https://github.com/kechanghao666/Smart-and-Fun-Safety-Classroom.git`
- 已确认远端默认分支为 `main`
- 已切换到独立工作分支 `codex/m0-project-bootstrap`
- 已读取仓库现状：远端主分支仅包含 `README.md` 与两份说明书，没有现成工程代码

## 当前结论

- 该仓库还处于“需求文档已就绪，工程尚未初始化”的阶段
- 适合先建立统一前端骨架、共享类型、mock 数据和协作约束，再按模块并行推进
- 首版以说明书为唯一业务基线，真实接口、数据库和后台联调暂不在当前仓库体现

## 本次落地范围

- 新增工作区级 `package.json`，统一后续前端启动入口
- 新增 `.gitignore` 和 PR 模板
- 新增 `frontend/` 前端原型骨架
- 新增 M0 盘点与协作规范文档

## 技术选型默认值

- 前端：React + TypeScript + Vite
- 路由：按 `/student/*`、`/teacher/*`、`/admin/*` 分组
- 数据：先使用本地 mock 数据与 localStorage 做流程串联
- 状态：统一使用 `locked`、`available`、`in_progress`、`completed`

## 当前阻塞

- 当前机器未安装 Node.js / npm，无法在本地完成依赖安装、开发服务器启动和构建验证
- 尚无后端代码与真实 API，当前实现只能先交付前端原型与协作底座

## 后续建议

1. 由一位同事负责安装运行时并完成首次 `npm install`
2. 由一位同事补后端或 mock server 契约
3. 学生端、教师端、管理员端按页面与模块拆分 owner
4. 进入正式开发前，先锁定颜色规范、命名规范和接口字段

