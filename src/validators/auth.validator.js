import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(8).max(200).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(8).max(200).required(),
});

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().trim().min(20).optional(),
});
