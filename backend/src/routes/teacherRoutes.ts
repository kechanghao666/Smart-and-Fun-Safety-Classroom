import { Router } from "express";
import { requireRole } from "../middleware/auth";
import {
  getTeacherDashboard,
  getTeacherStudentDetail,
  getTeacherStudents,
} from "../services/reportingService";

export const teacherRouter = Router();

teacherRouter.use(requireRole("teacher"));

teacherRouter.get("/dashboard", async (_request, response, next) => {
  try {
    response.json(await getTeacherDashboard());
  } catch (error) {
    next(error);
  }
});

teacherRouter.get("/students", async (_request, response, next) => {
  try {
    response.json(await getTeacherStudents());
  } catch (error) {
    next(error);
  }
});

teacherRouter.get("/students/:id", async (request, response, next) => {
  try {
    response.json(await getTeacherStudentDetail(request.params.id));
  } catch (error) {
    next(error);
  }
});
