import { Router } from "express";
import {
  loginWithPassword,
  registerWithPassword,
  resetPasswordWithAccount,
} from "../services/authService";
import { HttpError } from "../utils/httpError";

export const authRouter = Router();

authRouter.post("/login", async (request, response, next) => {
  try {
    const account = String(request.body?.account ?? "").trim();
    const password = String(request.body?.password ?? "");

    if (!account || !password) {
      throw new HttpError(400, "请输入账号和密码。");
    }

    const loginResponse = await loginWithPassword(account, password);
    response.json(loginResponse);
  } catch (error) {
    next(error);
  }
});

authRouter.post("/register", async (request, response, next) => {
  try {
    const account = String(request.body?.account ?? "").trim();
    const password = String(request.body?.password ?? "");
    const displayName = String(request.body?.displayName ?? "").trim();
    const role = String(request.body?.role ?? "").trim();

    if (!account || !password || !displayName || !role) {
      throw new HttpError(400, "请完整填写注册信息。");
    }

    response.json(
      await registerWithPassword({
        account,
        password,
        displayName,
        role,
      }),
    );
  } catch (error) {
    next(error);
  }
});

authRouter.post("/reset-password", async (request, response, next) => {
  try {
    const account = String(request.body?.account ?? "").trim();
    const password = String(request.body?.password ?? "");

    if (!account || !password) {
      throw new HttpError(400, "请填写账号和新密码。");
    }

    response.json(
      await resetPasswordWithAccount({
        account,
        password,
      }),
    );
  } catch (error) {
    next(error);
  }
});
