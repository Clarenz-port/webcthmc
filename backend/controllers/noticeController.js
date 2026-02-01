// controllers/noticeController.js
const Notice = require("../models/Notice");
const { logActivity } = require("../utils/activityLogger");
const User = require("../models/users"); // Add this
const { sendSMS } = require("../utils/sms"); // Add this

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

    // Send SMS to all members with phone numbers
    try {
      const users = await User.findAll({
        where: { 
          phoneNumber: { [require('sequelize').Op.ne]: null },
          role: 'member' // Only fetch members
        },
        attributes: ['phoneNumber'] // Only fetch phone numbers
      });
      const numbers = users.map(u => u.phoneNumber).filter(n => n && n.trim());
      if (numbers.length > 0) {
        const smsMessage = `CTHMC Notice: ${title}\n\n${message}`;
        await sendSMS(numbers, smsMessage);
      }
    } catch (smsErr) {
      console.error('SMS sending failed:', smsErr);
      // Don't fail the request if SMS fails
    }

    res.status(201).json(notice);
  } catch (error) {
    console.error("Create notice error:", error);
    res.status(500).json({
      message: "Failed to create notice",
    });
  }
};

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
