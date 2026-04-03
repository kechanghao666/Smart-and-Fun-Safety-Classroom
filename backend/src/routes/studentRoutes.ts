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
import {
  completeStudentWrongQuestionReview,
  getStudentAiReport,
  getStudentExamReview,
  getStudentGrowth,
  getStudentRecords,
} from "../services/studentInsightsService";
import { updateStudentGrowthSelections } from "../services/growthService";
import { HttpError } from "../utils/httpError";

export const studentRouter = Router();
const studentStages = new Set(["灏忓浣庢", "灏忓涓", "灏忓楂樻"]);

studentRouter.use(requireRole("student"));

studentRouter.get("/progress", async (request, response, next) => {
  try {
    response.json(await buildStudentProgress(request.authUser!.id));
  } catch (error) {
    next(error);
  }
});

studentRouter.get("/records", async (request, response, next) => {
  try {
    response.json(await getStudentRecords(request.authUser!.id));
  } catch (error) {
    next(error);
  }
});

studentRouter.get("/exam/review", async (request, response, next) => {
  try {
    response.json(await getStudentExamReview(request.authUser!.id));
  } catch (error) {
    next(error);
  }
});

studentRouter.post("/exam/review/:questionId/complete", async (request, response, next) => {
  try {
    response.json(
      await completeStudentWrongQuestionReview(
        request.authUser!.id,
        String(request.params.questionId),
      ),
    );
  } catch (error) {
    next(error);
  }
});

studentRouter.get("/growth", async (request, response, next) => {
  try {
    response.json(await getStudentGrowth(request.authUser!.id));
  } catch (error) {
    next(error);
  }
});

studentRouter.put("/growth/preferences", async (request, response, next) => {
  try {
    await updateStudentGrowthSelections(request.authUser!.id, {
      appearance:
        typeof request.body?.appearance === "string" ? request.body.appearance : null,
      scene: typeof request.body?.scene === "string" ? request.body.scene : null,
    });
    response.json(await getStudentGrowth(request.authUser!.id));
  } catch (error) {
    next(error);
  }
});
studentRouter.get("/ai-report", async (request, response, next) => {
  try {
    response.json(await getStudentAiReport(request.authUser!.id));
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
      throw new HttpError(400, "瀛︾敓璧勬枡瀛楁涓嶅畬鏁淬€?);
    }

    response.json(
      await saveStudentProfile(request.authUser!.id, {
        nickname,
        avatarId,
        avatarLabel,
        stage: stage as "灏忓浣庢" | "灏忓涓" | "灏忓楂樻",
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

