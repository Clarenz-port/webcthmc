const BillPayment = require("../models/billPayment");
const { logActivity } = require("../utils/activityLogger");
const { User } = require("../models");

exports.addBillPayment = async (req, res) => {
  try {
    const { memberId, billName, amount, date, paymentMethod } = req.body;

    const bill = await BillPayment.create({
      memberId,
      billName,
      amount: parseFloat(amount),
      date,
      paymentMethod: paymentMethod || "cash",
    });

    // Get user info for activity log
    let userName = "System";
    let userRole = req.user?.role || null;
    if (req.user?.id) {
      const user = await User.findByPk(req.user.id);
      if (user) {
        userName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
        userRole = user.role;
      }
    }

    await logActivity({
      userId: req.user?.id,
      role: userRole,
      action: "Recorded Bill Payment",
      details: { billId: bill.id, memberId: bill.memberId, amount: bill.amount, billName: bill.billName, userName, userRole },
      ip: req.ip,
    });

    return res.json({
      message: "Bill payment recorded",
      bill
    });

  } catch (err) {
    console.error("Error saving bill payment:", err);
    return res.status(500).json({ message: "Error saving bill payment" });
  }
};

exports.getMemberBills = async (req, res) => {
  try {
    const { memberId } = req.params;

    const bills = await BillPayment.findAll({
      where: { memberId },
      order: [["date", "DESC"]],
    });

    return res.json(bills);

  } catch (err) {
    console.error("Error fetching bills:", err);
    return res.status(500).json({ message: "Error fetching bills" });
  }
};
