import { Router } from "express";
import { requireRole } from "../middleware/auth";
import {
  createTeacherClass,
  getTeacherClasses,
  getTeacherDashboard,
  getTeacherStudentDetail,
  getTeacherStudents,
  updateTeacherClass,
} from "../services/reportingService";

export const teacherRouter = Router();

teacherRouter.use(requireRole("teacher"));

teacherRouter.get("/classes", async (request, response, next) => {
  try {
    response.json(await getTeacherClasses(request.authUser!.id));
  } catch (error) {
    next(error);
  }
});

teacherRouter.post("/classes", async (request, response, next) => {
  try {
    response
      .status(201)
      .json(await createTeacherClass(request.authUser!.id, request.body ?? {}));
  } catch (error) {
    next(error);
  }
});

teacherRouter.put("/classes/:id", async (request, response, next) => {
  try {
    response.json(
      await updateTeacherClass(request.authUser!.id, request.params.id, request.body ?? {}),
    );
  } catch (error) {
    next(error);
  }
});

teacherRouter.get("/dashboard", async (request, response, next) => {
  try {
    response.json(await getTeacherDashboard(request.authUser!.id));
  } catch (error) {
    next(error);
  }
});

teacherRouter.get("/students", async (request, response, next) => {
  try {
    response.json(
      await getTeacherStudents(request.authUser!.id, {
        className:
          typeof request.query.className === "string"
            ? request.query.className
            : undefined,
        completionStatus:
          typeof request.query.completionStatus === "string"
            ? request.query.completionStatus
            : undefined,
        examStatus:
          typeof request.query.examStatus === "string"
            ? request.query.examStatus
            : undefined,
      }),
    );
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
