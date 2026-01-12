// controllers/noticeController.js
const Notice = require("../models/Notice");
const { logActivity } = require("../utils/activityLogger");

/**
 * ADMIN / SUPERADMIN
 * Create a notice
 */
exports.createNotice = async (req, res) => {
  try {
    const { title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        message: "Title and message are required",
      });
    }

    const notice = await Notice.create({
      title,
      message,
    });

     await logActivity({
      userId: req.user?.id,
      role: req.user?.role,
      action: "Created Notice",
      details: { noticeId: notice.id, title: notice.title },
      ip: req.ip,
    });

    res.status(201).json(notice);
  } catch (error) {
    console.error("Create notice error:", error);
    res.status(500).json({
      message: "Failed to create notice",
    });
  }
};

/**
 * MEMBERS
 * Get all notices (latest first)
 */
exports.getAllNotices = async (req, res) => {
  try {
    const notices = await Notice.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.json(notices);
  } catch (error) {
    console.error("Fetch notices error:", error);
    res.status(500).json({
      message: "Failed to fetch notices",
    });
  }
};

/**
 * ADMIN / SUPERADMIN
 * Delete a notice
 */
exports.deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;

    const notice = await Notice.findByPk(id);
    if (!notice) {
      return res.status(404).json({
        message: "Notice not found",
      });
    }

    await notice.destroy();

    await logActivity({
      userId: req.user?.id,
      role: req.user?.role,
      action: "Deleted Notice",
      details: { noticeId: id, title: notice.title },
      ip: req.ip,
    });

    res.json({ message: "Notice deleted successfully" });
  } catch (error) {
    console.error("Delete notice error:", error);
    res.status(500).json({
      message: "Failed to delete notice",
    });
  }
};

/**
 * ADMIN / SUPERADMIN
 * Update a notice
 */
exports.updateNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message } = req.body;

    const notice = await Notice.findByPk(id);
    if (!notice) {
      return res.status(404).json({
        message: "Notice not found",
      });
    }

    notice.title = title ?? notice.title;
    notice.message = message ?? notice.message;

    await notice.save();

    await logActivity({
      userId: req.user?.id,
      role: req.user?.role,
      action: "Updated Notice",
      details: { noticeId: notice.id, title: notice.title },
      ip: req.ip,
    });

    res.json(notice);
  } catch (error) {
    console.error("Update notice error:", error);
    res.status(500).json({
      message: "Failed to update notice",
    });
  }
};
