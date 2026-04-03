import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { RECORD_TYPES, ROLES } from "../utils/constants.js";
import {
  buildDateRange,
  normalizeSearch,
  parsePagination,
  parseSort,
} from "../utils/query.js";
import { findOrCreateCategory } from "./category.service.js";
import { logAuditEvent } from "./audit.service.js";

const formatRecord = (record) => ({
  id: record.id,
  amount: record.amount.toString(),
  type: record.type,
  note: record.note,
  date: record.date,
  isDeleted: record.isDeleted,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
  user: record.user
    ? {
        id: record.user.id,
        name: record.user.name,
        email: record.user.email,
        role: record.user.role,
        status: record.user.status,
      }
    : null,
  category: record.category
    ? {
        id: record.category.id,
        name: record.category.name,
        type: record.category.type,
      }
    : null,
});

const buildWhere = (query, actor) => {
  const filters = [];
  const search = normalizeSearch(query.search);

  if (!(query.includeDeleted === true && actor?.role === ROLES.ADMIN)) {
    filters.push({ isDeleted: false });
  }

  if (query.type && Object.values(RECORD_TYPES).includes(query.type)) {
    filters.push({ type: query.type });
  }

  if (query.userId) {
    filters.push({ userId: query.userId });
  }

  if (query.categoryId) {
    filters.push({ categoryId: query.categoryId });
  }

  if (query.dateFrom || query.dateTo) {
    const range = buildDateRange(query.dateFrom, query.dateTo);
    if (Object.keys(range).length > 0) {
      filters.push({ date: range });
    }
  }

  if (search) {
    filters.push({
      OR: [
        { note: { contains: search, mode: "insensitive" } },
        {
          category: { is: { name: { contains: search, mode: "insensitive" } } },
        },
        { user: { is: { name: { contains: search, mode: "insensitive" } } } },
        { user: { is: { email: { contains: search, mode: "insensitive" } } } },
      ],
    });
  }

  return { AND: filters };
};

const includeRecordRelations = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  },
  category: true,
};

const resolveCategory = async (payload, actor = null) => {
  if (payload.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: payload.categoryId },
    });

    if (!category) {
      throw new ApiError(400, "The selected category does not exist.");
    }

    if (category.type !== payload.type) {
      throw new ApiError(400, "Category type must match the record type.");
    }

    return category.id;
  }

  if (payload.categoryName) {
    const category = await findOrCreateCategory(
      {
        name: payload.categoryName,
        type: payload.type,
      },
      actor,
    );

    return category.id;
  }

  return null;
};

export const listRecords = async (query, actor) => {
  const { page, limit, skip } = parsePagination(query);
  const { sortBy, sortOrder } = parseSort(
    query,
    ["date", "createdAt", "amount", "updatedAt"],
    "date",
  );
  const where = buildWhere(query, actor);

  const [totalItems, records] = await Promise.all([
    prisma.record.count({ where }),
    prisma.record.findMany({
      where,
      include: includeRecordRelations,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
  ]);

  return {
    data: records.map(formatRecord),
    meta: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};

export const getRecordById = async (recordId, actor) => {
  const record = await prisma.record.findUnique({
    where: { id: recordId },
    include: includeRecordRelations,
  });

  if (!record || (record.isDeleted && actor?.role !== ROLES.ADMIN)) {
    throw new ApiError(404, "Record not found.");
  }

  return formatRecord(record);
};

export const createRecord = async (payload, actor) => {
  const userId = payload.userId ?? actor.id;
  const categoryId = await resolveCategory(payload, actor);

  const createdRecord = await prisma.record.create({
    data: {
      amount: payload.amount,
      type: payload.type,
      note: payload.note ?? null,
      date: new Date(payload.date),
      userId,
      categoryId,
    },
    include: includeRecordRelations,
  });

  await logAuditEvent({
    action: "CREATE",
    entity: "Record",
    entityId: createdRecord.id,
    userId: actor?.id ?? null,
    metadata: payload,
  });

  return formatRecord(createdRecord);
};

export const updateRecord = async (recordId, payload, actor) => {
  const existingRecord = await prisma.record.findUnique({
    where: { id: recordId },
  });

  if (!existingRecord) {
    throw new ApiError(404, "Record not found.");
  }

  const nextType = payload.type ?? existingRecord.type;
  const categoryId =
    payload.categoryId || payload.categoryName
      ? await resolveCategory(
          {
            type: nextType,
            categoryId: payload.categoryId,
            categoryName: payload.categoryName,
          },
          actor,
        )
      : existingRecord.categoryId;

  const updatedRecord = await prisma.record.update({
    where: { id: recordId },
    data: {
      ...(payload.amount !== undefined ? { amount: payload.amount } : {}),
      ...(payload.type ? { type: payload.type } : {}),
      ...(payload.note !== undefined ? { note: payload.note } : {}),
      ...(payload.date ? { date: new Date(payload.date) } : {}),
      ...(payload.userId ? { userId: payload.userId } : {}),
      ...(payload.categoryId || payload.categoryName ? { categoryId } : {}),
    },
    include: includeRecordRelations,
  });

  await logAuditEvent({
    action: "UPDATE",
    entity: "Record",
    entityId: updatedRecord.id,
    userId: actor?.id ?? null,
    metadata: payload,
  });

  return formatRecord(updatedRecord);
};

export const archiveRecord = async (recordId, actor) => {
  const existingRecord = await prisma.record.findUnique({
    where: { id: recordId },
  });

  if (!existingRecord) {
    throw new ApiError(404, "Record not found.");
  }

  const updatedRecord = await prisma.record.update({
    where: { id: recordId },
    data: { isDeleted: true },
    include: includeRecordRelations,
  });

  await logAuditEvent({
    action: "DELETE",
    entity: "Record",
    entityId: updatedRecord.id,
    userId: actor?.id ?? null,
    metadata: { isDeleted: true },
  });

  return formatRecord(updatedRecord);
};

export const restoreRecord = async (recordId, actor) => {
  const existingRecord = await prisma.record.findUnique({
    where: { id: recordId },
  });

  if (!existingRecord) {
    throw new ApiError(404, "Record not found.");
  }

  const updatedRecord = await prisma.record.update({
    where: { id: recordId },
    data: { isDeleted: false },
    include: includeRecordRelations,
  });

  await logAuditEvent({
    action: "RESTORE",
    entity: "Record",
    entityId: updatedRecord.id,
    userId: actor?.id ?? null,
    metadata: { isDeleted: false },
  });

  return formatRecord(updatedRecord);
};
