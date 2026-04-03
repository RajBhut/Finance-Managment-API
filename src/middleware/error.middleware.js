import { ApiError } from "../utils/apiError.js";
import { env } from "../config/env.js";

const formatPrismaError = (error) => {
  if (error?.code === "P2002") {
    return new ApiError(409, "A record with the same unique value already exists.");
  }

  if (error?.code === "P2025") {
    return new ApiError(404, "The requested resource was not found.");
  }

  return null;
};

export const notFoundMiddleware = (req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
};

export const errorMiddleware = (error, req, res, next) => {
  const normalizedError = error instanceof ApiError ? error : formatPrismaError(error) ?? error;
  const statusCode = normalizedError?.statusCode ?? normalizedError?.status ?? 500;

  if (statusCode >= 500) {
    console.error(normalizedError);
  }

  return res.status(statusCode).json({
    success: false,
    message: normalizedError?.message ?? "Internal server error",
    ...(normalizedError?.details ? { details: normalizedError.details } : {}),
    ...(env.NODE_ENV === "development" && statusCode >= 500
      ? { stack: normalizedError?.stack }
      : {}),
  });
};