import { randomUUID } from "crypto";
import { getDb } from "../db/connection";
import type {
  ClassJoinRequestStatus,
  PaginatedResponse,
  PaginationQuery,
  StudentClassMembershipResponse,
  StudentProfileRow,
  TeacherClassApplicationItem,
  TeacherClassRow,
} from "../types/contracts";
import { HttpError } from "../utils/httpError";
import { ensureUniqueClassCode } from "../utils/identityCodes";
import { paginateItems, resolvePaginationQuery } from "../utils/pagination";

async function getTeacherOwnedClass(teacherUserId: string, classId: string) {
  const db = await getDb();
  const row = await db.get<TeacherClassRow>(
    `
      SELECT id, teacher_user_id, name, class_code, description, created_at, updated_at
      FROM teacher_classes
      WHERE id = ? AND teacher_user_id = ?
    `,
    classId,
    teacherUserId,
  );

  if (!row) {
    throw new HttpError(404, "未找到对应班级。");
  }

  return row;
}

async function getStudentProfileRow(userId: string) {
  const db = await getDb();
  const row = await db.get<StudentProfileRow>(
    `
      SELECT
        user_id, nickname, avatar_id, avatar_label, stage, student_no, class_id, class_name,
        base_points, starter_badges_json, last_visited_route, created_at, updated_at
      FROM student_profiles
      WHERE user_id = ?
    `,
    userId,
  );

  if (!row) {
    throw new HttpError(404, "未找到学生档案。");
  }

  return row;
}

async function ensureClassCodeForResponse(
  db: Awaited<ReturnType<typeof getDb>>,
  row:
    | {
        id: string;
        name: string;
        class_code: string | null;
      }
    | null,
) {
  if (!row) {
    return null;
  }

  if (row.class_code && row.class_code.trim()) {
    return {
      ...row,
      class_code: row.class_code,
    };
  }

  const classCode = await ensureUniqueClassCode(db, row.id, row.id);
  await db.run(
    `
      UPDATE teacher_classes
      SET class_code = ?, updated_at = ?
      WHERE id = ?
    `,
    classCode,
    new Date().toISOString(),
    row.id,
  );

  return {
    ...row,
    class_code: classCode,
  };
}

async function buildMembershipResponse(userId: string): Promise<StudentClassMembershipResponse> {
  const db = await getDb();
  const profile = await getStudentProfileRow(userId);
  const currentClass = await ensureClassCodeForResponse(
    db,
    profile.class_id
    ? (await db.get<{
        id: string;
        name: string;
        class_code: string | null;
      }>(
        `
          SELECT id, name, class_code
          FROM teacher_classes
          WHERE id = ?
        `,
        profile.class_id,
      )) ?? null
    : null,
  );
  const pending = await db.get<{
    id: string;
    class_id: string;
    status: ClassJoinRequestStatus;
    requested_at: string;
    name: string;
    class_code: string | null;
  }>(
    `
      SELECT
        class_join_requests.id,
        class_join_requests.class_id,
        class_join_requests.status,
        class_join_requests.requested_at,
        teacher_classes.name,
        teacher_classes.class_code
      FROM class_join_requests
      INNER JOIN teacher_classes ON teacher_classes.id = class_join_requests.class_id
      WHERE class_join_requests.student_user_id = ?
        AND class_join_requests.status = 'pending'
      ORDER BY class_join_requests.requested_at DESC
      LIMIT 1
    `,
    userId,
  );
  const ensuredPendingCode =
    pending && (!pending.class_code || !pending.class_code.trim())
      ? await ensureUniqueClassCode(db, pending.class_id, pending.class_id)
      : pending?.class_code ?? null;

  if (pending && ensuredPendingCode && ensuredPendingCode !== pending.class_code) {
    await db.run(
      `
        UPDATE teacher_classes
        SET class_code = ?, updated_at = ?
        WHERE id = ?
      `,
      ensuredPendingCode,
      new Date().toISOString(),
      pending.class_id,
    );
  }

  return {
    studentNo: profile.student_no ?? "",
    currentClass: currentClass
      ? {
          id: currentClass.id,
          name: currentClass.name,
          classCode: currentClass.class_code,
        }
      : null,
    pendingRequest: pending
      ? {
          id: pending.id,
          classId: pending.class_id,
          className: pending.name,
          classCode: ensuredPendingCode ?? "",
          status: pending.status,
          requestedAt: pending.requested_at,
        }
      : null,
  };
}

