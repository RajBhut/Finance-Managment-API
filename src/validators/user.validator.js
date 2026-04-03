import Joi from "joi";

const baseUserSchema = {
  name: Joi.string().trim().min(2).max(120),
  email: Joi.string().trim().email(),
  password: Joi.string().min(8).max(200),
  role: Joi.string().valid("VIEWER", "ANALYST", "ADMIN"),
  status: Joi.string().valid("ACTIVE", "INACTIVE"),
};

export const createUserSchema = Joi.object({
  ...baseUserSchema,
  name: baseUserSchema.name.required(),
  email: baseUserSchema.email.required(),
  password: baseUserSchema.password.required(),
  role: baseUserSchema.role.default("VIEWER"),
  status: baseUserSchema.status.default("ACTIVE"),
});

export const updateUserSchema = Joi.object(baseUserSchema).min(1);

export const listUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  search: Joi.string().trim().allow(""),
  role: Joi.string().valid("VIEWER", "ANALYST", "ADMIN"),
  status: Joi.string().valid("ACTIVE", "INACTIVE"),
  sortBy: Joi.string().valid("createdAt", "updatedAt", "name", "email"),
  sortOrder: Joi.string().valid("asc", "desc"),
});
