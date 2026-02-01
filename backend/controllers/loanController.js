
// controllers/loanController.js
const Loan = require("../models/loans");
const { logActivity } = require("../utils/activityLogger");
const Payment = require("../models/loanpay"); // new
const { Op } = require("sequelize");
// ... other requires if any

// createLoan (existing) — set balance = loanAmount when creating



exports.createLoan = async (req, res) => {
  try {
    const userId = req.user.id; // extracted from JWT
    const {
      memberName,
      address,
      purpose,
      loanAmount,
      duration,
      startMonth,
      endMonth,
      amortization,
      interest,
      serviceCharge,
      filingFee,
      capitalBuildUp,
      netAmount,
    } = req.body;

    if (
      !memberName ||
      !address ||
      !purpose ||
      !loanAmount ||
      !duration ||
      !startMonth ||
      !endMonth
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const numericLoanAmount = parseFloat(loanAmount);
    const numericInterest = parseFloat(interest) || 0;
    const totalBalance = numericLoanAmount + numericInterest;
    const monthlyRate = 0.02;
    const inter = numericLoanAmount * monthlyRate;
    const monthlyinter = numericLoanAmount + inter;
    const totalBalance1 = monthlyinter;

    const newLoan = await Loan.create({
      memberName,
      address,
      purpose,
      loanAmount: numericLoanAmount,
      duration,
      startMonth,
      endMonth,
      amortization,
      interest: numericInterest,
      serviceCharge,
      filingFee,
      capitalBuildUp,
      netAmount,
      
      balance: totalBalance, // ✅ loanAmount + interest
      remainbalance: totalBalance1,
      status: "Pending",
      userId,
    });

    res.status(201).json({
      message: "Loan application submitted successfully",
      loan: newLoan,
    });
  } catch (error) {
    console.error("❌ Error creating loan:", error);
    res.status(500).json({ message: "Error creating loan" });
  }
};

// existing getMemberLoans (keeps same)
exports.getMemberLoans = async (req, res) => {
  try {
    const userId = req.user.id;
    const loans = await Loan.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    res.json(loans);
  } catch (error) {
    console.error("❌ Error fetching member loans:", error);
    res.status(500).json({ message: "Error fetching member loans" });
  }
};

// existing getPendingLoans (keeps same)
exports.getPendingLoans = async (req, res) => {
  try {
    const pendingLoans = await Loan.findAll({
      where: { status: "Pending" },
      order: [["createdAt", "DESC"]],
    });

    res.json(pendingLoans);
  } catch (error) {
    console.error("❌ Error fetching pending loans:", error);
    res.status(500).json({ message: "Error fetching pending loans" });
  }
};

exports.approveLoan = async (req, res) => {
  try {
    // Defense in depth: ensure only superadmin from verified token can approve
    if (!req.user || String(req.user.role).toLowerCase() !== "superadmin") {
      return res.status(403).json({ message: "Access denied: only superadmin can approve loans" });
    }

    const { id } = req.params;
    const { checkNumber } = req.body;

    // require checkNumber
    if (!checkNumber || String(checkNumber).trim() === "") {
      return res.status(400).json({ message: "checkNumber is required to approve loan" });
    }

    const loan = await Loan.findByPk(id);

    if (!loan) return res.status(404).json({ message: "Loan not found" });

    // Recalculate balance on approval
    const numericLoanAmount = parseFloat(loan.loanAmount) || 0;
    const numericInterest = parseFloat(loan.interest) || 0;
    loan.balance = numericLoanAmount + numericInterest;

    // Set approval date (now)
    const approvalDate = new Date();

    // Compute due date based on createdAt if available, otherwise use approvalDate
    let baseCreated = loan.createdAt ? new Date(loan.createdAt) : approvalDate;
    if (Number.isNaN(baseCreated.getTime())) baseCreated = approvalDate;

    const dueDate = new Date(baseCreated.getTime());
    dueDate.setMonth(dueDate.getMonth() + 1);

    // store who approved (optional)
    if (req.user.id) loan.approvedBy = req.user.id;

    // save check number
    loan.checkNumber = String(checkNumber).trim();

    loan.approvalDate = approvalDate;
    loan.dueDate = dueDate;
    loan.status = "Approved";

    await loan.save();

    await logActivity({
        userId: req.user?.id,
        role: req.user?.role,
        action: "Approved Loan",
        details: { loanId: loan.id, memberId: loan.userId, checkNumber: loan.checkNumber },
        ip: req.ip,
    });

    console.log("Loan approved:", { id: loan.id, approvalDate, dueDate, approvedBy: req.user.id, checkNumber: loan.checkNumber });

    res.json({
      message: "Loan approved successfully",
      loan,
    });
  } catch (error) {
    console.error("❌ Error approving loan:", error);
    res.status(500).json({ message: "Error approving loan" });
  }
};
exports.rejectLoan = async (req, res) => {
  try {
    // Defense in depth
    if (!req.user || String(req.user.role).toLowerCase() !== "superadmin") {
      return res.status(403).json({ message: "Access denied: only superadmin can reject loans" });
    }

    const { id } = req.params;
    const loan = await Loan.findByPk(id);

    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    // Optional: store who rejected
    if (req.user.id) loan.rejectedBy = req.user.id; // adjust to your model fields if present

    loan.status = "Rejected";
    await loan.save();

    await logActivity({
      userId: req.user?.id,
      role: req.user?.role,
      action: "Rejected Loan",
      details: { loanId: loan.id, memberId: loan.userId },
      ip: req.ip,
    });

    res.json({ message: "Loan rejected successfully", loan });
  } catch (error) {
    console.error("❌ Error rejecting loan:", error);
    res.status(500).json({ message: "Error rejecting loan" });
  }
};
exports.getLoanByMemberId = async (req, res) => {
  try {
    const memberId = parseInt(req.params.id, 10);

    const loans = await Loan.findAll({
      where: { userId: memberId, status: { [Op.in]: ["Approved", "Paid"] } },
      order: [["createdAt", "DESC"]],
    });

    res.json({ loans });
  } catch (err) {
    console.error("❌ Error fetching member loans:", err);
    res.status(500).json({ message: "Error fetching member loans" });
  }
};
exports.recordPayment = async (req, res) => {
  try {
    const { memberId, loanId, amountPaid, paymentDate } = req.body;

    if (!memberId || !loanId || !amountPaid || !paymentDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const loan = await Loan.findByPk(loanId);
    if (!loan) return res.status(404).json({ message: "Loan not found" });

    const monthlyRate = 0.02;
    const remainBefore = parseFloat(loan.remainbalance) || 0;
    let remain = remainBefore;
    const numericPaid = parseFloat(amountPaid);

    if (numericPaid <= 0) {
      return res.status(400).json({ message: "Payment must be greater than zero" });
    }

    if (numericPaid > remain) {
      return res.status(400).json({ message: "Payment exceeds remaining balance" });
    }

    // Deduct payment
    remain -= numericPaid;

    // Apply monthly interest if still unpaid
    if (remain > 0) {
      const interest = remain * monthlyRate;
      remain += interest;
    }

    // 
    let baseDate;
    if (loan.dueDate) {
      baseDate = new Date(loan.dueDate);
    } else if (loan.createdAt) {
      baseDate = new Date(loan.createdAt);
    } else {
      baseDate = new Date();
    }
    if (Number.isNaN(baseDate.getTime())) baseDate = new Date();

    const nextDueDate = new Date(baseDate.getTime());
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);

    let baseDate1;
    if (loan.dueDate) {
      baseDate1 = new Date(loan.dueDate);
    } else if (loan.createdAt) {
      baseDate1 = new Date(loan.createdAt);
    } else {
      baseDate1 = new Date();
    }
    if (Number.isNaN(baseDate1.getTime())) baseDate1 = new Date();

    const nextDueDate12 = new Date(baseDate1.getTime());
    nextDueDate12.setMonth(nextDueDate12.getMonth());

    const payment = await Payment.create({
      loanId,
      memberId,
      amountPaid: numericPaid,
      paymentDate,
      dueDate: nextDueDate12,
    });

    // Update the loan record
    loan.paymentsMade = (loan.paymentsMade || 0) + 1;
    loan.remainbalance = remain.toFixed(2);
    loan.loanball = Math.max(remainBefore - numericPaid, 0).toFixed(2);
    loan.dueDate = nextDueDate;

    // Auto mark as fully paid
    if (remain <= 0.009) {
      loan.remainbalance = 0;
      loan.status = "Paid";
    }

    await loan.save();

    await logActivity({
      userId: req.user?.id,
      role: req.user?.role,
      action: "Paid Loan",
      details: { loanId, paymentId: payment.id, amount: numericPaid, memberId },
      ip: req.ip,
    });

    console.log("Payment recorded:", {
      loanId,
      paymentId: payment.id,
      nextDueDate,
      remain: loan.remainbalance,
    });

    return res.status(200).json({
      message:
        loan.status === "Paid"
          ? "🎉 Loan fully paid and marked as Paid!"
          : `✅ Payment recorded! Next due date: ${nextDueDate.toLocaleDateString("en-PH")}`,
      loan,
      payment,
    });
  } catch (err) {
    console.error("❌ Error recording payment:", err);
    return res.status(500).json({ message: "Error recording payment" });
  }
};

exports.getLoanPayments = async (req, res) => {
  try {
    const loanId = parseInt(req.params.loanId, 10);

    const payments = await Payment.findAll({
      where: { loanId },
      order: [["paymentDate", "ASC"]],
    });

    res.json(payments);
  } catch (err) {
    console.error("❌ Error fetching payments:", err);
    res.status(500).json({ message: "Error fetching payments" });
  }
};
// ✅ Count how many loans a member has that are Approved or Paid
exports.countMemberLoans = async (req, res) => {
  try {
    const memberId = parseInt(req.params.id, 10);

    const totalLoans = await Loan.count({
      where: {
        userId: memberId,
        status: { [Op.in]: ["Approved", "Paid"] }, // only count approved or paid
      },
    });

    res.json({ totalLoans });
  } catch (error) {
    console.error("❌ Error counting member loans:", error);
    res.status(500).json({ message: "Error counting member loans" });
  }
};
exports.getLoanCounts = async (req, res) => {
  try {
    // count pending
    const pending = await Loan.count({
      where: { status: "Pending" },
    });

    // count approved OR paid (adjust strings if your DB uses other labels)
    const approvedOrPaid = await Loan.count({
      where: {
        status: { [Op.in]: ["Approved"] },
      },
    });

    // total loans
    const total = await Loan.count();

    return res.json({ pending, approvedOrPaid, total });
  } catch (err) {
    console.error("❌ Error getting loan counts:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getApprovedLoans = async (req, res) => {
  try {
    const approvedOrPaid = await Loan.findAll({
      where: {
        status: {
          [Op.in]: ["Approved", "Paid"]   // <-- show both!
        }
      },
      order: [["createdAt", "DESC"]],
    });

    return res.json(approvedOrPaid);
  } catch (err) {
    console.error("❌ Error getting approved loans:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
