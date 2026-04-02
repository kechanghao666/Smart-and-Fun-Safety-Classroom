import { Router } from "express";
import { requireRole } from "../middleware/auth";
import {
  buildStudentProgress,
  completeLevel,
  parseLevelId,
  saveStudentProfile,
  startLevel,
  submitExam,
} from "../services/studentService";
import { HttpError } from "../utils/httpError";

export const studentRouter = Router();
const studentStages = new Set(["小学低段", "小学中段", "小学高段"]);

studentRouter.use(requireRole("student"));

studentRouter.get("/progress", async (request, response, next) => {
  try {
    response.json(await buildStudentProgress(request.authUser!.id));
  } catch (error) {
    next(error);
  }
});

studentRouter.post("/profile", async (request, response, next) => {
  try {
    const nickname = String(request.body?.nickname ?? "").trim();
    const avatarId = String(request.body?.avatarId ?? "").trim();
    const avatarLabel = String(request.body?.avatarLabel ?? "").trim();
    const stage = request.body?.stage;

    if (
      !nickname ||
      !avatarId ||
      !avatarLabel ||
      typeof stage !== "string" ||
      !studentStages.has(stage)
    ) {
      throw new HttpError(400, "学生资料字段不完整。");
    }

    response.json(
      await saveStudentProfile(request.authUser!.id, {
        nickname,
        avatarId,
        avatarLabel,
        stage: stage as "小学低段" | "小学中段" | "小学高段",
      }),
    );
  } catch (error) {
    next(error);
  }
});

studentRouter.post("/levels/:levelId/start", async (request, response, next) => {
  try {
    response.json(
      await startLevel(request.authUser!.id, parseLevelId(request.params.levelId)),
    );
  } catch (error) {
    next(error);
  }
});

studentRouter.post("/levels/:levelId/complete", async (request, response, next) => {
  try {
    response.json(
      await completeLevel(request.authUser!.id, parseLevelId(request.params.levelId)),
    );
  } catch (error) {
    next(error);
  }
});

studentRouter.post("/exam/submit", async (request, response, next) => {
  try {
    const answers = Array.isArray(request.body?.answers) ? request.body.answers : [];

    response.json(await submitExam(request.authUser!.id, answers));
  } catch (error) {
    next(error);
  }
});
