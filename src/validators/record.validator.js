import Joi from "joi";

export const createRecordSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  type: Joi.string().valid("INCOME", "EXPENSE").required(),
  note: Joi.string().trim().max(500).allow(null, ""),
  date: Joi.date().iso().required(),
  userId: Joi.string().uuid(),
  categoryId: Joi.string().uuid(),
  categoryName: Joi.string().trim().min(2).max(120),
}).custom((value, helpers) => {
  if (!value.categoryId && !value.categoryName) {
    return value;
  }

  if (value.categoryId && value.categoryName) {
    return value;
  }

  return value;
}, "category flexibility");

export const updateRecordSchema = Joi.object({
  amount: Joi.number().positive().precision(2),
  type: Joi.string().valid("INCOME", "EXPENSE"),
  note: Joi.string().trim().max(500).allow(null, ""),
  date: Joi.date().iso(),
  userId: Joi.string().uuid(),
  categoryId: Joi.string().uuid(),
  categoryName: Joi.string().trim().min(2).max(120),
}).min(1);

export const listRecordsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  search: Joi.string().trim().allow(""),
  type: Joi.string().valid("INCOME", "EXPENSE"),
  userId: Joi.string().uuid(),
  categoryId: Joi.string().uuid(),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso(),
  includeDeleted: Joi.boolean(),
  sortBy: Joi.string().valid("date", "createdAt", "amount", "updatedAt"),
  sortOrder: Joi.string().valid("asc", "desc"),
});
