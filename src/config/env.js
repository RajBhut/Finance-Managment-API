import "dotenv/config";
import Joi from "joi";

const isProduction = process.env.NODE_ENV === "production";

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
  PORT: Joi.number().integer().min(1).max(65535).default(3000),
  DATABASE_URL: Joi.string().required(),
  CORS_ORIGIN: Joi.string().default("http://localhost:5173"),
  JWT_ACCESS_SECRET: Joi.string().min(32).default("dev-access-secret-change-me-please-123456"),
  JWT_REFRESH_SECRET: Joi.string().min(32).default("dev-refresh-secret-change-me-please-123456"),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default("7d"),
  RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(1000).default(15 * 60 * 1000),
  RATE_LIMIT_MAX: Joi.number().integer().min(1).default(200),
  AUTH_RATE_LIMIT_MAX: Joi.number().integer().min(1).default(20),
  REDIS_URL: Joi.string().uri({ scheme: ["redis", "rediss"] }).allow("", null).default(""),
  TRUST_PROXY: Joi.boolean().truthy("true").falsy("false").default(false),
  COOKIE_SECURE: Joi.boolean().truthy("true").falsy("false").default(isProduction),
}).unknown(true);

const { value, error } = envSchema.validate(process.env, {
  abortEarly: false,
  convert: true,
});

if (error) {
  throw new Error(`Environment validation failed: ${error.message}`);
}

if (isProduction) {
  const secretValues = [value.JWT_ACCESS_SECRET, value.JWT_REFRESH_SECRET];
  if (secretValues.some((secret) => `${secret}`.startsWith("dev-"))) {
    throw new Error("Production environment requires strong JWT secrets.");
  }
}

export const env = {
  NODE_ENV: value.NODE_ENV,
  PORT: value.PORT,
  DATABASE_URL: value.DATABASE_URL,
  CORS_ORIGIN: value.CORS_ORIGIN,
  JWT_ACCESS_SECRET: value.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: value.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: value.JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN: value.JWT_REFRESH_EXPIRES_IN,
  RATE_LIMIT_WINDOW_MS: value.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX: value.RATE_LIMIT_MAX,
  AUTH_RATE_LIMIT_MAX: value.AUTH_RATE_LIMIT_MAX,
  REDIS_URL: value.REDIS_URL,
  TRUST_PROXY: value.TRUST_PROXY,
  COOKIE_SECURE: value.COOKIE_SECURE,
};