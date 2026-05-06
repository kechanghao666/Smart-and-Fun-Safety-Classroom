# 星途知学移动端 App

这是项目的 React Native + Expo 移动端工程。当前第一版覆盖学生端和教师端，管理员端继续使用 Web 后台。

## 目录定位

- `backend/`：统一后端 API。
- `frontend/`：Web 端，继续服务教师端、管理员端和原有网页。
- `mobile/`：移动端 App，使用 Expo Router + TypeScript。

## 环境变量

移动端请求地址通过 `EXPO_PUBLIC_API_BASE_URL` 配置。

本地开发时可以复制：

```bash
cp .env.example .env
```

如果用手机 Expo Go 真机访问本机后端，不能使用 `127.0.0.1`，需要把 `.env` 改为电脑局域网 IP：

```env
EXPO_PUBLIC_API_BASE_URL=http://你的电脑局域网IP:3001/api
```

打包 APK 测试时使用公网后端：

```env
EXPO_PUBLIC_API_BASE_URL=http://101.133.142.142/api
```

当前 `eas.json` 的 `preview` 和 `production` profile 已默认使用公网后端地址。

## 本地运行

在仓库根目录执行：

```bash
npm run dev:backend
npm run dev:mobile -- --lan
```

手机和电脑需要在同一个 Wi-Fi，手机安装 Expo Go 后扫描终端二维码。

## 检查命令

在仓库根目录执行：

```bash
npm --workspace xingtu-zhixue-mobile run lint
npm --workspace xingtu-zhixue-mobile exec -- tsc --noEmit
npx expo export --platform web --output-dir ..\.codex-run\mobile-web
npm run build
npm run check
```

## APK 打包

### 云端 APK 测试包

需要先登录 Expo 账号：

```bash
npx eas-cli login
```

然后在 `mobile/` 目录执行：

```bash
npm run build:android:apk
```

产物是可直接安装测试的 APK，适合发给手机验收。

### 本地 APK 构建

本地构建需要电脑安装并配置 Java JDK、Android SDK、Android build tools 和 Gradle 环境：

```bash
npm run build:android:local
```

如果本机没有 Android 原生构建环境，请使用 EAS 云端构建。

### 正式上架包

如果后续要上架应用市场，使用 AAB：

```bash
npm run build:android:aab
```

上架前还需要准备隐私政策、应用截图、权限说明、应用签名与市场审核资料。

## 当前移动端功能

学生端：

- 登录、注册、退出登录。
- 首页、主题学习、三关关卡流程。
- 考试、考试结果、错题回看。
- AI 助手、成长档案、学习记录、个人中心。

教师端：

- 登录、退出登录。
- 教师工作台。
- 班级列表、班级学生分页。
- 学生列表、学生详情。
- 查看进度、考试、错题主题和建议动作。

## 当前边界

- 管理员端暂不做 App，继续使用 Web 后台。
- 教师端移动版以查看为主，复杂管理操作仍保留在 Web。
- 当前后端没有教师查看单个学生完整学习记录明细的独立接口，移动端学生详情使用现有聚合字段展示。
