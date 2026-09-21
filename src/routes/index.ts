import { Router } from "express";

const router = Router();

const moduleRoutes: { path: string; route: Router }[] = [];

moduleRoutes.forEach((r) => router.use(r.path, r.route));

export default router;
