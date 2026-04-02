import { Router } from "express";
import { requireRole } from "../middleware/auth";
import {
  getAdminAiCopyFromDb,
  getAdminLevelsFromDb,
  getAdminQuestionBankFromDb,
  getAdminThemesFromDb,
  updateAdminAiCopy,
  updateAdminLevel,
  updateAdminQuestionBank,
  updateAdminTheme,
} from "../services/adminContentService";
import {
  getAdminModules,
  getAdminStats,
  getAdminUsers,
} from "../services/reportingService";

export const adminRouter = Router();

adminRouter.use(requireRole("admin"));

adminRouter.get("/modules", async (_request, response, next) => {
  try {
    response.json(await getAdminModules());
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/themes", async (_request, response, next) => {
  try {
    response.json(await getAdminThemesFromDb());
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/levels", async (_request, response, next) => {
  try {
    response.json(await getAdminLevelsFromDb());
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/question-bank", async (_request, response, next) => {
  try {
    response.json(await getAdminQuestionBankFromDb());
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/ai-copy", async (_request, response, next) => {
  try {
    response.json(await getAdminAiCopyFromDb());
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/users", async (_request, response, next) => {
  try {
    response.json(await getAdminUsers());
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/stats", async (_request, response, next) => {
  try {
    response.json(await getAdminStats());
  } catch (error) {
    next(error);
  }
});

adminRouter.put("/themes/:id", async (request, response, next) => {
  try {
    response.json(await updateAdminTheme(request.params.id, request.body ?? {}));
  } catch (error) {
    next(error);
  }
});

adminRouter.put("/levels/:id", async (request, response, next) => {
  try {
    response.json(await updateAdminLevel(request.params.id, request.body ?? {}));
  } catch (error) {
    next(error);
  }
});

adminRouter.put("/question-bank/:id", async (request, response, next) => {
  try {
    response.json(await updateAdminQuestionBank(request.params.id, request.body ?? {}));
  } catch (error) {
    next(error);
  }
});

adminRouter.put("/ai-copy/:id", async (request, response, next) => {
  try {
    response.json(await updateAdminAiCopy(request.params.id, request.body ?? {}));
  } catch (error) {
    next(error);
  }
});
