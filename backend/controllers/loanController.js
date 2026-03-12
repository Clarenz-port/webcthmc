const PDFDocument = require('pdfkit');
const User = require("../models/users");
const { sendSMS } = require("../utils/sms");
// Generate PDF for loan application form
exports.generateLoanFormPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const loan = await Loan.findByPk(id);
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    // Create PDF
    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=loan_application_${id}.pdf`);
    doc.pipe(res);

    doc.fontSize(18).text('Loan Application Form', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Member Name: ${loan.memberName || ''}`);
    doc.text(`Address: ${loan.address || ''}`);
    doc.text(`Purpose: ${loan.purpose || ''}`);
    doc.text(`Loan Amount: ₱${loan.loanAmount}`);
    doc.text(`Duration: ${loan.duration} months`);
    doc.text(`Start Month: ${loan.startMonth || ''}`);
    doc.text(`End Month: ${loan.endMonth || ''}`);
    doc.text(`Service Charge: ₱${loan.serviceCharge}`);
    doc.text(`Filing Fee: ₱${loan.filingFee}`);
    doc.text(`Capital Build-Up: ₱${loan.capitalBuildUp}`);
    doc.text(`Net Amount: ₱${loan.netAmount}`);
    doc.moveDown();
    doc.text('Amortization Details:', { underline: true });
    doc.text(`Amortization (Monthly): ₱${loan.amortization}`);
    doc.text(`Interest: ₱${loan.interest}`);
    doc.moveDown();
    doc.text('Agreement:', { underline: true });
    doc.text('I hereby promise to pay Carmona Townhomes Homeowners Multi-purpose Cooperative the sum above for the specified term.');
    doc.end();
  } catch (err) {
    console.error('❌ Error generating loan form PDF:', err);
    res.status(500).json({ message: 'Error generating PDF' });
  }
};

exports.getTotalPaidAmortization = async (req, res) => {
  try {
    const { loanId } = req.params;
    const ApproveLoan = require('../models/approveloan');
    // Get all schedule rows for this loan
    const schedule = await ApproveLoan.findAll({
      where: { loanId, status: 'Paid' }
    });
    // Sum all paid amortization
    const totalPaid = schedule.reduce((sum, row) => sum + (parseFloat(row.amortization) || 0), 0);
    res.json({ totalPaid });
  } catch (err) {
    console.error('❌ Error fetching total paid amortization:', err);
    res.status(500).json({ message: 'Failed to fetch total paid amortization' });
  }
};
// Get amortization schedule for a loan from approve_loans
exports.getApproveLoanSchedule = async (req, res) => {
  try {
    const { loanId } = req.params;
    const ApproveLoan = require('../models/approveloan');
    const schedule = await ApproveLoan.getScheduleByLoanId(loanId);
    res.json(schedule);
  } catch (err) {
    console.error('❌ Error fetching approve_loan schedule:', err);
    res.status(500).json({ message: 'Failed to fetch amortization schedule' });
  }
};

// controllers/loanController.js
const Loan = require("../models/loans");
const ApproveLoan = require('../models/approveloan');
const { logActivity } = require("../utils/activityLogger");
const Payment = require("../models/loanpay"); // new
const { Op } = require("sequelize");
// ... other requires if any

// createLoan (existing) — set balance = loanAmount when creating

