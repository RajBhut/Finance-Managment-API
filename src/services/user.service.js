import bcrypt from "bcrypt";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/apiError.js";
import { ROLES, USER_STATUSES } from "../utils/constants.js";
import { normalizeSearch, parsePagination, parseSort } from "../utils/query.js";
import { logAuditEvent } from "./audit.service.js";

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const getUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

export const createUserRecord = async (
  { name, email, password, role = ROLES.VIEWER, status = USER_STATUSES.ACTIVE },
  actor = null,
) => {
  const normalizedEmail = email.toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new ApiError(409, "A user with this email already exists.");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const createdUser = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      status,
    },
    select: getUserSelect,
  });

  await logAuditEvent({
    action: "CREATE",
    entity: "User",
    entityId: createdUser.id,
    userId: actor?.id ?? createdUser.id,
    metadata: { role: createdUser.role, status: createdUser.status },
  });

  return sanitizeUser(createdUser);
};

export const listUsers = async (query) => {
  const { page, limit, skip } = parsePagination(query);
  const { sortBy, sortOrder } = parseSort(
    query,
    ["createdAt", "updatedAt", "name", "email"],
    "createdAt",
  );
  const search = normalizeSearch(query.search);

  const where = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (query.role && Object.values(ROLES).includes(query.role)) {
    where.role = query.role;
  }

  if (query.status && Object.values(USER_STATUSES).includes(query.status)) {
    where.status = query.status;
  }

  const [totalItems, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: getUserSelect,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
  ]);

  return {
    data: users.map(sanitizeUser),
    meta: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};

export const updateUser = async (userId, payload, actor = null) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const nextPassword = payload.password
    ? await bcrypt.hash(payload.password, 12)
    : undefined;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(payload.name ? { name: payload.name } : {}),
      ...(payload.email ? { email: payload.email.toLowerCase() } : {}),
      ...(payload.role ? { role: payload.role } : {}),
      ...(payload.status ? { status: payload.status } : {}),
      ...(nextPassword ? { password: nextPassword } : {}),
    },
    select: getUserSelect,
  });

  await logAuditEvent({
    action: "UPDATE",
    entity: "User",
    entityId: updatedUser.id,
    userId: actor?.id ?? updatedUser.id,
    metadata: payload,
  });

  return sanitizeUser(updatedUser);
};

export const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: getUserSelect,
  });

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  return sanitizeUser(user);
};

export const getUserCount = async () => prisma.user.count();
