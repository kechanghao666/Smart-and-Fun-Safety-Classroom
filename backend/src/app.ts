import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { adminRouter } from "./routes/adminRoutes";
import { aiRouter } from "./routes/aiRoutes";
import { authRouter } from "./routes/authRoutes";
import { studentRouter } from "./routes/studentRoutes";
import { teacherRouter } from "./routes/teacherRoutes";
import { HttpError } from "./utils/httpError";

const allowedOrigins = env.corsOrigin.split(",").map((item) => item.trim());

export const app = express();

app.use(
  cors({
    origin: allowedOrigins,
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
