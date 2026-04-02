import { Router } from "express";
import { requireRole } from "../middleware/auth";
import {
  createAdminAiCopy,
  createAdminQuestionBank,
  createAdminTheme,
  deleteAdminAiCopy,
  deleteAdminQuestionBank,
  deleteAdminTheme,
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

adminRouter.post("/themes", async (request, response, next) => {
  try {
    response.status(201).json(await createAdminTheme(request.body ?? {}));
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

adminRouter.post("/question-bank", async (request, response, next) => {
  try {
    response.status(201).json(await createAdminQuestionBank(request.body ?? {}));
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

adminRouter.post("/ai-copy", async (request, response, next) => {
  try {
    response.status(201).json(await createAdminAiCopy(request.body ?? {}));
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

adminRouter.delete("/themes/:id", async (request, response, next) => {
  try {
    response.json(await deleteAdminTheme(request.params.id));
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

adminRouter.delete("/question-bank/:id", async (request, response, next) => {
  try {
    response.json(await deleteAdminQuestionBank(request.params.id));
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

adminRouter.delete("/ai-copy/:id", async (request, response, next) => {
  try {
    response.json(await deleteAdminAiCopy(request.params.id));
  } catch (error) {
    next(error);
  }
});
