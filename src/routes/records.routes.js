import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  createRecordController,
  deleteRecordController,
  getRecordController,
  listRecordController,
  restoreRecordController,
  updateRecordController,
} from "../controllers/record.controller.js";
import {
  createRecordSchema,
  listRecordsQuerySchema,
  updateRecordSchema,
} from "../validators/record.validator.js";

const router = Router();

router.use(authenticate, authorizeRoles("ANALYST", "ADMIN"));

router.get(
  "/",
  validate(listRecordsQuerySchema, "query"),
  listRecordController,
);
router.post(
  "/",
  authorizeRoles("ADMIN"),
  validate(createRecordSchema),
  createRecordController,
);
router.get("/:id", getRecordController);
router.patch(
  "/:id",
  authorizeRoles("ADMIN"),
  validate(updateRecordSchema),
  updateRecordController,
);
router.delete("/:id", authorizeRoles("ADMIN"), deleteRecordController);
router.patch("/:id/restore", authorizeRoles("ADMIN"), restoreRecordController);

export default router;
