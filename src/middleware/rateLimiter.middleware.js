import rateLimit from "express-rate-limit";
import { createClient } from "redis";
import { RedisStore } from "rate-limit-redis";
import { env } from "../config/env.js";

let redisClient;

const getRedisStore = async (prefix) => {
  if (!env.REDIS_URL) {
    return undefined;
  }

  if (!redisClient) {
    redisClient = createClient({ url: env.REDIS_URL });
    redisClient.on("error", (error) => {
      console.warn(`Redis rate limiting fallback engaged: ${error.message}`);
    });
    await redisClient.connect();
  }

  return new RedisStore({
    prefix,
    sendCommand: async (...args) => redisClient.sendCommand(args),
  });
};

const buildLimiter = async ({ prefix, max, message }) => {
  const store = await getRedisStore(prefix);

  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    message: {
      success: false,
      message,
    },
  });
};

export const createRateLimiters = async () => {
  const apiLimiter = await buildLimiter({
    prefix: "api-rate-limit",
    max: env.RATE_LIMIT_MAX,
    message: "Too many requests. Please try again later.",
  });

  const authLimiter = await buildLimiter({
    prefix: "auth-rate-limit",
    max: env.AUTH_RATE_LIMIT_MAX,
    message: "Too many authentication attempts. Please slow down.",
  });

  return {
    apiLimiter,
    authLimiter,
  };
};