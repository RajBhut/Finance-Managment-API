import { PAGINATION_DEFAULTS } from "./constants.js";

export const parsePagination = (query = {}) => {
  const rawPage = Number.parseInt(
    query.page ?? `${PAGINATION_DEFAULTS.PAGE}`,
    10,
  );
  const rawLimit = Number.parseInt(
    query.limit ?? `${PAGINATION_DEFAULTS.LIMIT}`,
    10,
  );

  const page =
    Number.isFinite(rawPage) && rawPage > 0
      ? rawPage
      : PAGINATION_DEFAULTS.PAGE;
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, PAGINATION_DEFAULTS.MAX_LIMIT)
      : PAGINATION_DEFAULTS.LIMIT;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

export const buildDateRange = (dateFrom, dateTo) => {
  if (!dateFrom && !dateTo) {
    return {};
  }

  const range = {};

  if (dateFrom) {
    range.gte = new Date(dateFrom);
  }

  if (dateTo) {
    const parsedDateTo = new Date(dateTo);
    parsedDateTo.setHours(23, 59, 59, 999);
    range.lte = parsedDateTo;
  }

  return range;
};

export const normalizeSearch = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

export const parseSort = (
  query = {},
  allowedFields = ["createdAt"],
  fallbackField = "createdAt",
) => {
  const sortBy = allowedFields.includes(query.sortBy)
    ? query.sortBy
    : fallbackField;
  const sortOrder =
    `${query.sortOrder}`.toLowerCase() === "asc" ? "asc" : "desc";

  return { sortBy, sortOrder };
};
