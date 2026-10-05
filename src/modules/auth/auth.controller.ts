import httpStatus from "http-status";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import AppError from "../../errors/AppError";
import {
  registerCandidate,
  registerCompany,
  loginUser,
  getGoogleAuthUrl,
  loginWithGoogle,
  refreshAccessToken,
  getMe,
} from "./auth.service";

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie("refreshToken", token, {
    ...refreshCookieOptions,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

export const registerCandidateHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await registerCandidate(req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Candidate registered successfully",
      data: result,
    });
  },
);

export const registerCompanyHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await registerCompany(req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Company registered successfully",
      data: result,
    });
  },
);

export const loginHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await loginUser(req.body);

  setRefreshCookie(res, result.refreshToken);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Login successful",
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

export const googleRedirectHandler = catchAsync(
  async (req: Request, res: Response) => {
    const role = req.query.role === "COMPANY" ? "COMPANY" : "CANDIDATE";
    res.redirect(getGoogleAuthUrl(role));
  },
);

export const googleCallbackHandler = catchAsync(
  async (req: Request, res: Response) => {
    const code = req.query.code;
    if (typeof code !== "string") {
      throw new AppError(httpStatus.BAD_REQUEST, "Missing authorization code");
    }

    const state =
      typeof req.query.state === "string" ? req.query.state : undefined;

    const result = await loginWithGoogle(code, state);

    setRefreshCookie(res, result.refreshToken);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Google login successful",
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  },
);

export const refreshTokenHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await refreshAccessToken(req.cookies.refreshToken);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Access token refreshed",
      data: result,
    });
  },
);

export const logoutHandler = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie("refreshToken", refreshCookieOptions);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Logged out successfully",
    data: null,
  });
});

export const meHandler = catchAsync(async (req: Request, res: Response) => {
  const result = await getMe(req.user!.id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User retrieved successfully",
    data: result,
  });
});
