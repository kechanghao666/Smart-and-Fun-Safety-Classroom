import { Router } from "express";
import { requireRole } from "../middleware/auth";
import {
  getAdminAiCopy,
  getAdminLevels,
  getAdminModules,
  getAdminQuestionBank,
  getAdminStats,
  getAdminThemes,
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
    response.json(await getAdminThemes());
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/levels", async (_request, response, next) => {
  try {
    response.json(await getAdminLevels());
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/question-bank", async (_request, response, next) => {
  try {
    response.json(await getAdminQuestionBank());
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/ai-copy", async (_request, response, next) => {
  try {
    response.json(await getAdminAiCopy());
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
