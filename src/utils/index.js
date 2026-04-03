export const asyncHandler = (fn) => {
  return function asyncHandlerWrapper(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export { ApiError } from "./apiError.js";
export { sendSuccess } from "./apiResponse.js";
export { RECORD_TYPES, ROLES, USER_STATUSES } from "./constants.js";
export {
  buildDateRange,
  normalizeSearch,
  parsePagination,
  parseSort,
} from "./query.js";
