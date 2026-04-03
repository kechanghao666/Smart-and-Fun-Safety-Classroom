import { Router } from "express";
import { loginWithPassword } from "../services/authService";
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
