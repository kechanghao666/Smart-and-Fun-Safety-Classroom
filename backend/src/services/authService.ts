import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { env } from "../config/env";
import { getDb } from "../db/connection";
import { buildStudentProgress, getStudentProfile } from "./studentService";
import { recordStudentLogin } from "./growthService";
import type { AuthenticatedUser, LoginResponse } from "../types/contracts";
import { HttpError } from "../utils/httpError";

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64);
}

function verifyPassword(password: string, salt: string, expectedHash: string) {
  const actualHash = hashPassword(password, salt);
  const expected = Buffer.from(expectedHash, "hex");

  return (
    actualHash.length === expected.length &&
    timingSafeEqual(actualHash, expected)
  );
}

export async function loginWithPassword(
  account: string,
  password: string,
): Promise<LoginResponse> {
  const db = await getDb();
  const user = await db.get<{
    id: string;
    account: string;
    role: "student" | "teacher" | "admin";
    password_hash: string;
    password_salt: string;
    display_name: string;
    status: "active" | "paused";
  }>(
    `
      SELECT id, account, role, password_hash, password_salt, display_name, status
      FROM users
      WHERE account = ?
    `,
    account,
  );

  if (!user || !verifyPassword(password, user.password_salt, user.password_hash)) {
    throw new HttpError(401, "账号或密码不正确。");
  }

  if (user.status !== "active") {
    throw new HttpError(403, "当前账号已暂停，请联系管理员处理。");
  }

  const token = `session_${randomBytes(24).toString("hex")}`;
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + env.sessionTtlHours * 60 * 60 * 1000,
  ).toISOString();

  await db.run(
    `
      INSERT INTO sessions (token, user_id, created_at, expires_at)
      VALUES (?, ?, ?, ?)
    `,
    token,
    user.id,
    now.toISOString(),
    expiresAt,
  );

  if (user.role === "student") {
    await recordStudentLogin(user.id);

    return {
      token,
      role: user.role,
      account: user.account,
      displayName: user.display_name,
      studentProfile: await getStudentProfile(user.id),
      progress: await buildStudentProgress(user.id),
    };
  }

  return {
    token,
    role: user.role,
    account: user.account,
    displayName: user.display_name,
  };
}

export async function authenticateToken(token: string): Promise<AuthenticatedUser> {
  const db = await getDb();
  const row = await db.get<{
    id: string;
    account: string;
    role: "student" | "teacher" | "admin";
    display_name: string;
    status: "active" | "paused";
    expires_at: string;
  }>(
    `
      SELECT
        users.id,
        users.account,
        users.role,
        users.display_name,
        users.status,
        sessions.expires_at
      FROM sessions
      INNER JOIN users ON users.id = sessions.user_id
      WHERE sessions.token = ?
    `,
    token,
  );

  if (!row) {
    throw new HttpError(401, "登录状态已失效，请重新登录。");
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await db.run("DELETE FROM sessions WHERE token = ?", token);
    throw new HttpError(401, "登录状态已过期，请重新登录。");
  }

  if (row.status !== "active") {
    await db.run("DELETE FROM sessions WHERE token = ?", token);
    throw new HttpError(403, "当前账号已暂停，请联系管理员处理。");
  }

  return {
    id: row.id,
    account: row.account,
    role: row.role,
    displayName: row.display_name,
  };
}
