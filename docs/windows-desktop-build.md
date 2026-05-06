# Windows 软件版打包说明

本文档说明如何把“星途知学—— AI 赋能青少年多元成长教育平台”打包成 Windows 桌面软件。

## 产物形式

打包后会生成 Electron 桌面版软件，启动后自动在本机开启后端服务，并打开软件窗口。用户不需要手动分别启动前端和后端。

软件运行数据保存在当前 Windows 用户的应用数据目录中，不会写入源码目录。

## 环境要求

- Windows 10/11
- Node.js 20+
- npm 10+

## 打包命令

在仓库根目录执行：

```bash
npm install
npm run desktop:dist
```

如果当前电脑只安装了 Node 24，建议先准备软件版内置的 Node 20 运行时：

```powershell
New-Item -ItemType Directory -Force -Path desktop-runtime
Invoke-WebRequest -Uri "https://nodejs.org/download/release/latest-v20.x/node-v20.20.2-win-x64.zip" -OutFile "desktop-runtime\node-v20.20.2-win-x64.zip"
Expand-Archive -LiteralPath "desktop-runtime\node-v20.20.2-win-x64.zip" -DestinationPath "desktop-runtime" -Force
.\desktop-runtime\node-v20.20.2-win-x64\npm.cmd rebuild sqlite3
```

打包完成后，产物位于：

```text
release/
```

其中常用文件包括：

- `星途知学—— AI 赋能青少年多元成长教育平台 Setup *.exe`：安装版。
- `星途知学—— AI 赋能青少年多元成长教育平台 *.exe`：便携版。

## 本地预览桌面版

如果只想在本机验证桌面窗口是否正常启动，可执行：

```bash
npm run desktop:start
```

该命令会先构建前端和后端，再打开 Electron 窗口。

## 默认账号

- 学生：`student001 / 123456`
- 教师：`teacher001 / 123456`
- 管理员：`admin001 / 123456`

## AI 配置说明

软件版默认不强制使用本地兜底文案，会优先调用 Spark AI。未配置 Spark 密钥时，AI 请求会明确报错，避免把本地模板回复误认为真实 AI 回复。

如需真实 AI 联机，可在启动前配置环境变量，也可在当前 Windows 用户的软件数据目录下准备 `ai.env`：

```bash
SPARK_API_PASSWORD=你的凭据
AI_FALLBACK_ENABLED=false
```

`ai.env` 支持的常用配置项与后端 `.env.example` 保持一致，例如 `SPARK_API_PASSWORD`、`SPARK_MODEL`、`AI_FALLBACK_ENABLED`。

请勿将真实密钥提交到仓库或打包进公开安装包。
