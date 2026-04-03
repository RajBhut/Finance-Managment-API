import { env } from "../config/env.js";
import { asyncHandler, sendSuccess } from "../utils/index.js";
import {
  registerUser,
  loginUser,
  refreshSession,
  logoutSession,
  getCurrentUserProfile,
} from "../services/auth.service.js";

const setRefreshCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/api/v1/auth",
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie("refreshToken", {
    path: "/api/v1/auth",
  });
};

export const register = asyncHandler(async (req, res) => {
  const session = await registerUser(req.body);
  setRefreshCookie(res, session.refreshToken);

  return sendSuccess(res, 201, "User registered successfully.", session);
});

export const login = asyncHandler(async (req, res) => {
  const session = await loginUser(req.body);
  setRefreshCookie(res, session.refreshToken);

  return sendSuccess(res, 200, "Login successful.", session);
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.body.refreshToken ?? req.cookies?.refreshToken;
  const session = await refreshSession({ refreshToken });
  setRefreshCookie(res, session.refreshToken);

  return sendSuccess(res, 200, "Token refreshed successfully.", session);
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.body.refreshToken ?? req.cookies?.refreshToken;

  await logoutSession({
    refreshToken,
    userId: req.user?.id ?? null,
  });

  clearRefreshCookie(res);

  return sendSuccess(res, 200, "Logged out successfully.");
});

export const me = asyncHandler(async (req, res) => {
  const user = await getCurrentUserProfile(req.user.id);
  return sendSuccess(res, 200, "Current user fetched successfully.", user);
});
