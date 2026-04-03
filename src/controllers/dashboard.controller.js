import { asyncHandler, sendSuccess } from "../utils/index.js";
import { buildDashboardSummary } from "../services/dashboard.service.js";

export const summaryController = asyncHandler(async (req, res) => {
  const summary = await buildDashboardSummary(req.query);
  return sendSuccess(
    res,
    200,
    "Dashboard summary fetched successfully.",
    summary,
  );
});
