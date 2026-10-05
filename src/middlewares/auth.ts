import httpStatus from "http-status";
import type { NextFunction, Request, Response } from "express";

import { catchAsync } from "../utils/catchAsync";
import AppError from "../errors/AppError";
import { verifyAccessToken, type UserRole } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

const auth = (...allowedRoles: UserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized");
    }

    const decoded = verifyAccessToken(token);

    if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You do not have permission to access this resource",
      );
    }

    req.user = decoded;
    next();
  });
};

export default auth;
