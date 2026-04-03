import { asyncHandler, sendSuccess } from "../utils/index.js";
import {
  archiveRecord,
  createRecord,
  getRecordById,
  listRecords,
  restoreRecord,
  updateRecord,
} from "../services/record.service.js";

export const createRecordController = asyncHandler(async (req, res) => {
  const record = await createRecord(req.body, req.user);
  return sendSuccess(res, 201, "Record created successfully.", record);
});

export const listRecordController = asyncHandler(async (req, res) => {
  const result = await listRecords(req.query, req.user);
  return sendSuccess(
    res,
    200,
    "Records fetched successfully.",
    result.data,
    result.meta,
  );
});

export const getRecordController = asyncHandler(async (req, res) => {
  const record = await getRecordById(req.params.id, req.user);
  return sendSuccess(res, 200, "Record fetched successfully.", record);
});

export const updateRecordController = asyncHandler(async (req, res) => {
  const record = await updateRecord(req.params.id, req.body, req.user);
  return sendSuccess(res, 200, "Record updated successfully.", record);
});

export const deleteRecordController = asyncHandler(async (req, res) => {
  const record = await archiveRecord(req.params.id, req.user);
  return sendSuccess(res, 200, "Record archived successfully.", record);
});

export const restoreRecordController = asyncHandler(async (req, res) => {
  const record = await restoreRecord(req.params.id, req.user);
  return sendSuccess(res, 200, "Record restored successfully.", record);
});