export async function getStudentClassMembership(userId: string) {
  return buildMembershipResponse(userId);
}

export async function applyStudentToClassByCode(userId: string, classCode: string) {
  const db = await getDb();
  const normalizedCode = String(classCode).trim().toUpperCase();

  if (!normalizedCode) {
    throw new HttpError(400, "班级号不能为空。");
  }

  const profile = await getStudentProfileRow(userId);
  const targetClass = await db.get<TeacherClassRow>(
    `
      SELECT id, teacher_user_id, name, class_code, description, created_at, updated_at
      FROM teacher_classes
      WHERE class_code = ?
    `,
    normalizedCode,
  );

  if (!targetClass) {
    throw new HttpError(404, "未找到对应班级号。");
  }

  if (profile.class_id === targetClass.id) {
    return buildMembershipResponse(userId);
  }

  const now = new Date().toISOString();

  await db.run(
    `
      UPDATE class_join_requests
      SET status = 'rejected', reviewed_at = ?, reviewed_by = 'system'
      WHERE student_user_id = ? AND status = 'pending' AND class_id != ?
    `,
    now,
    userId,
    targetClass.id,
  );

  const existing = await db.get<{ id: string; status: ClassJoinRequestStatus }>(
    `
      SELECT id, status
      FROM class_join_requests
      WHERE student_user_id = ? AND class_id = ?
      ORDER BY requested_at DESC
      LIMIT 1
    `,
    userId,
    targetClass.id,
  );

  if (existing) {
    await db.run(
      `
        UPDATE class_join_requests
        SET status = 'pending', requested_at = ?, reviewed_at = NULL, reviewed_by = NULL
        WHERE id = ?
      `,
      now,
      existing.id,
    );
  } else {
    await db.run(
      `
        INSERT INTO class_join_requests (
          id, student_user_id, class_id, status, requested_at, reviewed_at, reviewed_by
        )
        VALUES (?, ?, ?, 'pending', ?, NULL, NULL)
      `,
      randomUUID(),
      userId,
      targetClass.id,
      now,
    );
  }

  return buildMembershipResponse(userId);
}

export async function inviteStudentToClassByStudentNo(
  teacherUserId: string,
  classId: string,
  studentNo: string,
) {
  const db = await getDb();
  const targetClass = await getTeacherOwnedClass(teacherUserId, classId);
  const normalizedStudentNo = String(studentNo).trim().toUpperCase();

  if (!normalizedStudentNo) {
    throw new HttpError(400, "学号不能为空。");
  }

  const student = await db.get<{
    user_id: string;
    student_no: string;
  }>(
    `
      SELECT user_id, student_no
      FROM student_profiles
      WHERE student_no = ?
    `,
    normalizedStudentNo,
  );

  if (!student) {
    throw new HttpError(404, "未找到对应学号的学生。");
  }

  await db.run(
    `
      UPDATE student_profiles
      SET class_id = ?, class_name = ?, updated_at = ?
      WHERE user_id = ?
    `,
    targetClass.id,
    targetClass.name,
    new Date().toISOString(),
    student.user_id,
  );

  await db.run(
    `
      UPDATE class_join_requests
      SET status = 'approved', reviewed_at = ?, reviewed_by = ?
      WHERE student_user_id = ? AND class_id = ? AND status = 'pending'
    `,
    new Date().toISOString(),
    teacherUserId,
    student.user_id,
    targetClass.id,
  );

  return buildMembershipResponse(student.user_id);
}

