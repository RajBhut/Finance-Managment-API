import { ApiError } from "../utils/apiError.js";

export const notFoundMiddleware = (req, res, next) => {
  next(new ApiError(404, `Route ${req.originalUrl} not found`));
};