// backend/controllers/activityController.js
const ActivityLog = require("../models/activityLog");
const { User } = require("../models");
const { Op } = require("sequelize");

exports.getLogs = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Number(req.query.limit) || 50);
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.role) where.userRole = req.query.role;
    if (req.query.action) where.action = { [Op.like]: `%${req.query.action}%` };
    if (req.query.startDate) where.createdAt = { ...(where.createdAt || {}), [Op.gte]: new Date(req.query.startDate) };
    if (req.query.endDate) where.createdAt = { ...(where.createdAt || {}), [Op.lt]: new Date(req.query.endDate) };

    const result = await ActivityLog.findAndCountAll({
      where,
      include: [{ model: User, attributes: ["firstName", "lastName", "username", "email"] }],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.json({
      rows: result.rows,
      count: result.count,
      page,
      limit,
    });
  } catch (err) {
    console.error("Fetch activity logs error:", err);
    res.status(500).json({ message: "Failed to fetch activity logs" });
  }
};