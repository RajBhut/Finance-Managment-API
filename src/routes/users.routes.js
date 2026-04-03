import { Router } from "express";
import {
  createUser,
  editUser,
  getUser,
  listAllUsers,
} from "../controllers/user.controller.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validation.middleware.js";
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
} from "../validators/user.validator.js";

const router = Router();

router.use(authenticate, authorizeRoles("ADMIN"));

router.get("/", validate(listUsersQuerySchema, "query"), listAllUsers);
router.post("/", validate(createUserSchema), createUser);
router.get("/:id", getUser);
router.patch("/:id", validate(updateUserSchema), editUser);

export default router;
