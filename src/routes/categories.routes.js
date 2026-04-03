import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  createCategoryController,
  deleteCategoryController,
  listCategoryController,
  updateCategoryController,
} from "../controllers/category.controller.js";
import {
  createCategorySchema,
  listCategoriesQuerySchema,
  updateCategorySchema,
} from "../validators/category.validator.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  validate(listCategoriesQuerySchema, "query"),
  listCategoryController,
);
router.post(
  "/",
  authorizeRoles("ADMIN"),
  validate(createCategorySchema),
  createCategoryController,
);
router.patch(
  "/:id",
  authorizeRoles("ADMIN"),
  validate(updateCategorySchema),
  updateCategoryController,
);
router.delete("/:id", authorizeRoles("ADMIN"), deleteCategoryController);

export default router;
