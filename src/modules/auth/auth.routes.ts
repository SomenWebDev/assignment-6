import { Router } from "express";

import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { AuthValidation } from "./auth.validation";
import {
  registerCandidateHandler,
  registerCompanyHandler,
  loginHandler,
  googleRedirectHandler,
  googleCallbackHandler,
  refreshTokenHandler,
  logoutHandler,
  meHandler,
} from "./auth.controller";

const router = Router();

router.post(
  "/register/candidate",
  validateRequest(AuthValidation.registerCandidateSchema),
  registerCandidateHandler,
);

router.post(
  "/register/company",
  validateRequest(AuthValidation.registerCompanySchema),
  registerCompanyHandler,
);

router.post(
  "/login",
  validateRequest(AuthValidation.loginSchema),
  loginHandler,
);

router.get("/google", googleRedirectHandler);
router.get("/google/callback", googleCallbackHandler);

router.post(
  "/refresh-token",
  validateRequest(AuthValidation.refreshTokenSchema),
  refreshTokenHandler,
);

router.post("/logout", logoutHandler);

router.get("/me", auth(), meHandler);

export const AuthRoutes = router;
