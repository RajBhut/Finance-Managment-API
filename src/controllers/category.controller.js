import { asyncHandler, sendSuccess } from "../utils/index.js";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "../services/category.service.js";

export const createCategoryController = asyncHandler(async (req, res) => {
  const category = await createCategory(req.body, req.user);
  return sendSuccess(res, 201, "Category created successfully.", category);
});

export const listCategoryController = asyncHandler(async (req, res) => {
  const result = await listCategories(req.query);
  return sendSuccess(
    res,
    200,
    "Categories fetched successfully.",
    result.data,
    result.meta,
  );
});

export const updateCategoryController = asyncHandler(async (req, res) => {
  const category = await updateCategory(req.params.id, req.body, req.user);
  return sendSuccess(res, 200, "Category updated successfully.", category);
});

export const deleteCategoryController = asyncHandler(async (req, res) => {
  const category = await deleteCategory(req.params.id, req.user);
  return sendSuccess(res, 200, "Category deleted successfully.", category);
});
