// backend/utils/activityLogger.js
const ActivityLog = require("../models/activityLog");

async function logActivity({ userId = null, role = null, action = "", details = null, ip = null }) {
  try {
    await ActivityLog.create({
      userId,
      userRole: role,
      action,
      details: typeof details === "string" ? details : JSON.stringify(details || {}),
      ip,
    });
  } catch (err) {
    console.error("Activity log error:", err);
  }
}

module.exports = { logActivity };