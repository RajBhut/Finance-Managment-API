import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { normalizeSearch, parsePagination, parseSort } from "../utils/query.js";
import { logAuditEvent } from "./audit.service.js";

const sanitizeCategory = (category) => ({
  id: category.id,
  name: category.name,
  type: category.type,
  createdAt: category.createdAt,
});

export const findOrCreateCategory = async ({ name, type }, actor = null) => {
  const normalizedName = name.trim();

  const category = await prisma.category.upsert({
    where: {
      name_type: {
        name: normalizedName,
        type,
      },
    },
    update: {},
    create: {
      name: normalizedName,
      type,
    },
  });

  await logAuditEvent({
    action: "UPSERT",
    entity: "Category",
    entityId: category.id,
    userId: actor?.id ?? null,
    metadata: { name: normalizedName, type },
  });

  return category;
};

export const listCategories = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const { sortBy, sortOrder } = parseSort(
    query,
    ["createdAt", "name"],
    "createdAt",
  );
  const search = normalizeSearch(query.search);

  const where = {};

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  if (query.type) {
    where.type = query.type;
  }

  const [totalItems, categories] = await Promise.all([
    prisma.category.count({ where }),
    prisma.category.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
  ]);

  return {
    data: categories.map(sanitizeCategory),
    meta: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};

export const createCategory = async (payload, actor = null) => {
  const category = await prisma.category.create({
    data: {
      name: payload.name.trim(),
      type: payload.type,
    },
  });

  await logAuditEvent({
    action: "CREATE",
    entity: "Category",
    entityId: category.id,
    userId: actor?.id ?? null,
    metadata: payload,
  });

  return sanitizeCategory(category);
};

export const updateCategory = async (categoryId, payload, actor = null) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new ApiError(404, "Category not found.");
  }

  const updatedCategory = await prisma.category.update({
    where: { id: categoryId },
    data: {
      ...(payload.name ? { name: payload.name.trim() } : {}),
      ...(payload.type ? { type: payload.type } : {}),
    },
  });

  await logAuditEvent({
    action: "UPDATE",
    entity: "Category",
    entityId: updatedCategory.id,
    userId: actor?.id ?? null,
    metadata: payload,
  });

  return sanitizeCategory(updatedCategory);
};

export const deleteCategory = async (categoryId, actor = null) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new ApiError(404, "Category not found.");
  }

  await prisma.category.delete({ where: { id: categoryId } });

  await logAuditEvent({
    action: "DELETE",
    entity: "Category",
    entityId: categoryId,
    userId: actor?.id ?? null,
    metadata: { name: category.name, type: category.type },
  });

  return sanitizeCategory(category);
};