exports.addLoanPayment = async (req, res) => {
  try {
    // Extract relevant fields from request
    const { loanId, memberId, paymentNumber, status, paidDate, amount, dueDate } = req.body;

    // Update ApproveLoan schedule for this payment
    await ApproveLoan.update(
      { status, paidDate },
      { where: { loanId, month: paymentNumber } }
    );

    // Create payment record in loanpay table
    await Payment.create({
      loanId,
      memberId,
      amountPaid: amount,
      paymentDate: paidDate,
      dueDate,
      status,
    });

    // Increment paymentsMade in Loan model
    const loan = await Loan.findByPk(loanId);
    if (loan) {
      loan.paymentsMade = (loan.paymentsMade || 0) + 1;
      // If paymentsMade equals duration, set status to 'Paid'
      if (loan.paymentsMade >= loan.duration) {
        loan.status = 'Paid';
      }
      await loan.save();
    }

    res.json({ success: true, message: "Payment and schedule updated." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

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

    // Capital Build Up: Add to Shares if capitalBuildUp exists and > 0
    if (loan.capitalBuildUp && parseFloat(loan.capitalBuildUp) > 0) {
      try {
        const Shares = require('../models/shares');
        await Shares.create({
          userId: loan.userId,
          shareamount: loan.capitalBuildUp,
          date: new Date(),
          paymentMethod: 'Cash', // or set as needed
          note: 'capital build up',
          loanId: loan.id,
        });
      } catch (shareErr) {
        console.error('❌ Error adding capital build up to shares:', shareErr);
        // Optionally: return error or continue
      }
    }


    
    // Compute and save amortization schedule to ApproveLoan
    const ApproveLoan = require('../models/approveloan');
    // Remove previous schedule if exists (optional, for idempotency)
    await ApproveLoan.destroy({ where: { loanId: loan.id } });

    // Amortization calculation
    const principal = parseFloat(loan.loanAmount) || 0;
    const months = parseInt(loan.duration) || 0;
    const monthlyRate = 0.02; // 2% per month
    let remainingBalance = principal;
    const monthlyPrincipal = months > 0 ? principal / months : principal;
    let baseDate = loan.createdAt ? new Date(loan.createdAt) : new Date();
    if (Number.isNaN(baseDate.getTime())) baseDate = new Date();

    const scheduleRows = [];
    for (let i = 1; i <= Math.max(1, months); i++) {
      const interest = remainingBalance * monthlyRate;
      let amortization = monthlyPrincipal + interest;
      if (i === months) {
        amortization = remainingBalance + interest;
      }
      // Due date is every 1 month from baseDate
      const dueDate = new Date(baseDate.getTime());
      dueDate.setMonth(dueDate.getMonth() + i);
      scheduleRows.push({
        loanId: loan.id,
        month: i,
        interest: parseFloat(interest.toFixed(2)),
        balance: parseFloat(remainingBalance.toFixed(2)),
        amortization: parseFloat(amortization.toFixed(2)),
        dueDate: dueDate.toISOString(),
      });
      remainingBalance -= monthlyPrincipal;
    }
    if (scheduleRows.length > 0) {
      await ApproveLoan.bulkCreate(scheduleRows);
    }

    await logActivity({
        userId: req.user?.id,
        role: req.user?.role,
        action: "Approved Loan",
        details: { loanId: loan.id, memberId: loan.userId, checkNumber: loan.checkNumber },
        ip: req.ip,
    });

    // Fetch member info for notification
    let member = null;
    try {
      member = await User.findByPk(loan.userId);
    } catch (e) {
      console.warn("Could not fetch member for SMS/notification");
    }

    // Send SMS if member has phone number
    if (member && member.phoneNumber) {
      const msg = `Your loan application has been APPROVED. Please check your account for details.`;
      sendSMS([member.phoneNumber], msg);
    }

    // Create notification using Notice model
    try {
      const Notice = require('../models/Notice');
      if (member) {
        await Notice.create({
          title: "Loan Approved",
          message: `Congratulations! Your loan application for ₱${loan.loanAmount} has been approved.`,
          userId: member.id,
        });
      }
    } catch (notifErr) {
      console.warn("Notice creation failed (approveLoan):", notifErr.message);
    }

    console.log("Loan approved:", { id: loan.id, approvalDate, dueDate, approvedBy: req.user.id, checkNumber: loan.checkNumber });

    res.json({
      message: "Loan approved successfully",
      loan,
      amortizationSchedule: scheduleRows,
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

    // Fetch member info for notification
    let member = null;
    try {
      member = await User.findByPk(loan.userId);
    } catch (e) {
      console.warn("Could not fetch member for SMS notification");
    }

    // Send SMS if member has phone number
    if (member && member.phoneNumber) {
      const msg = `Your loan application has been REJECTED. Please contact the office for details.`;
      sendSMS([member.phoneNumber], msg);
    }

    // Create notification using Notice model
    try {
      const Notice = require('../models/Notice');
      if (member) {
        await Notice.create({
          title: "Loan Rejected",
          message: `We regret to inform you that your loan application for ₱${loan.loanAmount} was rejected.`,
          userId: member.id,
        });
      }
    } catch (notifErr) {
      console.warn("Notice creation failed (rejectLoan):", notifErr.message);
    }

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
    // Calculate due date for this payment based on createdAt and paymentsMade
    const paymentsCount = (loan.paymentsMade || 0) + 1;
    const createdAt = loan.createdAt ? new Date(loan.createdAt) : new Date();
    const nextDueDate = new Date(createdAt.getTime() + paymentsCount * 3 * 60 * 1000);
    const nextDueDate12 = new Date(createdAt.getTime() + paymentsCount * 3 * 60 * 1000);

    // Compute penalty and status
    let penalty = 0;
    let status = 'Paid';
    const paidDate = new Date(paymentDate);
    const dueDateForThis = new Date(nextDueDate12);
    // Add 3 minutes to dueDateForThis for grace period
    const graceDueDate = new Date(dueDateForThis.getTime() + 3 * 60 * 1000);
    if (paidDate > graceDueDate) {
      // Late payment after 3 minutes
      penalty = parseFloat((loan.loanball * 0.01).toFixed(2));
      status = 'Late';
      // Require paid amount to include penalty
      if (numericPaid < penalty + remainBefore) {
        return res.status(400).json({ message: `Late payment requires penalty. Total due: ₱${(penalty + remainBefore).toFixed(2)}` });
      }
    }

    const payment = await Payment.create({
      loanId,
      memberId,
      amountPaid: numericPaid,
      paymentDate,
      dueDate: nextDueDate12,
      penalty,
      status,
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
          [Op.in]: ["Paid", "Approved"]   // <-- show both!
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
