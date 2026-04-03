import { Router } from "express";
import authRoutes from "./auth.routes.js";
import usersRoutes from "./users.routes.js";
import recordsRoutes from "./records.routes.js";
import categoriesRoutes from "./categories.routes.js";
import dashboardRoutes from "./dashboard.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/records", recordsRoutes);
router.use("/categories", categoriesRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