async function listTeacherClassApplications(
  teacherUserId: string,
  classId: string,
  query?: string,
): Promise<TeacherClassApplicationItem[]> {
  await getTeacherOwnedClass(teacherUserId, classId);
  const db = await getDb();
  const rows = await db.all<
    Array<{
      id: string;
      student_user_id: string;
      requested_at: string;
      status: ClassJoinRequestStatus;
      display_name: string;
      student_no: string;
      current_class_name: string | null;
    }>
  >(
    `
      SELECT
        class_join_requests.id,
        class_join_requests.student_user_id,
        class_join_requests.requested_at,
        class_join_requests.status,
        users.display_name,
        student_profiles.student_no,
        current_class.name AS current_class_name
      FROM class_join_requests
      INNER JOIN users ON users.id = class_join_requests.student_user_id
      INNER JOIN student_profiles ON student_profiles.user_id = class_join_requests.student_user_id
      LEFT JOIN teacher_classes AS current_class ON current_class.id = student_profiles.class_id
      WHERE class_join_requests.class_id = ?
      ORDER BY class_join_requests.requested_at DESC
    `,
    classId,
  );

  return rows
    .map((row) => ({
    id: row.id,
    studentId: row.student_user_id,
    studentNo: row.student_no,
    studentName: row.display_name,
    requestedAt: row.requested_at,
    currentClassName: row.current_class_name,
    status: row.status,
    }))
    .filter((item) => {
      if (!query) {
        return true;
      }

      const normalizedQuery = query.toLowerCase();
      return (
        item.studentName.toLowerCase().includes(normalizedQuery) ||
        item.studentNo.toLowerCase().includes(normalizedQuery) ||
        (item.currentClassName ?? "").toLowerCase().includes(normalizedQuery)
      );
    });
}

export async function getTeacherClassApplications(
  teacherUserId: string,
  classId: string,
  query?: PaginationQuery,
): Promise<PaginatedResponse<TeacherClassApplicationItem>> {
  const pagination = resolvePaginationQuery(query, { pageSize: 10 });
  const items = await listTeacherClassApplications(teacherUserId, classId, pagination.query);
  return paginateItems(items, pagination);
}

async function reviewClassApplication(
  teacherUserId: string,
  classId: string,
  applicationId: string,
  status: Extract<ClassJoinRequestStatus, "approved" | "rejected">,
) {
  const db = await getDb();
  const targetClass = await getTeacherOwnedClass(teacherUserId, classId);
  const application = await db.get<{
    id: string;
    student_user_id: string;
    status: ClassJoinRequestStatus;
  }>(
    `
      SELECT id, student_user_id, status
      FROM class_join_requests
      WHERE id = ? AND class_id = ?
    `,
    applicationId,
    classId,
  );

  if (!application) {
    throw new HttpError(404, "未找到对应申请。");
  }

  const now = new Date().toISOString();
  await db.run(
    `
      UPDATE class_join_requests
      SET status = ?, reviewed_at = ?, reviewed_by = ?
      WHERE id = ?
    `,
    status,
    now,
    teacherUserId,
    applicationId,
  );

  if (status === "approved") {
    await db.run(
      `
        UPDATE student_profiles
        SET class_id = ?, class_name = ?, updated_at = ?
        WHERE user_id = ?
      `,
      targetClass.id,
      targetClass.name,
      now,
      application.student_user_id,
    );

    await db.run(
      `
        UPDATE class_join_requests
        SET status = 'rejected', reviewed_at = ?, reviewed_by = ?
        WHERE student_user_id = ? AND status = 'pending' AND id != ?
      `,
      now,
      teacherUserId,
      application.student_user_id,
      applicationId,
    );
  }

  return listTeacherClassApplications(teacherUserId, classId);
}

export async function approveTeacherClassApplication(
  teacherUserId: string,
  classId: string,
  applicationId: string,
) {
  return reviewClassApplication(teacherUserId, classId, applicationId, "approved");
}

export async function rejectTeacherClassApplication(
  teacherUserId: string,
  classId: string,
  applicationId: string,
) {
  return reviewClassApplication(teacherUserId, classId, applicationId, "rejected");
}
