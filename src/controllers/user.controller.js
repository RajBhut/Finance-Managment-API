import { asyncHandler, sendSuccess } from "../utils/index.js";
import {
  createUserRecord,
  getUserById,
  listUsers,
  updateUser,
} from "../services/user.service.js";

export const createUser = asyncHandler(async (req, res) => {
  const user = await createUserRecord(req.body, req.user);
  return sendSuccess(res, 201, "User created successfully.", user);
});

export const listAllUsers = asyncHandler(async (req, res) => {
  const result = await listUsers(req.query);
  return sendSuccess(
    res,
    200,
    "Users fetched successfully.",
    result.data,
    result.meta,
  );
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);
  return sendSuccess(res, 200, "User fetched successfully.", user);
});

export const editUser = asyncHandler(async (req, res) => {
  const user = await updateUser(req.params.id, req.body, req.user);
  return sendSuccess(res, 200, "User updated successfully.", user);
});
