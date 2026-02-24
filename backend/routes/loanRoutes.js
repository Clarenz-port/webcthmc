// routes/loanRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
const {
  createLoan,
  getMemberLoans,
  getPendingLoans,
  approveLoan,
  rejectLoan,
  getLoanByMemberId,
  recordPayment,
  getLoanPayments,
  countMemberLoans,
  getLoanCounts,
  getApprovedLoans,
  getApproveLoanSchedule,
  addLoanPayment,
} = require("../controllers/loanController");
// Amortization schedule for a loan (ApproveLoan model)
router.get("/:loanId/amortization", verifyToken, getApproveLoanSchedule);
router.post('/loanpayment/add', verifyToken, addLoanPayment);

// Member routes
router.post("/apply", verifyToken, createLoan);
router.get("/members", verifyToken, getMemberLoans);

// Fetch an active loan by member id (used by PaidLoanPopup)
router.get("/member/:id", verifyToken, getLoanByMemberId);

// Payment endpoint
router.post("/payment", verifyToken, recordPayment);

// Admin routes
// protect pending loans: admins and superadmins can view
router.get("/pending-loans", verifyToken, allowRoles("admin", "superadmin"), getPendingLoans);

// Approve/Reject: only superadmin
router.post("/loan/:id/approve", verifyToken, allowRoles("superadmin"), approveLoan);
router.post("/loan/:id/reject", verifyToken, allowRoles("superadmin"), rejectLoan);

// Payments & helpers (already protected)
router.get("/:loanId/payments", verifyToken, getLoanPayments);
router.get("/member/:id/loan-count", verifyToken, countMemberLoans);

router.get("/loan-counts", verifyToken, allowRoles("admin", "superadmin"), getLoanCounts);

router.get("/approved-loans", verifyToken, allowRoles("admin", "superadmin"), getApprovedLoans);

// PDF download for loan application form
const { generateLoanFormPDF } = require('../controllers/loanController');
router.get('/loan/:id/form', verifyToken, generateLoanFormPDF);

module.exports = router;
