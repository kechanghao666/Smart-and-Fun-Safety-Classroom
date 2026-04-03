import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { parseLevelId } from "../services/studentService";
import { chatWithAi } from "../services/aiService";
import { HttpError } from "../utils/httpError";

export const aiRouter = Router();

aiRouter.use(requireAuth);

aiRouter.post("/chat", async (request, response, next) => {
  try {
    const scene = request.body?.scene;

    if (scene !== "welcome" && scene !== "hint" && scene !== "qa") {
      throw new HttpError(400, "AI 场景参数无效。");
    }

    response.json(
      await chatWithAi(request.authUser!, {
        scene,
        levelId: request.body?.levelId
          ? parseLevelId(String(request.body.levelId))
          : undefined,
        message: request.body?.message,
      }),
    );
  } catch (error) {
    next(error);
  }
});
