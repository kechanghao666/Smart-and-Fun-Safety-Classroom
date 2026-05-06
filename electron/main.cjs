const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { app: electronApp, BrowserWindow, dialog, shell } = require("electron");

const APP_DISPLAY_NAME = "星途知学—— AI 赋能青少年多元成长教育平台";
let server = null;

electronApp.setName(APP_DISPLAY_NAME);

function getAppRoot() {
  return path.resolve(__dirname, "..");
}

function getRuntimeNodePath(appRoot) {
  const runtimeRelativePath = path.join(
    "desktop-runtime",
    "node-v20.20.2-win-x64",
    "node.exe",
  );
  const packagedPath = path.join(process.resourcesPath, runtimeRelativePath);
  const devPath = path.join(appRoot, runtimeRelativePath);

  if (electronApp.isPackaged) {
    return packagedPath;
  }

  return devPath;
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const entries = {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) {
      entries[key] = value;
    }
  }

  return entries;
}

function loadDesktopEnv(appRoot, userDataDir) {
  return Object.assign(
    {},
    parseEnvFile(path.join(appRoot, ".env")),
    parseEnvFile(path.join(appRoot, "backend", ".env")),
    parseEnvFile(path.join(userDataDir, "ai.env")),
  );
}

async function startBackend() {
  return new Promise((resolve, reject) => {
    const appRoot = getAppRoot();
    const nodePath = getRuntimeNodePath(appRoot);
    const launcherPath = path.join(appRoot, "electron", "backend-launcher.cjs");
    const userDataDir = electronApp.getPath("userData");
    const desktopEnv = loadDesktopEnv(appRoot, userDataDir);
    let settled = false;

    const child = spawn(nodePath, [launcherPath], {
      cwd: appRoot,
      env: {
        ...process.env,
        ...desktopEnv,
        HOST: "127.0.0.1",
        PORT: "0",
        DB_PATH: path.join(
          userDataDir,
          "data",
          "xingtuzhixue.sqlite",
        ),
        SESSION_TTL_HOURS: process.env.SESSION_TTL_HOURS || "72",
        AI_FALLBACK_ENABLED:
          desktopEnv.AI_FALLBACK_ENABLED || process.env.AI_FALLBACK_ENABLED || "false",
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill();
        reject(new Error("Local backend did not report ready in time."));
      }
    }, 30_000);

    child.stdout.on("data", (chunk) => {
      const output = chunk.toString("utf8");
      const match = output.match(/SMART_CLASSROOM_READY:(\d+)/);

      if (match && !settled) {
        settled = true;
        clearTimeout(timeout);
        server = child;
        resolve(`http://127.0.0.1:${match[1]}`);
      }
    });

    child.stderr.on("data", (chunk) => {
      console.error(chunk.toString("utf8"));
    });

    child.on("error", (error) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        reject(error);
      }
    });

    child.on("exit", (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(timeout);
        reject(new Error(`Local backend exited before startup, code ${code}.`));
      }
    });
  });
}

function createWindow(localUrl) {
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1080,
    minHeight: 680,
    title: APP_DISPLAY_NAME,
    autoHideMenuBar: true,
    backgroundColor: "#f4fbff",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  window.loadURL(localUrl);
}

async function boot() {
  try {
    const localUrl = await startBackend();
    createWindow(localUrl);
  } catch (error) {
    dialog.showErrorBox(
      `${APP_DISPLAY_NAME}启动失败`,
      error instanceof Error ? error.message : String(error),
    );
    electronApp.quit();
  }
}

electronApp.whenReady().then(boot);

electronApp.on("window-all-closed", () => {
  if (server) {
    server.kill();
    server = null;
  }

  electronApp.quit();
});
