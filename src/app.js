import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.js";
import { createRateLimiters } from "./middleware/rateLimiter.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { notFoundMiddleware } from "./middleware/notFound.middleware.js";
import apiRoutes from "./routes/index.js";
import authRoutes from "./routes/auth.routes.js";

export const createApp = async () => {
  const app = express();
  const { apiLimiter, authLimiter } = await createRateLimiters();

  app.set("trust proxy", env.TRUST_PROXY);

  app.use(helmet());
  app.use(compression());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.get("/health", (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Service is healthy.",
      timestamp: new Date().toISOString(),
    });
  });

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, { explorer: true }),
  );
  app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));

  app.use("/api/v1/auth", authLimiter, authRoutes);
  app.use("/api/v1", apiLimiter, apiRoutes);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};
