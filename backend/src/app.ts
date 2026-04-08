import fs from "fs";
import path from "path";
import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { adminRouter } from "./routes/adminRoutes";
import { aiRouter } from "./routes/aiRoutes";
import { authRouter } from "./routes/authRoutes";
import { studentRouter } from "./routes/studentRoutes";
import { teacherRouter } from "./routes/teacherRoutes";
import { HttpError } from "./utils/httpError";

const configuredOrigins = env.corsOrigin
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const localDevOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
const frontendDistDir = path.resolve(__dirname, "../../frontend/dist");
const frontendIndexPath = path.join(frontendDistDir, "index.html");
const hasFrontendBuild = fs.existsSync(frontendIndexPath);

function isAllowedOrigin(origin?: string) {
  if (!origin) {
    return true;
  }

  if (configuredOrigins.includes(origin)) {
    return true;
  }

  return localDevOriginPattern.test(origin);
}

export const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new HttpError(403, "当前访问来源未被允许，请检查前端地址配置。"));
    },
    credentials: false,
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/student", studentRouter);
app.use("/api/teacher", teacherRouter);
app.use("/api/admin", adminRouter);
app.use("/api/ai", aiRouter);

if (hasFrontendBuild) {
  app.use(express.static(frontendDistDir));

  app.get("*", (request, response, next) => {
    if (request.path.startsWith("/api")) {
      next();
      return;
    }

    response.sendFile(frontendIndexPath);
  });
}

app.use((_request, _response, next) => {
  next(new HttpError(404, "未找到对应接口。"));
});

app.use(
  (
    error: Error & { statusCode?: number },
    _request: express.Request,
    response: express.Response,
    _next: express.NextFunction,
  ) => {
    const statusCode = error.statusCode ?? 500;
    response.status(statusCode).json({
      message: statusCode >= 500 ? "服务器内部错误。" : error.message,
    });
  },
);
