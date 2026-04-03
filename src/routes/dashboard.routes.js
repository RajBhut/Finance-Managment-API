import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import { summaryController } from "../controllers/dashboard.controller.js";
import { summaryQuerySchema } from "../validators/dashboard.validator.js";

const router = Router();

router.use(authenticate);
router.get(
  "/summary",
  validate(summaryQuerySchema, "query"),
  summaryController,
);

export default router;
