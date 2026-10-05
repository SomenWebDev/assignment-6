import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.routes";
import { ProblemRoutes } from "../modules/problem/problem.routes";

const router = Router();

const moduleRoutes: { path: string; route: Router }[] = [
  { path: "/auth", route: AuthRoutes },
  { path: "/problems", route: ProblemRoutes },
];

moduleRoutes.forEach((r) => router.use(r.path, r.route));

export default router;
