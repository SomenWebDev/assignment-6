import httpStatus from "http-status";
import type { Request, Response } from "express";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import {
  createProblem,
  getProblems,
  getProblemById,
  updateProblem,
  deleteProblem,
  type ListProblemsQuery,
} from "./problem.service";

type Q = Required<ListProblemsQuery>;

export const createProblemHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await createProblem(req.user!.id, req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Problem created successfully",
      data: result,
    });
  },
);

export const getProblemsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const q = req.query;

    const query: ListProblemsQuery = {
      ...(typeof q.page === "string" && { page: Number(q.page) }),
      ...(typeof q.limit === "string" && { limit: Number(q.limit) }),
      ...(typeof q.search === "string" && { search: q.search }),
      ...(typeof q.type === "string" && { type: q.type as Q["type"] }),
      ...(typeof q.difficulty === "string" && {
        difficulty: q.difficulty as Q["difficulty"],
      }),
      ...(typeof q.tag === "string" && { tag: q.tag }),
      ...(typeof q.sortBy === "string" && {
        sortBy: q.sortBy as Q["sortBy"],
      }),
      ...(typeof q.order === "string" && { order: q.order as Q["order"] }),
    };

    const result = await getProblems(req.user!.id, query);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Problems retrieved successfully",
      meta: result.meta,
      data: result.problems,
    });
  },
);

export const getProblemByIdHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await getProblemById(req.user!.id, req.params.id as string);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Problem retrieved successfully",
      data: result,
    });
  },
);

export const updateProblemHandler = catchAsync(
  async (req: Request, res: Response) => {
    const result = await updateProblem(
      req.user!.id,
      req.params.id as string,
      req.body,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Problem updated successfully",
      data: result,
    });
  },
);

export const deleteProblemHandler = catchAsync(
  async (req: Request, res: Response) => {
    await deleteProblem(req.user!.id, req.params.id as string);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Problem deleted successfully",
      data: null,
    });
  },
);
