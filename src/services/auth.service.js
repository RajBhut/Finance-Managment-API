import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import { ROLES, USER_STATUSES } from "../utils/constants.js";
import { sanitizeUser } from "../middleware/auth.middleware.js";
import { createUserRecord, getUserCount } from "./user.service.js";
import { logAuditEvent } from "./audit.service.js";

const createTokenPair = (user) => {
  const tokenPayload = { sub: user.id };

  const accessToken = jwt.sign(tokenPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(tokenPayload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });

  const decodedRefreshToken = jwt.decode(refreshToken);

  return {
    accessToken,
    refreshToken,
    refreshTokenExpiresAt: new Date(decodedRefreshToken.exp * 1000),
  };
};

const persistRefreshToken = async (userId, refreshToken, expiresAt) => {
  await prisma.refreshToken.create({
    data: {
      userId,
      token: refreshToken,
      expiresAt,
    },
  });
};

const buildSession = async (user) => {
  const tokens = createTokenPair(user);
  await persistRefreshToken(
    user.id,
    tokens.refreshToken,
    tokens.refreshTokenExpiresAt,
  );

  return {
    user: sanitizeUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

export const registerUser = async ({ name, email, password }) => {
  const userCount = await getUserCount();
  const role = userCount === 0 ? ROLES.ADMIN : ROLES.VIEWER;

  const user = await createUserRecord({
    name,
    email,
    password,
    role,
    status: USER_STATUSES.ACTIVE,
  });

  const storedUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  const session = await buildSession(storedUser);

  await logAuditEvent({
    action: "REGISTER",
    entity: "User",
    entityId: user.id,
    userId: user.id,
    metadata: { role },
  });

  return session;
};

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  if (user.status !== USER_STATUSES.ACTIVE) {
    throw new ApiError(403, "This account is inactive.");
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const session = await buildSession(user);

  await logAuditEvent({
    action: "LOGIN",
    entity: "User",
    entityId: user.id,
    userId: user.id,
  });

  return session;
};

export const refreshSession = async ({ refreshToken }) => {
  if (!refreshToken) {
    throw new ApiError(400, "A refresh token is required.");
  }

  let payload;

  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token.");
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (
    !storedToken ||
    storedToken.user.status !== USER_STATUSES.ACTIVE ||
    storedToken.user.id !== payload.sub
  ) {
    throw new ApiError(401, "Refresh token is not valid anymore.");
  }

  await prisma.refreshToken.delete({ where: { token: refreshToken } });

  const session = await buildSession(storedToken.user);

  await logAuditEvent({
    action: "REFRESH",
    entity: "User",
    entityId: storedToken.user.id,
    userId: storedToken.user.id,
  });

  return session;
};

export const logoutSession = async ({ refreshToken, userId = null }) => {
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }

  if (userId) {
    await logAuditEvent({
      action: "LOGOUT",
      entity: "User",
      entityId: userId,
      userId,
    });
  }

  return { success: true };
};

export const getCurrentUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  return sanitizeUser(user);
};
