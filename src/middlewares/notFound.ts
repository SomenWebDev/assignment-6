import { type Request, type Response } from "express";
import httpStatus from "http-status";

const notFound = (req: Request, res: Response) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "API not found",
    errors: [
      {
        path: req.originalUrl,
        message: "Route not found",
      },
    ],
  });
};

export default notFound;
