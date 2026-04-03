import type { NextFunction, Request, Response } from "express";
import { authenticateToken } from "../services/authService";
import type { AuthenticatedUser, UserRole } from "../types/contracts";
import { HttpError } from "../utils/httpError";

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
    }
  }
}

export async function requireAuth(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  try {
    const authorization = request.header("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      throw new HttpError(401, "缺少有效的登录凭证。");
    }

    const token = authorization.slice("Bearer ".length).trim();
    request.authUser = await authenticateToken(token);
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles: UserRole[]) {
  return async (request: Request, response: Response, next: NextFunction) => {
    await requireAuth(request, response, async (error?: unknown) => {
      if (error) {
        next(error);
        return;
      }

      if (!request.authUser || !roles.includes(request.authUser.role)) {
        next(new HttpError(403, "当前账号没有访问该接口的权限。"));
        return;
      }

      next();
    });
  };
}
