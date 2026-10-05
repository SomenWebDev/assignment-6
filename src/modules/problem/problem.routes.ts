import { Router } from "express";

import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { ProblemValidation } from "./problem.validation";
import {
  createProblemHandler,
  getProblemsHandler,
  getProblemByIdHandler,
  updateProblemHandler,
  deleteProblemHandler,
} from "./problem.controller";

const router = Router();

router.use(auth("COMPANY"));

router.post(
  "/",
  validateRequest(ProblemValidation.createProblemSchema),
  createProblemHandler,
);

router.get(
  "/",
  validateRequest(ProblemValidation.listProblemsSchema),
  getProblemsHandler,
);

router.get(
  "/:id",
  validateRequest(ProblemValidation.problemIdSchema),
  getProblemByIdHandler,
);

router.patch(
  "/:id",
  validateRequest(ProblemValidation.updateProblemSchema),
  updateProblemHandler,
);

router.delete(
  "/:id",
  validateRequest(ProblemValidation.problemIdSchema),
  deleteProblemHandler,
);

export const ProblemRoutes = router;
