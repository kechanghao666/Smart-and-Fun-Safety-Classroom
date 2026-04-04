# Main Quality Alignment 工作日志

## 文档目的

这份文档用于说明 `feature/main-quality-alignment` 分支这一轮“全项目联调与质量收口”做了什么，方便后续同事快速建立上下文，避免重复排查。

基线信息：

- 工作基线：最新 `main`
- 工作分支：`feature/main-quality-alignment`
- 关键提交：`4841ee7`
- 目标：减少前端对 `mockData` 和 `localStorage` 的业务依赖，让动态业务数据以后端真实接口为准，并完成一轮构建与联通验证

## 本轮改动目标

这一轮不是做新的业务功能扩展，而是做主线质量收口，重点解决以下问题：

1. 前端动态业务状态仍大量依赖本地 `mockData` 和 `localStorage`
2. 登录、考试、AI、教师页、管理员页存在“接口失败就回退到假数据”的行为
3. 页面虽然能看，但真实前后端联调不够严格，容易把问题隐藏成“看起来正常”
4. 需要把当前主线推进到“默认连真实后端”的状态，便于后续同事继续做页面和体验优化

## 本轮核心结果

### 1. 默认走真实后端

前端默认 API 地址调整为本地后端地址，主线不再默认停留在 demo/mock 模式。

涉及文件：

- `frontend/src/services/apiConfig.ts`

改动要点：

- 默认 API Base URL 指向 `http://127.0.0.1:3001`
- 页面文案同步为在线同步状态，不再强调“演示模式”

### 2. AppState 收口为“后端权威”

前端状态层从“本地状态主导”收口为“后端数据主导，本地只保留轻量会话信息”。

涉及文件：

- `frontend/src/state/AppState.tsx`
- `frontend/src/App.tsx`

改动要点：

- 不再用 `localStorage` 作为学习进度、考试结果、成长值等核心业务数据来源
- 仅保留登录态、轻量偏好、少量兼容字段
- 角色访问控制以真实 token 和角色为准
- 保留了一些兼容旧页面调用的方法，但这些方法不再作为业务权威来源

### 3. 去掉“请求失败自动切回 mock”行为

这是这一轮最重要的稳定性收口之一。之前很多页面在真实接口失败时，会静默回落为本地示例数据，容易误导联调结果。

涉及文件：

- `frontend/src/utils/useApiResource.ts`
- `frontend/src/utils/useApiHydration.ts`
- `frontend/src/utils/useEditableAdminResource.ts`

改动要点：

- 请求失败时保留错误态，不再伪装成成功数据
- 禁用状态时给出明确错误提示
- 管理端编辑资源不再把本地草稿持久化为业务事实
- 页面需要显示真实的加载、错误、空状态

### 4. 登录页改为真实登录

登录页不再允许“点角色卡直接进入”或前端假登录，统一走后端账号密码接口。

涉及文件：

- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/components/AppShell.tsx`

改动要点：

- 只允许调用 `POST /api/auth/login`
- 页面仍保留 seed 账号提示，方便测试
- 顶部和侧栏中与“演示模式”相关的误导性文案已清理

测试账号：

- 学生：`student001 / 123456`
- 教师：`teacher001 / 123456`
- 管理员：`admin001 / 123456`

### 5. 学生考试链路切换到真实题库

学生考试页、考试结果页、错题回看页不再依赖前端静态题库数据，统一以后端返回为准。

涉及文件：

- `backend/src/routes/studentRoutes.ts`
- `frontend/src/services/student.ts`
- `frontend/src/pages/student/StudentExamPage.tsx`
- `frontend/src/pages/student/StudentExamResultPage.tsx`
- `frontend/src/pages/student/StudentWrongQuestionsPage.tsx`

本轮新增后端接口：

- `GET /api/student/exam/questions`

改动要点：

- 考试题目从后端读取
- 交卷只走后端提交
- 错题页和考试结果页不再从静态题库推导题目信息
- 错题回看完成行为走后端接口，不再做本地模拟

### 6. AI 改为真实后端代理优先

AI 不再在前端本地生成“伪答案”，而是以后端 `/api/ai/chat` 返回为准。接口失败时，页面应明确告诉用户服务不可用，而不是伪造看似真实的回复。

涉及文件：

- `frontend/src/utils/aiAssistant.ts`
- `frontend/src/pages/student/StudentAiPage.tsx`
- `frontend/src/utils/studentAiReport.ts`

改动要点：

- 去掉前端关键词命中式本地问答回退
- 学生 AI 页面改为结合真实错题回看数据生成上下文
- AI 结果卡本地兜底改为通用提示，不再引用静态考试题库

### 7. 教师端去除业务 mock 兜底

教师端首页、班级页、学生列表和详情页不再假装展示“真实业务数据”。

涉及文件：

- `frontend/src/pages/teacher/TeacherDashboardPage.tsx`
- `frontend/src/pages/teacher/TeacherClassesPage.tsx`
- `frontend/src/pages/teacher/TeacherStudentsPage.tsx`
- `frontend/src/pages/teacher/TeacherStudentDetailPage.tsx`

改动要点：

- 教师总览页默认用真实接口数据
- 班级页去掉静态班级总览回退
- 学生列表不再 reset 到 mock 学生数组
- 学生详情页失败时显示真实错误态，而不是静态详情数据

### 8. 管理员端继续收口为真实后台资源

管理员端各资源页继续去掉旧的示例数据依赖，保持和后端管理接口对齐。

涉及文件：

- `frontend/src/services/admin.ts`
- `frontend/src/pages/admin/AdminDashboardPage.tsx`
- `frontend/src/pages/admin/AdminStatsPage.tsx`
- `frontend/src/pages/admin/AdminThemesPage.tsx`
- `frontend/src/pages/admin/AdminLevelsPage.tsx`
- `frontend/src/pages/admin/AdminQuestionBankPage.tsx`
- `frontend/src/pages/admin/AdminAiCopyPage.tsx`
- `frontend/src/pages/admin/AdminUsersPage.tsx`
- `frontend/src/components/AdminEditorStatusBar.tsx`

改动要点：

- 移除一批旧的 fallback 业务数据导出
- 页面改为优先展示真实后台接口结果
- 当接口失败时，应让问题暴露出来，而不是用静态示例内容掩盖

### 9. 学生首页与主题页对齐后端主题标题

学生端部分页面原本把主题文案写死，这会让后台改主题后前端不更新。

涉及文件：

- `frontend/src/pages/student/StudentHomePage.tsx`
- `frontend/src/pages/student/StudentThemePage.tsx`

改动要点：

- 当前主题标题改为使用后端返回的 `themeTitle`
- AI 提示中的主题名也跟随后端数据变化

## 本轮改动文件清单

### 后端

- `backend/src/routes/studentRoutes.ts`

### 前端应用层

- `frontend/src/App.tsx`
- `frontend/src/state/AppState.tsx`

### 前端通用组件

- `frontend/src/components/AdminEditorStatusBar.tsx`
- `frontend/src/components/AppShell.tsx`

### 前端页面

- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/student/StudentAiPage.tsx`
- `frontend/src/pages/student/StudentExamPage.tsx`
- `frontend/src/pages/student/StudentExamResultPage.tsx`
- `frontend/src/pages/student/StudentHomePage.tsx`
- `frontend/src/pages/student/StudentThemePage.tsx`
- `frontend/src/pages/student/StudentWrongQuestionsPage.tsx`
- `frontend/src/pages/teacher/TeacherClassesPage.tsx`
- `frontend/src/pages/teacher/TeacherDashboardPage.tsx`
- `frontend/src/pages/teacher/TeacherStudentDetailPage.tsx`
- `frontend/src/pages/teacher/TeacherStudentsPage.tsx`
- `frontend/src/pages/admin/AdminAiCopyPage.tsx`
- `frontend/src/pages/admin/AdminDashboardPage.tsx`
- `frontend/src/pages/admin/AdminLevelsPage.tsx`
- `frontend/src/pages/admin/AdminQuestionBankPage.tsx`
- `frontend/src/pages/admin/AdminStatsPage.tsx`
- `frontend/src/pages/admin/AdminThemesPage.tsx`
- `frontend/src/pages/admin/AdminUsersPage.tsx`

