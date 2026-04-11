import { Router } from "express";
import { requireRole } from "../middleware/auth";
import {
  approveTeacherClassApplication,
  getTeacherClassApplications,
  inviteStudentToClassByStudentNo,
  rejectTeacherClassApplication,
} from "../services/classMembershipService";
import {
  createTeacherClass,
  getTeacherClassesPage,
  getTeacherClassStudents,
  getTeacherDashboard,
  getTeacherStudentDetail,
  getTeacherStudents,
  updateTeacherClass,
} from "../services/reportingService";
import { HttpError } from "../utils/httpError";

export const teacherRouter = Router();

teacherRouter.use(requireRole("teacher"));

teacherRouter.get("/classes", async (request, response, next) => {
  try {
    response.json(
      await getTeacherClassesPage(request.authUser!.id, {
        page:
          typeof request.query.page === "string" ? Number(request.query.page) : undefined,
        pageSize:
          typeof request.query.pageSize === "string"
            ? Number(request.query.pageSize)
            : undefined,
        query: typeof request.query.query === "string" ? request.query.query : undefined,
      }),
    );
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

teacherRouter.post("/classes/:classId/invite-student", async (request, response, next) => {
  try {
    const studentNo = String(request.body?.studentNo ?? "").trim();

    if (!studentNo) {
      throw new HttpError(400, "学号不能为空。");
    }

    response.json(
      await inviteStudentToClassByStudentNo(
        request.authUser!.id,
        request.params.classId,
        studentNo,
      ),
    );
  } catch (error) {
    next(error);
  }
});

teacherRouter.get("/classes/:classId/applications", async (request, response, next) => {
  try {
    response.json(
      await getTeacherClassApplications(request.authUser!.id, request.params.classId, {
        page:
          typeof request.query.page === "string" ? Number(request.query.page) : undefined,
        pageSize:
          typeof request.query.pageSize === "string"
            ? Number(request.query.pageSize)
            : undefined,
        query: typeof request.query.query === "string" ? request.query.query : undefined,
      }),
    );
  } catch (error) {
    next(error);
  }
});

teacherRouter.get("/classes/:classId/students", async (request, response, next) => {
  try {
    response.json(
      await getTeacherClassStudents(request.authUser!.id, request.params.classId, {
        page:
          typeof request.query.page === "string" ? Number(request.query.page) : undefined,
        pageSize:
          typeof request.query.pageSize === "string"
            ? Number(request.query.pageSize)
            : undefined,
        query: typeof request.query.query === "string" ? request.query.query : undefined,
      }),
    );
  } catch (error) {
    next(error);
  }
});

teacherRouter.post(
  "/classes/:classId/applications/:applicationId/approve",
  async (request, response, next) => {
    try {
      response.json(
        await approveTeacherClassApplication(
          request.authUser!.id,
          request.params.classId,
          request.params.applicationId,
        ),
      );
    } catch (error) {
      next(error);
    }
  },
);

teacherRouter.post(
  "/classes/:classId/applications/:applicationId/reject",
  async (request, response, next) => {
    try {
      response.json(
        await rejectTeacherClassApplication(
          request.authUser!.id,
          request.params.classId,
          request.params.applicationId,
        ),
      );
    } catch (error) {
      next(error);
    }
  },
);

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
        query: typeof request.query.query === "string" ? request.query.query : undefined,
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
        page:
          typeof request.query.page === "string" ? Number(request.query.page) : undefined,
        pageSize:
          typeof request.query.pageSize === "string"
            ? Number(request.query.pageSize)
            : undefined,
      }),
    );
  } catch (error) {
    next(error);
  }
});

teacherRouter.get("/students/:id", async (request, response, next) => {
  try {
    response.json(
      await getTeacherStudentDetail(request.params.id, request.authUser!.id),
    );
  } catch (error) {
    next(error);
  }
});
