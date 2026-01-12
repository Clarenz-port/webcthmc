// controllers/dividendController.js
const Dividend = require("../models/dividend");
const { logActivity } = require("../utils/activityLogger");

exports.createDividend = async (req, res) => {
  try {
    const { memberId, amount, date, note } = req.body;

    if (!memberId || amount == null) {
      return res.status(400).json({ message: "memberId and amount are required." });
    }

    const n = Number(amount);
    if (Number.isNaN(n) || n <= 0) {
      return res.status(400).json({ message: "amount must be a positive number." });
    }

    const newDividend = await Dividend.create({
      memberId,
      amount: n,
      date: date || new Date(),
      note: note || ""
    });

    await logActivity({
      userId: req.user?.id,
      role: req.user?.role,
      action: "Add Dividend",
      details: { dividendId: newDividend.id, memberId: newDividend.memberId, amount: newDividend.amount },
      ip: req.ip,
    });

    return res.status(201).json({ message: "Dividend added successfully.", dividend: newDividend });
  } catch (error) {
    console.error("createDividend error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getMemberDividends = async (req, res) => {
  try {
    const memberId = req.params.id;
    if (!memberId) return res.status(400).json({ message: "Missing member id." });

    const rows = await Dividend.findAll({
      where: { memberId },
      order: [["date", "DESC"]]
    });

    return res.status(200).json(rows);
  } catch (error) {
    console.error("getMemberDividends error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
