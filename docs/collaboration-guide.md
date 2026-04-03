# 多人协作指南

## 分支规则

- `main` 只接收评审通过的 PR
- 日常开发使用 `feature/<模块>-<任务>`
- 紧急修复使用 `fix/<问题>`
- 自动化或基线搭建可使用 `codex/<任务>`

## 当前 Owner 分工

- 前端：
  - 学生端、教师端、管理员端页面与交互
  - 全局样式与通用组件
  - 前端状态管理
  - 接口接入与联调
- 后端：
  - 鉴权与角色权限保护
  - 数据库与 seed 数据
  - 学生进度、考试与学习结果存储
  - AI 代理接口与密钥管理
  - 教师端与管理员端接口
  - 内容管理与统计接口

## 推荐模块拆分

### 学生端

- `feature/student-auth-shell`
- `feature/student-home-theme`
- `feature/student-levels`
- `feature/student-exam-ai`

### 教师端

- `feature/teacher-dashboard`
- `feature/teacher-students`

### 管理员端

- `feature/admin-content`
- `feature/admin-users-stats`

### 公共层

- `feature/shared-types-state`
- `feature/shared-ui-theme`

## 共享约束

- 路由前缀统一使用 `/student`、`/teacher`、`/admin`
- 关卡、考试、学习记录状态统一复用共享类型，不允许前后端各自维护一套状态枚举
- 进入页面、退出页面、完成任务等关键节点都要更新最近学习位置
- 角色访问必须做前端保护和后端服务端保护，联调时以后端鉴权结果为准

## Definition of Done

- 页面可从主导航进入
- 对应角色可以访问，不对应角色会被拦截或重定向
- 涉及学习流程的页面能正确读写真实后端或当前约定数据源
- 文案、状态标签、颜色语义与说明书一致
- 变更涉及共享契约时，文档同步更新

## PR 检查清单

- 说明影响的是学生端、教师端还是管理员端
- 说明是否修改了共享类型、路由或数据结构
- 说明是否影响继续学习、考试解锁、AI 提示
- 提供最小可复现的验证步骤

## 推荐评审方式

- UI 评审关注流程完整性、角色越权、空状态和提示文案
- 状态评审关注枚举、解锁条件、数据持久化和回退路径
- 文档评审关注说明书与实现是否一致
- 当前正式实施基线同时参考 `docs/project-1.0-implementation-plan.md`
