import { asyncHandler, successResponse } from "../../Utils/Response.js";
import * as db from "../../database/dbService.js";
import { redis } from "../../Utils/Redis/Connection.js";
import { APPLICATION_OPEN_CACHE_KEY } from "../../Utils/ApplicationAvailability.js";
import { getIO } from "../../Utils/Socket/index.js";

/**
 * Reads settings from database
 */
export const getSettingsData = async () => {
  try {
    const setting = await db.findFirst({ model: "Setting" });
    if (setting) {
      return {
        ...setting,
        paidSessionCount: setting.paidSessionCount ?? 3,
        studentCanJoin: setting.studentCanJoin ?? false,
        applicationOpen: setting.applicationOpen ?? true,
      };
    }
    return {
      paidSessionCount: 3,
      studentCanJoin: false,
      applicationOpen: true,
    };
  } catch (error) {
    console.error("Error reading settings from DB:", error);
    return {
      paidSessionCount: 3,
      studentCanJoin: false,
      applicationOpen: true,
    };
  }
};

/**
 * Writes settings to database
 * @param {Record<string, any>} data
 * @returns {Promise<void>}
 */
export const saveSettingsData = async (data) => {  
  const existing = await db.findFirst({ model: "Setting" });
  if (existing) {
    return await db.updateOne({
      model: "Setting",
      where: { id: existing.id },
      data: { ...data },
    });
  } else {
    return await db.create({
      model: "Setting",
      data: { ...data },
    });
  }
};

export const getSettings = asyncHandler(async (req, res, next) => {
  const settings = await getSettingsData();
  return successResponse({
    res,
    req,
    status: 200,
    data: settings,
    message: "FETCH_SUCCESS",
  });
});

export const updateSettings = asyncHandler(async (req, res, next) => {
  const { paidSessionCount, studentCanJoin } = req.body;

  const updatePayload = {};
  if (paidSessionCount !== undefined) updatePayload.paidSessionCount = parseInt(paidSessionCount);
  if (studentCanJoin !== undefined) updatePayload.studentCanJoin = studentCanJoin;

  await saveSettingsData(updatePayload);

  const updatedSettings = await getSettingsData();

  return successResponse({
    res,
    req,
    status: 200,
    data: updatedSettings,
    message: "UPDATE_SUCCESS",
  });
});

export const updateApplicationStatus = asyncHandler(async (req, res, next) => {
  const { applicationOpen } = req.body;
  const setting = await saveSettingsData({ applicationOpen });

  try {
    await redis.set(APPLICATION_OPEN_CACHE_KEY, String(setting.applicationOpen), {
      EX: 5,
    });
  } catch (error) {
    console.error("Application availability cache update failed:", error.message);
  }

  if (!setting.applicationOpen) {
    getIO()?.disconnectSockets(true);
  }

  return successResponse({
    res,
    req,
    status: 200,
    data: { applicationOpen: setting.applicationOpen },
    message: "UPDATE_SUCCESS",
  });
});