### 前端服务与工具

- `frontend/src/services/admin.ts`
- `frontend/src/services/apiConfig.ts`
- `frontend/src/services/student.ts`
- `frontend/src/utils/aiAssistant.ts`
- `frontend/src/utils/studentAiReport.ts`
- `frontend/src/utils/useApiHydration.ts`
- `frontend/src/utils/useApiResource.ts`
- `frontend/src/utils/useEditableAdminResource.ts`

## 本轮明确没有做的事

为避免后续同事误判，这一轮没有做以下事情：

1. 没有大改视觉设计
2. 没有重做关卡场景 UI
3. 没有新增复杂后端业务模块，后端只做了一个最小接口补充
4. 没有做浏览器自动化测试
5. 没有把所有静态展示素材都移除

## 为什么还有 `mockData`

当前仓库里仍保留 `frontend/src/data/mockData.ts`，但它的职责已经收缩，不应再被理解为“业务真源”。

当前仍允许保留的内容主要是：

- 静态展示素材
- 页面占位文案
- 资料补全选项
- 关卡场景演示内容
- 纯视觉型卡片基础信息

不应再用它保存以下内容：

- 学习进度
- 考试结果
- 错题状态
- 成长值
- 教师统计
- 管理员后台真实列表数据

## 本轮验证记录

### 构建验证

已验证通过：

- `npm run build`
- `npm run build:backend`
- `npm run check:backend`

### 后端接口烟测

已验证通过：

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/student/progress`
- `GET /api/student/exam/questions`
- `GET /api/teacher/dashboard`
- `GET /api/admin/modules`

关键结果摘要：

- 学生登录成功
- 学生端可读取 3 个关卡数据
- 学生考试题库返回 3 题
- 教师总览读取成功
- 教师班级返回 3 个班级
- 教师学生数据返回 4 条
- 管理员模块数据返回 6 项

### 本地运行验证

本地已验证：

- 前端开发服务可启动
- 后端开发服务可启动
- 前端页面入口可访问
- 后端健康检查接口可访问

## 当前已知边界

这份文档也记录当前仍然存在的边界，后续同事不要误判为“已经全部产品化完成”。

1. 页面虽然已优先走真实后端，但还需要继续做更细的体验优化
2. 某些静态场景内容仍是前端素材，不是后台配置化内容
3. 部分页面仍有进一步按界面设计说明书细化的空间
4. 本轮重点是“联调收口”，不是“最终视觉定稿”

## 建议后续接手顺序

建议下一位同事按下面顺序继续：

1. 浏览器逐页手测学生、教师、管理员三端
2. 核对每个关键页的加载态、错误态、空状态
3. 继续清理仍残留的 demo/原型措辞
4. 对照界面设计说明书细化学生三关界面和结算反馈
5. 对照功能说明书继续补足教师端和管理员端的完整运营体验

## 给后续同事的结论

如果你是接手这个仓库的人，可以把当前状态理解为：

- 后端主链路已经可联调
- 前端主线现在默认连真实后端
- 这一轮已经尽量把“假成功”的地方清理掉
- 从这里开始，继续工作时应该优先暴露真实问题，而不是再加新的本地 fallback

## 参考文档

- `README.md`
- `docs/v1-contracts.md`
- `docs/backend-frontend-handoff.md`
- `功能设计说明书.docx`
- `界面设计说明书.docx`
