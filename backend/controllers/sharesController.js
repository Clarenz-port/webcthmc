// controllers/sharesController.js
const Shares = require("../models/shares");
const { logActivity } = require("../utils/activityLogger");
const sequelize = require("../config/database"); // your sequelize instance
const { fn, col, literal, QueryTypes } = require("sequelize");

exports.addShares = async (req, res) => {
  try {
    const { userId, shareamount, date, paymentMethod, type } = req.body;
    if (!userId || !shareamount) return res.status(400).json({ message: "Missing required fields" });

    const newShare = await Shares.create({
      userId,
      shareamount,
      date: date ? new Date(date) : new Date(),
      paymentMethod: ["GCash", "Cash"].includes(paymentMethod) ? paymentMethod : "Cash",
      type: ["contribution", "savings"].includes(type) ? type : "contribution", // default to contribution
    });

    await logActivity({
      userId: req.user?.id,
      role: req.user?.role,
      action: `Add ${type === 'savings' ? 'Savings' : 'Contribution'}`,
      details: { shareId: newShare.id, memberId: newShare.userId, amount: newShare.shareamount, type: newShare.type },
      ip: req.ip,
    });

    // --- SOCKET.IO EMIT ---
    // Emit event so all dashboards update instantly
    const io = req.app.get('io');
    if (io) {
      io.emit('shares-updated', { memberId: userId });
    }
    return res.status(201).json({ message: `${type === 'savings' ? 'Savings' : 'Contribution'} added successfully`, share: newShare });
  } catch (err) {
    console.error("❌ Error adding shares:", err);
    return res.status(500).json({ message: "Server error adding shares", error: err.message });
  }
};

exports.getMemberShares = async (req, res) => {
  try {
    const userId = req.params.id;
    const shares = await Shares.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      raw: true,
    });
    return res.json(shares);
  } catch (err) {
    console.error("❌ Error fetching shares:", err);
    return res.status(500).json({ message: "Error fetching shares", error: err.message });
  }
};

// Get member contributions only (can be used for loan eligibility)
exports.getMemberContributions = async (req, res) => {
  try {
    const userId = req.params.id;
    const contributions = await Shares.findAll({
      where: { 
        userId,
        type: 'contribution'
      },
      order: [["createdAt", "DESC"]],
      raw: true,
    });
    
    const total = contributions.reduce((sum, c) => sum + (parseFloat(c.shareamount) || 0), 0);
    
    return res.json({ contributions, total });
  } catch (err) {
    console.error("❌ Error fetching contributions:", err);
    return res.status(500).json({ message: "Error fetching contributions", error: err.message });
  }
};

// Get member savings only (cannot be used for loans)
exports.getMemberSavings = async (req, res) => {
  try {
    const userId = req.params.id;
    const savings = await Shares.findAll({
      where: { 
        userId,
        type: 'savings'
      },
      order: [["createdAt", "DESC"]],
      raw: true,
    });
    
    const total = savings.reduce((sum, s) => sum + (parseFloat(s.shareamount) || 0), 0);
    
    return res.json({ savings, total });
  } catch (err) {
    console.error("❌ Error fetching savings:", err);
    return res.status(500).json({ message: "Error fetching savings", error: err.message });
  }
};
exports.getSharesByYear = async (req, res) => {
  try {
    const requestedYear = Number(req.params.year) || new Date().getFullYear();
    console.log(`[sharesController] getSharesByYear: year=${requestedYear}`);

    const dialect = sequelize.getDialect();
    let sql;
    if (dialect === "mysql" || dialect === "mariadb") {
      sql = `
        SELECT MONTH(date) as month, SUM(shareamount) as total
        FROM \`Shares\`
        WHERE YEAR(date) = :year
        GROUP BY MONTH(date)
        ORDER BY MONTH(date)
      `;
    } else if (dialect === "postgres") {
      sql = `
        SELECT EXTRACT(MONTH FROM date)::int as month, SUM(shareamount)::numeric as total
        FROM "Shares"
        WHERE EXTRACT(YEAR FROM date)::int = :year
        GROUP BY month
        ORDER BY month
      `;
    } else {
      // generic fallback
      sql = `
        SELECT EXTRACT(MONTH FROM date)::int as month, SUM(shareamount) as total
        FROM "Shares"
        WHERE EXTRACT(YEAR FROM date)::int = :year
        GROUP BY month
        ORDER BY month
      `;
    }

    // <-- IMPORTANT FIX: do NOT destructure; get the whole result array
    const resultRows = await sequelize.query(sql, {
      replacements: { year: requestedYear },
      type: QueryTypes.SELECT, // use imported QueryTypes
    });

    const monthly = Array(12).fill(0);
    if (Array.isArray(resultRows)) {
      resultRows.forEach((r) => {
        const m = Number(r.month);
        const t = Number(r.total) || 0;
        if (m >= 1 && m <= 12) monthly[m - 1] = Math.round(t);
      });
    }

    console.log("[sharesController] resultRows:", resultRows);
    return res.json({ rows: resultRows, monthly });
  } catch (err) {
    console.error("❌ Error fetching shares by year:", err);
    return res.status(500).json({ message: "Error fetching shares summary", error: err.message });
  }
};