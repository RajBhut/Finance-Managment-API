import Joi from "joi";

export const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  type: Joi.string().valid("INCOME", "EXPENSE").required(),
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(120),
  type: Joi.string().valid("INCOME", "EXPENSE"),
}).min(1);

export const listCategoriesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  search: Joi.string().trim().allow(""),
  type: Joi.string().valid("INCOME", "EXPENSE"),
  sortBy: Joi.string().valid("createdAt", "name"),
  sortOrder: Joi.string().valid("asc", "desc"),
});
