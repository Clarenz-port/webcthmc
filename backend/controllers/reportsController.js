const Payment = require("../models/loanpay");
const Dividend = require("../models/dividend");
const { logActivity } = require("../utils/activityLogger");
const { Op } = require("sequelize");

const PDFDocument = require("pdfkit");
const { User, Loan, Shares, Purchase, Bill } = require("../models");

function getTextHeight(doc, text, width) {
  return doc.heightOfString(text, {
    width,
    align: "left",
  });
}



function formatPurchaseItems(items) {
  try {
    // If items is a JSON string, parse it
    if (typeof items === "string") {
      items = JSON.parse(items);
    }

    // If array of objects
    if (Array.isArray(items)) {
      return items
        .map(i => {
          const name = i.name || "item";
          const qty = i.qty || i.quantity || 1;
          return `${name} x${qty}`;
        })
        .join(", ");
    }

    // Fallback
    return String(items || "-");
  } catch (err) {
    return "-";
  }
}

exports.generateReport = async (req, res) => {
  try {
    const { reportType, mode, period = "all", year = new Date().getFullYear(), month } = req.body;

    await logActivity({
    userId: req.user?.id,
    role: req.user?.role,
    action: "Generate Report",
    details: { reportType, mode, period, year, month },
    ip: req.ip,
  });

    const doc = new PDFDocument({ margin: 20, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=report.pdf");
    doc.pipe(res);

    doc.fontSize(18).text("COOPERATIVE REPORT", { align: "center" });
    doc.moveDown();
    
function getDateRange(period, year, month) {
  if (!period || period === "all") return null;
  const y = Number(year);
  if (period === "yearly") {
    const start = new Date(y, 0, 1);
    const end = new Date(y + 1, 0, 1);
    return { start, end };
  }
  if (period === "monthly") {
    const m = Number(month) - 1;
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 1);
    return { start, end };
  }
  return null;
}

const range = getDateRange(period, year, month);
const dateWhere = range ? { createdAt: { [Op.gte]: range.start, [Op.lt]: range.end } } : {};
const approvalDateWhere = range ? { approvalDate: { [Op.gte]: range.start, [Op.lt]: range.end } } : {}
if (mode === "summary") {

  /* =====================================================
     LOAN SUMMARY
  ===================================================== */
  if (reportType === "loans") {

  doc.fontSize(10).text("LOAN SUMMARY REPORT");
  doc.moveDown(1.5);

  const startY = doc.y;
  const rowHeight = 22;

  const col = {
    member: 20,
    count: 190,
    paid: 280,
    amount: 370,
    penalty: 490,
  };

  /* ===== HEADER ===== */
  doc.font("Helvetica-Bold").fontSize(11);
  doc.text("Member", col.member, startY, { width: 140 });
  doc.text("Loan Count", col.count, startY, { width: 70, align: "center", lineBreak: false });
  doc.text("Paid Loans", col.paid, startY, { width: 60, align: "center", lineBreak: false });
  doc.text("Total Amount", col.amount, startY, { width: 100});
  doc.text("Total Penalty", col.penalty, startY, { width: 90});

  doc.moveTo(20, startY + 15).lineTo(570, startY + 15).stroke();

  /* ===== ROWS ===== */
  let y = startY + rowHeight;
  doc.font("Helvetica").fontSize(11);

  const members = await User.findAll();

  for (const m of members) {
    const loans = await Loan.findAll({
  where: { userId: m.id, ...dateWhere },
  order: [["createdAt", "ASC"]],
});

    if (loans.length === 0) continue;

    const loanCount = loans.length;

    // ✅ COUNT PAID LOANS
    const paidLoanCount = loans.filter(
      (l) => String(l.status).toLowerCase() === "paid"
    ).length;

    const totalAmount = loans.reduce(
      (sum, l) => sum + Number(l.loanAmount || l.amount || 0),
      0
    );

    const totalPenalty = loans.reduce(
      (sum, l) => sum + Number(l.penalty || 0),
      0
    );

    doc.text(`${m.firstName} ${m.lastName}`, col.member, y, { width: 140 });
    doc.text(String(loanCount), col.count, y, { width: 60, align: "center" });
    doc.text(String(paidLoanCount), col.paid, y, { width: 60, align: "center" });

    doc.text(
      totalAmount.toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
      }),
      col.amount,
      y,
      { width: 100}
    );

    doc.text(
      totalPenalty.toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
      }),
      col.penalty,
      y,
      { width: 90}
    );

    y += rowHeight;

    if (y > doc.page.height - 60) {
      doc.addPage();
      y = 60;
    }
  }
}

/* =====================================================
   PURCHASE SUMMARY
===================================================== */
if (reportType === "purchases") {

  doc.fontSize(10).text("PURCHASE SUMMARY REPORT");
  doc.moveDown(1.5);

  const startY = doc.y;
  const rowHeight = 22;

  const col = {
    member: 20,
    count: 220,
    total: 350,
    paid: 430,
    interest: 520,
  };

  doc.font("Helvetica-Bold").fontSize(11);
  doc.text("Member", col.member, startY, { width: 130 });
  doc.text("Purchase Count", col.count, startY, { width: 90});
  doc.text("Total Amount", col.total, startY, { width: 80, lineBreak: false });
  doc.text("Paid", col.paid, startY, { width: 60, align: "center", lineBreak: false });
  doc.text("Interest", col.interest, startY, { width: 70, lineBreak: false });

  doc.moveTo(20, startY + 15).lineTo(580, startY + 15).stroke();

  let y = startY + rowHeight;
  doc.font("Helvetica").fontSize(11);

  const members = await User.findAll();

  for (const m of members) {
    const purchases = await Purchase.findAll({
  where: { userId: m.id, ...dateWhere },
  order: [["createdAt", "ASC"]],
});

    if (purchases.length === 0) continue;

    const purchaseCount = purchases.length;

    const totalAmount = purchases.reduce(
      (sum, p) => sum + Number(p.subtotal || 0),
      0
    );

    const paidCount = purchases.filter(
      (p) => String(p.status).toLowerCase() === "paid"
    ).length;

    const totalInterest = purchases.reduce(
      (sum, p) => sum + Number(p.surcharge || 0),
      0
    );

    doc.text(`${m.firstName} ${m.lastName}`, col.member, y, { width: 130 });
    doc.text(String(purchaseCount), col.count, y, { width: 70});

    doc.text(
      totalAmount.toLocaleString("en-PH", { style: "currency", currency: "PHP" }),
      col.total,
      y,
      { width: 80 }
    );

    doc.text(String(paidCount), col.paid, y, { width: 60, align: "center" });

    doc.text(
      totalInterest.toLocaleString("en-PH", { style: "currency", currency: "PHP" }),
      col.interest,
      y,
      { width: 70 }
    );

    y += rowHeight;
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = 60;
    }
  }
}
/* =====================================================
   BILLS SUMMARY
===================================================== */
if (reportType === "bills") {

  doc.fontSize(10).text("BILLS SUMMARY REPORT");
  doc.moveDown(1.5);

  const startY = doc.y;
  const rowHeight = 22;

  const col = {
    member: 20,
    count: 250,
    total: 440,
  };

  doc.font("Helvetica-Bold").fontSize(11);
  doc.text("Member", col.member, startY, { width: 160 });
  doc.text("Bill Count", col.count, startY, { width: 90, align: "center" });
  doc.text("Total Bills", col.total, startY, { width: 110 });

  doc.moveTo(20, startY + 15).lineTo(570, startY + 15).stroke();

  let y = startY + rowHeight;
  doc.font("Helvetica").fontSize(11);

  const members = await User.findAll();

  for (const m of members) {
   const bills = await Bill.findAll({
  where: { memberId: m.id, ...dateWhere },
  order: [["createdAt", "ASC"]],
});

    if (bills.length === 0) continue;

    const billCount = bills.length;
    const totalBills = bills.reduce(
      (sum, b) => sum + Number(b.amount || 0),
      0
    );

    doc.text(`${m.firstName} ${m.lastName}`, col.member, y, { width: 160 });
    doc.text(String(billCount), col.count, y, { width: 90, align: "center" });

    doc.text(
      totalBills.toLocaleString("en-PH", { style: "currency", currency: "PHP" }),
      col.total,
      y,
      { width: 110 }
    );

    y += rowHeight;
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = 60;
    }
  }
}

  /* =====================================================
     SHARES SUMMARY
  ===================================================== */
  if (reportType === "shares") {

    doc.fontSize(10).text("SHARES SUMMARY REPORT");
    doc.moveDown(1.5);

    const startY = doc.y;
    const rowHeight = 22;

    const col = {
      member: 20,
      count: 240,
      total: 460,
    };

    doc.font("Helvetica-Bold").fontSize(11);
    doc.text("Member", col.member, startY, { width: 160 });
    doc.text("Shares Count", col.count, startY, { width: 90, align: "center" });
    doc.text("Total Shares", col.total, startY, { width: 110 });

    doc.moveTo(20, startY + 15).lineTo(570, startY + 15).stroke();

    let y = startY + rowHeight;
    doc.font("Helvetica").fontSize(11);

    const members = await User.findAll();

    for (const m of members) {
      const shares = await Shares.findAll({
  where: { userId: m.id, ...dateWhere },
  order: [["createdAt", "ASC"]],
});

      if (shares.length === 0) continue;

      const shareCount = shares.length;
      const totalShares = shares.reduce(
        (sum, s) => sum + Number(s.shareamount || 0),
        0
      );

      const dateText = shares[0]?.createdAt
        ? new Date(shares[0].createdAt).toLocaleDateString("en-PH")
        : "-";

      doc.text(`${m.firstName} ${m.lastName}`, col.member, y, { width: 160 });
      doc.text(String(shareCount), col.count, y, { width: 90, align: "center" });
      doc.text(
        totalShares.toLocaleString("en-PH", {
          style: "currency",
          currency: "PHP",
        }),
        col.total,
        y,
        { width: 110 }
      );

      y += rowHeight;
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = 60;
      }
    }
  }
}

if (reportType === "income") {
  doc.fontSize(10).text("INCOME STATEMENT (SUMMARY)");
  doc.moveDown(1);

  // Revenues
  const salesRevenue = Number((await Purchase.sum("total", { where: { status: "paid", ...dateWhere } })) || 0);
  const purchaseInterest = Number((await Purchase.sum("surcharge", { where: { status: "paid", ...dateWhere } })) || 0);
  const capitalBuildUp = Number((await Shares.sum("shareamount", { where: { ...dateWhere } })) || 0);

  // Sum paid loans' interest & fees
  const allLoans = await Loan.findAll({ where: { ...dateWhere } });
  const paidLoans = allLoans.filter(l => String(l.status || "").toLowerCase() === "paid");
  const loanInterest = paidLoans.reduce((s, l) => s + Number(l.interest || 0), 0);
  const serviceCharges = paidLoans.reduce((s, l) => s + Number(l.serviceCharge || 0), 0);
  const filingFees = paidLoans.reduce((s, l) => s + Number(l.filingFee || 0), 0);

  const totalRevenue = salesRevenue + purchaseInterest + loanInterest + serviceCharges + filingFees + capitalBuildUp;

  // Expenses (removed Bills Paid per request)
  const dividendsPaid = Number((await Dividend.sum("amount", { where: { ...dateWhere } })) || 0);
  const totalExpenses = dividendsPaid;

  // Formatting helpers
  const fmt = (v) => Number(v || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" });
  const fmtNet = (v) => v < 0 ? `(${Number(Math.abs(v)).toLocaleString("en-PH", { style: "currency", currency: "PHP" })})` : fmt(v);

  // Layout coords
  const leftX = 20;
  const amtX = 440;
  const amtX1 = 450;
  const amtWidth = 120;
  const rowHeight = 18;
  let y = doc.y;

  // REVENUES
  doc.font("Helvetica-Bold").fontSize(11).text("REVENUES", leftX, y);
  y += rowHeight;
  doc.font("Helvetica").fontSize(10);
  doc.text("Sales Revenue", leftX, y, { width: amtX - leftX - 10 });
  doc.text(fmt(salesRevenue), amtX, y, { width: amtWidth, align: "right" });
  y += rowHeight;

  doc.text("Purchase Interest", leftX, y, { width: amtX - leftX - 10 });
  doc.text(fmt(purchaseInterest), amtX, y, { width: amtWidth, align: "right" });
  y += rowHeight;

  doc.text("Loan Interest", leftX, y, { width: amtX - leftX - 10 });
  doc.text(fmt(loanInterest), amtX, y, { width: amtWidth, align: "right" });
  y += rowHeight;

  doc.text("Service Charges", leftX, y, { width: amtX - leftX - 10 });
  doc.text(fmt(serviceCharges), amtX, y, { width: amtWidth, align: "right" });
  y += rowHeight;

  doc.text("Filing Fees", leftX, y, { width: amtX - leftX - 10 });
  doc.text(fmt(filingFees), amtX, y, { width: amtWidth, align: "right" });
  y += rowHeight;

  doc.text("Capital Build-up", leftX, y, { width: amtX - leftX - 10 });
  doc.text(fmt(capitalBuildUp), amtX, y, { width: amtWidth, align: "right" });
  y += rowHeight;

  doc.moveTo(leftX, y - 6).lineTo(amtX1 + amtWidth, y - 6).stroke();
  y += 6;
  doc.font("Helvetica-Bold").fontSize(12).text("TOTAL REVENUES", leftX, y, { width: amtX - leftX - 10 });
  doc.text(fmt(totalRevenue), amtX, y, { width: amtWidth, align: "right" });
  y += rowHeight + 8;

  // EXPENSES
  doc.font("Helvetica-Bold").fontSize(11).text("EXPENSES", leftX, y);
  y += rowHeight;
  doc.font("Helvetica").fontSize(10);
  doc.text("Dividends Paid", leftX, y, { width: amtX - leftX - 10 });
  doc.text(fmt(dividendsPaid), amtX, y, { width: amtWidth, align: "right" });
  y += rowHeight;

  doc.moveTo(leftX, y - 6).lineTo(amtX1 + amtWidth, y - 6).stroke();
  y += 6;
  doc.font("Helvetica-Bold").fontSize(12).text("TOTAL EXPENSES", leftX, y, { width: amtX - leftX - 10 });
  doc.text(fmt(totalExpenses), amtX, y, { width: amtWidth, align: "right" });
  y += rowHeight + 8;

  // NET INCOME (LOSS)
  // NET INCOME (LOSS) / NET INCOME
  const netIncome = totalRevenue - totalExpenses;
  const isLoss = netIncome < 0;
  const label = isLoss ? "NET INCOME (LOSS)" : "NET INCOME";
  const display = isLoss ? fmtNet(netIncome) : fmt(netIncome);

  doc.font("Helvetica-Bold").fontSize(12).text(label, leftX, y, { width: amtX - leftX - 10 });
  doc.text(display, amtX, y, { width: amtWidth, align: "right" });

  doc.moveDown(1);
}

  /* =====================================================
     BALANCE SHEET SUMMARY
  ===================================================== */
  if (reportType === "balance") {
  doc.fontSize(10).text("BALANCE SHEET (SUMMARY)");
  doc.moveDown(1);

  const totalShares = Number((await Shares.sum("shareamount", { where: { ...dateWhere } })) || 0);
  const approvedLoans = await Loan.findAll({ where: { status: "Approved", ...dateWhere } });
  // for each loan: payments within the period
  let totalLoansReceivable = 0;
  for (const loan of approvedLoans) {
    const balance = Number(loan.balance || 0);
    const paid = Number((await Payment.sum("amountPaid", { where: { loanId: loan.id, ...dateWhere } })) || 0);
    const outstanding = Math.max(balance - paid, 0);
    totalLoansReceivable += Math.max(balance - paid, 0);
  }

  const totalPurchasesReceivable = Number((await Purchase.sum("total", { where: { status: "not paid", ...dateWhere } })) || 0);
  const cashFromPaidPurchases = Number((await Purchase.sum("total", { where: { status: "paid", ...dateWhere } })) || 0);
  const totalCash = cashFromPaidPurchases; // approximation

  // Force liabilities to zero per request
  const totalLiabilities = 0;

  const totalAssets = totalCash + totalLoansReceivable + totalPurchasesReceivable;
  const retainedEarnings = totalAssets - totalLiabilities - totalShares;
  const totalEquity = totalShares + retainedEarnings;

  // Small helper for consistent currency formatting
  const fmt = (v) => Number(v || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" });

  // Layout coordinates
  const leftX = 20;
  const amtX = 437;
  const amtX1 = 450;
  const amtWidth = 120;
  const lineHeight = 18;
  let y = doc.y;

  // ASSETS
  doc.font("Helvetica-Bold").fontSize(11).text("ASSETS", leftX, y);
  y += lineHeight;
  doc.font("Helvetica").fontSize(10);
  doc.text("Cash", leftX, y, { width: amtX - leftX - 10 });
  doc.text(fmt(totalCash), amtX, y, { width: amtWidth, align: "right" });
  y += lineHeight;
  doc.text("Loans Receivable", leftX, y, { width: amtX - leftX - 10 });
  doc.text(fmt(totalLoansReceivable), amtX, y, { width: amtWidth, align: "right" });
  y += lineHeight;
  doc.text("Accounts Receivable", leftX, y, { width: amtX - leftX - 10 });
  doc.text(fmt(totalPurchasesReceivable), amtX, y, { width: amtWidth, align: "right" });
  y += lineHeight;

  // separator + total assets
  doc.moveTo(leftX, y - 6).lineTo(amtX1 + amtWidth, y - 6).stroke();
  y += 6;
  doc.font("Helvetica-Bold").fontSize(12).text("TOTAL ASSETS", leftX, y, { width: amtX - leftX - 10 });
  doc.text(fmt(totalAssets), amtX, y, { width: amtWidth, align: "right" });
  y += lineHeight + 6;

  // LIABILITIES
  doc.font("Helvetica-Bold").fontSize(11).text("LIABILITIES", leftX, y);
  y += lineHeight;
  doc.font("Helvetica").fontSize(10);
  doc.text("Total Liabilities", leftX, y, { width: amtX - leftX - 10 });
  doc.text(fmt(totalLiabilities), amtX, y, { width: amtWidth, align: "right" });
  y += lineHeight;

  // separator + total liabilities
  doc.moveTo(leftX, y - 6).lineTo(amtX1 + amtWidth, y - 6).stroke();
  y += 6;
  doc.font("Helvetica-Bold").fontSize(12).text("TOTAL LIABILITIES", leftX, y, { width: amtX - leftX - 10 });
  doc.text(fmt(totalLiabilities), amtX, y, { width: amtWidth, align: "right" });
  y += lineHeight + 6;

  // EQUITY
  doc.font("Helvetica-Bold").fontSize(11).text("EQUITY", leftX, y);
  y += lineHeight;
  doc.font("Helvetica").fontSize(10);
  doc.text("Share Capital", leftX, y, { width: amtX - leftX - 10 });
  doc.text(fmt(totalShares), amtX, y, { width: amtWidth, align: "right" });
  y += lineHeight;
  doc.text("Retained Earnings", leftX, y, { width: amtX - leftX - 10 });
  doc.text(fmt(retainedEarnings), amtX, y, { width: amtWidth, align: "right" });
  y += lineHeight;

  // separator + total equity
  doc.moveTo(leftX, y - 6).lineTo(amtX1 + amtWidth, y - 6).stroke();
  y += 6;
  doc.font("Helvetica-Bold").fontSize(12).text("TOTAL EQUITY", leftX, y, { width: amtX - leftX - 10 });
  doc.text(fmt(totalEquity), amtX, y, { width: amtWidth, align: "right" });
  y += lineHeight + 8;

  // FINAL TOTALS
  doc.font("Helvetica-Bold").fontSize(12).text("TOTAL LIABILITIES & EQUITY", leftX, y, { width: amtX - leftX - 10 });
  doc.text(fmt(totalLiabilities + totalEquity), amtX, y, { width: amtWidth, align: "right" });

  // Move cursor down to keep spacing consistent for next sections
  doc.moveDown(1);
}

  if (reportType === "cashflow") {
  doc.fontSize(10).text("CASH FLOW (SUMMARY)");
  doc.moveDown(1);

  // compute values
  const salesCash = Number((await Purchase.sum("total", { where: { status: "paid", ...dateWhere } })) || 0);
  const loanPayments = Number((await Payment.sum("amountPaid", { where: { ...dateWhere } })) || 0);
  const sharesCash = Number((await Shares.sum("shareamount", { where: { ...dateWhere } })) || 0);

  const totalInflows = salesCash + loanPayments + sharesCash;

  const allLoans = await Loan.findAll();
  const loanDisbursements = (await Loan.findAll({ where: { ...approvalDateWhere, approvalDate: approvalDateWhere ? approvalDateWhere.approvalDate : undefined } }))
  .filter(l => l.approvalDate)
  .reduce((s, l) => s + Number(l.loanAmount || 0), 0);
  const dividendsCash = Number((await Dividend.sum("amount")) || 0);
  const billsCash = Number((await Bill.sum("amount")) || 0);
  const totalOutflows = loanDisbursements + dividendsCash + billsCash;

  // layout settings
  const leftX = 20;
  const rightX = 440;
  const rightX1 = 450;
  const rightWidth = 120;
  const rowHeight = 18;

  const formatCurrency = (v) => Number(v || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" });
  const formatNetVal = (v) => v < 0 ? `(${Number(Math.abs(v)).toLocaleString("en-PH", { style: "currency", currency: "PHP" })})` : formatCurrency(v);

  let y = doc.y;

  // CASH INFLOWS
  doc.font("Helvetica-Bold").fontSize(11).text("CASH INFLOWS", leftX, y);
  y += rowHeight;

  doc.font("Helvetica").fontSize(10);
  doc.text("Sales (Paid Purchases)", leftX, y, { width: rightX - leftX - 10 });
  doc.text(formatCurrency(salesCash), rightX, y, { width: rightWidth, align: "right" });
  y += rowHeight;

  doc.text("Loan Payments Received", leftX, y, { width: rightX - leftX - 10 });
  doc.text(formatCurrency(loanPayments), rightX, y, { width: rightWidth, align: "right" });
  y += rowHeight;

  doc.text("Share Capital Contributions", leftX, y, { width: rightX - leftX - 10 });
  doc.text(formatCurrency(sharesCash), rightX, y, { width: rightWidth, align: "right" });
  y += rowHeight;

  // separator + total inflows
  doc.moveTo(leftX, y - 6).lineTo(rightX1 + rightWidth, y - 6).stroke();
  y += 6;

  doc.font("Helvetica-Bold").fontSize(11);
  doc.text("TOTAL CASH INFLOWS", leftX, y, { width: rightX - leftX - 10 });
  doc.text(formatCurrency(totalInflows), rightX, y, { width: rightWidth, align: "right" });
  y += rowHeight + 6;

  // CASH OUTFLOWS
  doc.font("Helvetica-Bold").fontSize(11).text("CASH OUTFLOWS", leftX, y);
  y += rowHeight;

  doc.font("Helvetica").fontSize(10);
  doc.text("Loan Disbursements", leftX, y, { width: rightX - leftX - 10 });
  doc.text(formatCurrency(loanDisbursements), rightX, y, { width: rightWidth, align: "right" });
  y += rowHeight;

  doc.text("Dividends Paid", leftX, y, { width: rightX - leftX - 10 });
  doc.text(formatCurrency(dividendsCash), rightX, y, { width: rightWidth, align: "right" });
  y += rowHeight;

  doc.text("Bills Paid", leftX, y, { width: rightX - leftX - 10 });
  doc.text(formatCurrency(billsCash), rightX, y, { width: rightWidth, align: "right" });
  y += rowHeight;

  // separator + total outflows
  doc.moveTo(leftX, y - 6).lineTo(rightX1 + rightWidth, y - 6).stroke();
  y += 6;

  doc.font("Helvetica-Bold").fontSize(11);
  doc.text("TOTAL CASH OUTFLOWS", leftX, y, { width: rightX - leftX - 10 });
  doc.text(formatCurrency(totalOutflows), rightX, y, { width: rightWidth, align: "right" });
  y += rowHeight + 6;

  // NET CASH FLOW
  const net = totalInflows - totalOutflows;
  doc.font("Helvetica-Bold").fontSize(12);
  doc.text("NET CASH FLOW", leftX, y, { width: rightX - leftX - 10 });
  doc.text(formatNetVal(net), rightX, y, { width: rightWidth, align: "right" });

  doc.moveDown(1);
}

    /* ================= DETAILED MODE ================= */
    if (mode === "detailed") {

      /* -------- LOANS -------- */
      if (reportType === "loans" || reportType === "all") {

  doc.fontSize(14).text("LOANS").moveDown(1);

  const startY = doc.y;
  const rowHeight = 20;

  const col = {
    date: 20,
    member: 80,
    amount: 190,
    duration: 270,
    net: 350,
    paid: 420,
    status: 470,
    check: 530,
  };

  /* ===== HEADER ===== */
  doc.font("Helvetica-Bold").fontSize(10);

  doc.text("Date", col.date, startY, { width: 55, lineBreak: false });
  doc.text("Member", col.member, startY, { width: 120, lineBreak: false });
  doc.text("Loan Amount", col.amount, startY, { width: 70});
  doc.text("Duration", col.duration, startY, { width: 55, align: "center", lineBreak: false });
  doc.text("Net Amount", col.net, startY, { width: 70});
  doc.text("Paid", col.paid, startY, { width: 55});
  doc.text("Status", col.status, startY, { width: 50, align: "center", lineBreak: false });
  doc.text("Check #", col.check, startY, { width: 60, lineBreak: false });

  doc.moveTo(20, startY + 14).lineTo(585, startY + 14).stroke();

  /* ===== ROWS ===== */
  let y = startY + rowHeight;
  doc.font("Helvetica").fontSize(9);

  const loans = await Loan.findAll({
    where: { ...dateWhere },
    include: [{ model: User, attributes: ["firstName", "lastName"] }],
    order: [["createdAt", "ASC"]],
  });

  for (const l of loans) {

    const dateText = l.createdAt
      ? new Date(l.createdAt).toLocaleDateString("en-PH")
      : "-";

    const name = `${l.User?.firstName || ""} ${l.User?.lastName || ""}`.trim();

    const loanAmount = Number(l.loanAmount || l.amount || 0);
    const netAmount = Number(l.netAmount || loanAmount);
    const paymentMade = Number(l.paymentMade || l.amountPaid || 0);

    doc.text(dateText, col.date, y, { width: 55 });
    doc.text(name, col.member, y, { width: 120 });

    doc.text(
      loanAmount.toLocaleString("en-PH", { style: "currency", currency: "PHP" }),
      col.amount,
      y,
      { width: 70}
    );

    doc.text(
      String(l.duration || l.months || "-"),
      col.duration,
      y,
      { width: 55, align: "center" }
    );

    doc.text(
      netAmount.toLocaleString("en-PH", { style: "currency", currency: "PHP" }),
      col.net,
      y,
      { width: 70}
    );

    doc.text(
      paymentMade.toLocaleString("en-PH", { style: "currency", currency: "PHP" }),
      col.paid,
      y,
      { width: 55}
    );

    doc.text(String(l.status || "-"), col.status, y, {
      width: 50,
      align: "center",
    });

    doc.text(String(l.checkNumber || "-"), col.check, y, { width: 60 });

    y += rowHeight;

    /* ===== PAGE BREAK ===== */
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = 60;
    }
  }

  doc.moveDown(1.5);
}
/* -------- SHARES -------- */
if (reportType === "shares" || reportType === "all") {

  doc.fontSize(14).text("SHARES", { align: "left" }).moveDown(1);

  const startY = doc.y;
  const rowHeight = 20;

  const col = {
    date: 20,
    member: 110,
    amount: 280,
    method: 450,
  };

  /* ===== HEADER ===== */
  doc.font("Helvetica-Bold").fontSize(10);

  doc.text("Date", col.date, startY, { width: 60, lineBreak: false });
  doc.text("Member", col.member, startY, { width: 180, lineBreak: false });
  doc.text("Share Amount", col.amount, startY, { width: 90 });
  doc.text("Payment Method", col.method, startY, { width: 100, align: "center", lineBreak: false });

  doc.moveTo(20, startY + 14).lineTo(570, startY + 14).stroke();

  /* ===== ROWS ===== */
  let y = startY + rowHeight;
  doc.font("Helvetica").fontSize(9);

  const shares = await Shares.findAll({
    where: { ...dateWhere },
    include: [{ model: User, attributes: ["firstName", "middleName", "lastName"] }],
    order: [["createdAt", "ASC"]],
  });

  for (const s of shares) {

    const dateText = s.createdAt
      ? new Date(s.createdAt).toLocaleDateString("en-PH")
      : "-";

    const name = `${s.User?.firstName || ""} ${s.User?.middleName || ""} ${s.User?.lastName || ""}`.trim();

    doc.text(dateText, col.date, y, { width: 60 });

    doc.text(name, col.member, y, { width: 180 });

    doc.text(
      Number(s.shareamount || 0).toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
      }),
      col.amount,
      y,
      { width: 90}
    );

    doc.text(
      String(s.paymentMethod || "-"),
      col.method,
      y,
      { width: 100, align: "center" }
    );

    y += rowHeight;

    /* ===== PAGE BREAK ===== */
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = 60;
    }
  }

  doc.moveDown(1.5);
}
/* -------- PURCHASES -------- */
if (reportType === "purchases" || reportType === "all") {

  doc.fontSize(14).text("PURCHASES").moveDown(1);

  const startY = doc.y;
  const rowHeight = 20;

  const col = {
    date: 20,
    member: 80,
    items: 200,
    total: 330,
    interest: 400,
    due: 470,
    status: 540,
  };

  /* ===== HEADER ===== */
  doc.font("Helvetica-Bold").fontSize(10);

  doc.text("Date", col.date, startY, { width: 55, lineBreak: false });
  doc.text("Member", col.member, startY, { width: 110, lineBreak: false });
  doc.text("Items", col.items, startY, { width: 110, lineBreak: false });
  doc.text("Total", col.total, startY, { width: 65, align: "right", lineBreak: false });
  doc.text("Interest", col.interest, startY, { width: 65, align: "right", lineBreak: false });
  doc.text("Due Date", col.due, startY, { width: 65, align: "center", lineBreak: false });
  doc.text("Status", col.status, startY, { width: 45, align: "center", lineBreak: false });

  doc.moveTo(20, startY + 14).lineTo(585, startY + 14).stroke();

  /* ===== ROWS ===== */
  let y = startY + rowHeight;
  doc.font("Helvetica").fontSize(9);

  const purchases = await Purchase.findAll({
    where: { ...dateWhere },
    include: [{ model: User, attributes: ["firstName", "lastName"] }],
    order: [["createdAt", "ASC"]],
  });

  for (const p of purchases) {

    const dateText = p.createdAt
      ? new Date(p.createdAt).toLocaleDateString("en-PH")
      : "-";

    const name = `${p.User?.firstName || ""} ${p.User?.lastName || ""}`.trim();

    // 🔹 Items (supports string / array / fallback)
   const itemsText = formatPurchaseItems(p.items || p.itemName);


    const totalAmount = Number(p.amount || p.total || 0);
    const interestAmount = Number(p.interest || 0);

    const dueDateText = p.due_date || p.dueDate
      ? new Date(p.due_date || p.dueDate).toLocaleDateString("en-PH")
      : "-";

    doc.text(dateText, col.date, y, { width: 55 });
    doc.text(name, col.member, y, { width: 110 });

    doc.text(itemsText, col.items, y, {
      width: 140,
      ellipsis: true, // prevents long text breaking layout
    });

    doc.text(
      totalAmount.toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
      }),
      col.total,
      y,
      { width: 65, align: "right" }
    );

    doc.text(
      interestAmount.toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
      }),
      col.interest,
      y,
      { width: 65}
    );

    doc.text(dueDateText, col.due, y, { width: 65, align: "center" });

    doc.text(String(p.status || "-"), col.status, y, {
      width: 45,
      align: "center",
    });

    y += rowHeight;

    /* ===== PAGE BREAK ===== */
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = 60;
    }
  }

  doc.moveDown(1.5);
}

if (reportType === "ledger") {

  doc.fontSize(14).text("GENERAL LEDGER (Per Account)", { align: "left" }).moveDown(0.5);

  // Collect minimal, well-typed ledger transactions
  async function collectLedgerTransactions() {
    const txs = [];
    const push = (date, account, desc, debit = 0, credit = 0) =>
      txs.push({
        date: date ? new Date(date) : null,
        account,
        desc,
        debit: Number(debit || 0),
        credit: Number(credit || 0),
      });

    // Shares (contribution)
    const sharesAll = await Shares.findAll({ order: [["createdAt", "ASC"]] });
    for (const s of sharesAll) {
      const date = s.createdAt || s.date;
      const amt = Number(s.shareamount || 0);
      if (!amt) continue;
      push(date, "Cash", `Share contribution (user ${s.userId || "-"})`, amt, 0);
      push(date, "Share Capital", `Share contribution (user ${s.userId || "-"})`, 0, amt);
    }

    // Purchases (sales & surcharge)
    const purchasesAll = await Purchase.findAll({ order: [["createdAt", "ASC"]] });
    for (const p of purchasesAll) {
      const date = p.createdAt || p.date;
      const sales = Number(p.subtotal || 0);
      const surcharge = Number(p.surcharge || 0);
      const total = Number(p.total || sales + surcharge);
      const cashOrAR = String(p.status || "paid").toLowerCase() === "paid" ? "Cash" : "Accounts Receivable";
      if (total) push(date, cashOrAR, `Sale - ${p.memberName || p.userId || ""}`, total, 0);
      if (sales) push(date, "Sales Revenue", `Sale - ${p.memberName || p.userId || ""}`, 0, sales);
      if (surcharge) {
        push(date, cashOrAR, `Surcharge - ${p.memberName || ""}`, surcharge, 0);
        push(date, "Interest Income", `Surcharge - ${p.memberName || ""}`, 0, surcharge);
      }
    }

    // Loans disbursed
    const loansAll = await Loan.findAll({ order: [["approvalDate", "ASC"]] });
    for (const l of loansAll) {
      const date = l.approvalDate || l.createdAt;
      const amt = Number(l.loanAmount || 0);
      if (!amt) continue;
      push(date, "Loans Receivable", `Loan disbursement (loan ${l.id})`, amt, 0);
      push(date, "Cash", `Loan disbursement (loan ${l.id})`, 0, amt);
    }

    // Loan payments
    const paymentsAll = await Payment.findAll({ order: [["paymentDate", "ASC"]] });
    for (const p of paymentsAll) {
      const date = p.paymentDate || p.createdAt;
      const amt = Number(p.amountPaid || 0);
      if (!amt) continue;
      push(date, "Cash", `Loan payment (loan ${p.loanId || "-"})`, amt, 0);
      push(date, "Loans Receivable", `Loan payment (loan ${p.loanId || "-"})`, 0, amt);
    }

    // Dividends
    const dividendsAll = await Dividend.findAll({ order: [["createdAt", "ASC"]] });
    for (const d of dividendsAll) {
      const date = d.createdAt || d.date;
      const amt = Number(d.amount || 0);
      if (!amt) continue;
      push(date, "Dividends Expense", `Dividend paid (member ${d.memberId || "-"})`, amt, 0);
      push(date, "Cash", `Dividend paid (member ${d.memberId || "-"})`, 0, amt);
    }

    // Bills
    const billsAll = await Bill.findAll({ order: [["createdAt", "ASC"]] });
    for (const b of billsAll) {
      const date = b.createdAt || b.date;
      const amt = Number(b.amount || 0);
      if (!amt) continue;
      push(date, "Bills Expense", `Bill - ${b.billName || ""}`, amt, 0);
      push(date, "Cash", `Bill - ${b.billName || ""}`, 0, amt);
    }

    return txs.filter(t => t.date && !Number.isNaN(t.date.getTime())).sort((a, b) => a.date - b.date);
  }

  const allTx = await collectLedgerTransactions();
  const start = range?.start || null;
  const end = range?.end || null;

  // Preferred account ordering for readability
  const preferredOrder = [
    "Accounts Receivable",
    "Bills Expense",
    "Cash",
    "Dividends Expense",
    "Interest Income",
    "Loans Receivable",
    "Sales Revenue",
    "Share Capital",
  ];
  const foundAccounts = Array.from(new Set(allTx.map(t => t.account)));
  const accounts = [
    ...preferredOrder.filter(a => foundAccounts.includes(a)),
    ...foundAccounts.filter(a => !preferredOrder.includes(a)).sort()
  ];

  const fmt = (v) => Number(v || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" });
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-PH") : "";

  // For each account, compute opening balance, list period transactions and running balance
  for (const acct of accounts) {
    const acctTxAll = allTx.filter(t => t.account === acct);

    // Opening balance = sum(debits - credits) for transactions before the start
    const openingBalance = start
      ? acctTxAll.filter(t => t.date < start).reduce((s, t) => s + (t.debit - t.credit), 0)
      : 0;

    // Transactions within period (or all when no start)
    const periodTx = acctTxAll.filter(t => {
      if (!start) return true;
      return t.date >= start && t.date < end;
    });
const LEFT = 20;
const RIGHT = 570;

    // Header for account
    doc.x = LEFT;
doc.font("Helvetica-Bold").fontSize(11).text(acct, LEFT);
doc.moveDown(0.2);

    // Table header
    const startY = doc.y;
    const rowHeight = 18;
    const col = { date: 20, desc: 100, debit: 320, credit: 400, bal: 480 };
    doc.font("Helvetica-Bold").fontSize(9);
    doc.text("Date", col.date, startY, { width: 80 });
    doc.text("Description", col.desc, startY, { width: 250 });
    doc.text("Debit", col.debit, startY, { width: 70, align: "right" });
    doc.text("Credit", col.credit, startY, { width: 70, align: "right" });
    doc.text("Balance", col.bal, startY, { width: 70, align: "right" });
    doc.moveTo(20, startY + 12).lineTo(570, startY + 12).stroke();

    // Rows
    let y = startY + rowHeight;
    doc.font("Helvetica").fontSize(9);

    // Opening Balance row
    let running = openingBalance;
    const openDebit = openingBalance > 0 ? openingBalance : 0;
    const openCredit = openingBalance < 0 ? Math.abs(openingBalance) : 0;

    doc.text("-", col.date, y, { width: 80 });
    doc.text("Opening Balance", col.desc, y, { width: 250 });
    doc.text(openDebit ? fmt(openDebit) : "", col.debit, y, { width: 70, align: "right" });
    doc.text(openCredit ? fmt(openCredit) : "", col.credit, y, { width: 70, align: "right" });
    doc.text(fmt(running), col.bal, y, { width: 70, align: "right" });
    y += rowHeight;

    if (periodTx.length === 0) {
      doc.font("Helvetica-Oblique").fontSize(9);
      doc.text("-", col.date, y, { width: 80 });
      doc.text("*No transactions for the period*", col.desc, y, { width: 250 });
      doc.text("", col.debit, y, { width: 70 });
      doc.text("", col.credit, y, { width: 70 });
      doc.text("", col.bal, y, { width: 70 });
      doc.font("Helvetica").fontSize(9);
      y += rowHeight;
    } else {
      for (const t of periodTx) {
        running += (t.debit - t.credit);
        const dateText = fmtDate(t.date);

        doc.text(dateText, col.date, y, { width: 80 });
        doc.text(t.desc || "-", col.desc, y, { width: 250 });
        doc.text(t.debit ? fmt(t.debit) : "", col.debit, y, { width: 70, align: "right" });
        doc.text(t.credit ? fmt(t.credit) : "", col.credit, y, { width: 70, align: "right" });
        doc.text(fmt(running), col.bal, y, { width: 70, align: "right" });

        y += rowHeight;
        if (y > doc.page.height - 60) {
          doc.addPage();
          y = 60;
        }
      }
    }

    // Closing balance row
    doc.moveDown(0.2);
    doc.font("Helvetica-Bold").fontSize(9);
    doc.text("-", col.date, y, { width: 80 });
    doc.text("Closing Balance", col.desc, y, { width: 250 });
    // show closing balance as debit if positive, credit if negative
    const closeDebit = running > 0 ? running : 0;
    const closeCredit = running < 0 ? Math.abs(running) : 0;
    doc.text(closeDebit ? fmt(closeDebit) : "", col.debit, y, { width: 70, align: "right" });
    doc.text(closeCredit ? fmt(closeCredit) : "", col.credit, y, { width: 70, align: "right" });
    doc.text(fmt(running), col.bal, y, { width: 70, align: "right" });

    doc.moveDown(0.8);
    doc.moveTo(20, doc.y - 6).lineTo(570, doc.y - 6).stroke();
    doc.moveDown(0.5);
  }
}



/* -------- BILLS -------- */
if (reportType === "bills" || reportType === "all") {

  doc.fontSize(14).text("BILLS").moveDown(1);

  const startY = doc.y;
  const rowHeight = 20;

  const col = {
    date: 20,
    member: 110,
    bill: 280,
    amount: 380,
    method: 470,
  };

  /* ===== HEADER ===== */
  doc.font("Helvetica-Bold").fontSize(10);

  doc.text("Date", col.date, startY, { width: 60, lineBreak: false });
  doc.text("Member", col.member, startY, { width: 150, lineBreak: false });
  doc.text("Bill Name", col.bill, startY, { width: 120, lineBreak: false });
  doc.text("Amount", col.amount, startY, { width: 70});
  doc.text("Payment Method", col.method, startY, { width: 90, align: "center", lineBreak: false });

  doc.moveTo(20, startY + 14).lineTo(570, startY + 14).stroke();

  /* ===== ROWS ===== */
  let y = startY + rowHeight;
  doc.font("Helvetica").fontSize(9);

  const bills = await Bill.findAll({
    where: { ...dateWhere },
    include: [{ model: User, attributes: ["firstName", "middleName", "lastName"] }],
    order: [["createdAt", "ASC"]],
  });

  for (const b of bills) {

    const dateText = b.createdAt
      ? new Date(b.createdAt).toLocaleDateString("en-PH")
      : "-";

    const name = `${b.User?.firstName || ""} ${b.User?.middleName || ""} ${b.User?.lastName || ""}`.trim();

    const billName = b.billName || b.name || "-";
    const paymentMethod = b.paymentMethod || "-";

    doc.text(dateText, col.date, y, { width: 60 });

    doc.text(name, col.member, y, { width: 150 });

    doc.text(billName, col.bill, y, {
      width: 120,
      ellipsis: true, // prevents long bill names from breaking layout
    });

    doc.text(
      Number(b.amount || 0).toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
      }),
      col.amount,
      y,
      { width: 70}
    );

    doc.text(paymentMethod, col.method, y, {
      width: 90,
      align: "center",
    });

    y += rowHeight;

    /* ===== PAGE BREAK ===== */
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = 60;
    }
  }

  doc.moveDown(1.5);
}

    }
// MEMBER LEDGER (per account, filtered by memberId)
if (reportType === "member_ledger") {
  const memberId = req.body.memberId;
  if (!memberId) {
    doc.font("Helvetica").fontSize(10).text("Member ID is required for member ledger.");
    doc.end();
    return;
  }

  const memberUser = await User.findByPk(memberId);
  doc.fontSize(14).text(`MEMBER LEDGER - ${memberUser ? `${memberUser.firstName || ""} ${memberUser.lastName || ""}` : memberId}`, { align: "left" }).moveDown(0.5);

  async function collectMemberTransactions(mid) {
    const txs = [];
    const push = (date, account, desc, debit = 0, credit = 0) =>
      txs.push({
        date: date ? new Date(date) : null,
        account,
        desc,
        debit: Number(debit || 0),
        credit: Number(credit || 0),
      });

    // Shares for this member
    const sharesAll = await Shares.findAll({ where: { userId: mid }, order: [["createdAt", "ASC"]] });
    for (const s of sharesAll) {
      const date = s.createdAt || s.date;
      const amt = Number(s.shareamount || 0);
      if (!amt) continue;
      push(date, "Cash", `Share contribution (user ${mid})`, amt, 0);
      push(date, "Share Capital", `Share contribution (user ${mid})`, 0, amt);
    }

    // Purchases for this member
    const purchasesAll = await Purchase.findAll({ where: { userId: mid }, order: [["createdAt", "ASC"]] });
    for (const p of purchasesAll) {
      const date = p.createdAt || p.date;
      const sales = Number(p.subtotal || 0);
      const surcharge = Number(p.surcharge || 0);
      const total = Number(p.total || sales + surcharge);
      const cashOrAR = String(p.status || "paid").toLowerCase() === "paid" ? "Cash" : "Accounts Receivable";
      if (total) push(date, cashOrAR, `Sale - ${p.memberName || p.userId || ""}`, total, 0);
      if (sales) push(date, "Sales Revenue", `Sale - ${p.memberName || p.userId || ""}`, 0, sales);
      if (surcharge) {
        push(date, cashOrAR, `Surcharge - ${p.memberName || ""}`, surcharge, 0);
        push(date, "Interest Income", `Surcharge - ${p.memberName || ""}`, 0, surcharge);
      }
    }

    // Loans (disbursements) for this member
    const loansAll = await Loan.findAll({ where: { userId: mid }, order: [["approvalDate", "ASC"]] });
    const loanIds = loansAll.map(l => l.id);
    for (const l of loansAll) {
      const date = l.approvalDate || l.createdAt;
      const amt = Number(l.loanAmount || 0);
      if (!amt) continue;
      push(date, "Loans Receivable", `Loan disbursement (loan ${l.id})`, amt, 0);
      push(date, "Cash", `Loan disbursement (loan ${l.id})`, 0, amt);
    }

    // Payments related to the member's loans
    if (loanIds.length > 0) {
      const paymentsAll = await Payment.findAll({ where: { loanId: loanIds }, order: [["paymentDate", "ASC"]] });
      for (const p of paymentsAll) {
        const date = p.paymentDate || p.createdAt;
        const amt = Number(p.amountPaid || 0);
        if (!amt) continue;
        push(date, "Cash", `Loan payment (loan ${p.loanId || "-"})`, amt, 0);
        push(date, "Loans Receivable", `Loan payment (loan ${p.loanId || "-"})`, 0, amt);
      }
    }

    // Dividends for this member
    const dividendsAll = await Dividend.findAll({ where: { memberId: mid }, order: [["createdAt", "ASC"]] });
    for (const d of dividendsAll) {
      const date = d.createdAt || d.date;
      const amt = Number(d.amount || 0);
      if (!amt) continue;
      push(date, "Dividends Expense", `Dividend paid (member ${mid})`, amt, 0);
      push(date, "Cash", `Dividend paid (member ${mid})`, 0, amt);
    }

    // Bills for this member
    const billsAll = await Bill.findAll({ where: { memberId: mid }, order: [["createdAt", "ASC"]] });
    for (const b of billsAll) {
      const date = b.createdAt || b.date;
      const amt = Number(b.amount || 0);
      if (!amt) continue;
      push(date, "Bills Expense", `Bill - ${b.billName || ""}`, amt, 0);
      push(date, "Cash", `Bill - ${b.billName || ""}`, 0, amt);
    }

    return txs.filter(t => t.date && !Number.isNaN(t.date.getTime())).sort((a, b) => a.date - b.date);
  }

  const allTx = await collectMemberTransactions(memberId);
  const start = range?.start || null;
  const end = range?.end || null;

  if (allTx.length === 0) {
    doc.font("Helvetica").fontSize(10).text("No transactions found for this member.");
    doc.moveDown(0.5);
  } else {
    const preferredOrder = [
      "Accounts Receivable",
      "Bills Expense",
      "Cash",
      "Dividends Expense",
      "Interest Income",
      "Loans Receivable",
      "Sales Revenue",
      "Share Capital",
    ];
    const foundAccounts = Array.from(new Set(allTx.map(t => t.account)));
    const accounts = [
      ...preferredOrder.filter(a => foundAccounts.includes(a)),
      ...foundAccounts.filter(a => !preferredOrder.includes(a)).sort()
    ];

    const fmt = (v) => Number(v || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" });
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-PH") : "";

    for (const acct of accounts) {
      const acctTxAll = allTx.filter(t => t.account === acct);
      const openingBalance = start
        ? acctTxAll.filter(t => t.date < start).reduce((s, t) => s + (t.debit - t.credit), 0)
        : 0;

      const periodTx = acctTxAll.filter(t => {
        if (!start) return true;
        return t.date >= start && t.date < end;
      });
const LEFT = 20;
const RIGHT = 570;
      // Account header & table similar to the per-account ledger above
      doc.x = LEFT;
doc.font("Helvetica-Bold").fontSize(11).text(acct, LEFT);
      const startY = doc.y;
      const rowHeight = 18;
      const col = { date: 20, desc: 100, debit: 320, credit: 4000, bal: 480 };
      doc.font("Helvetica-Bold").fontSize(9);
      doc.text("Date", col.date, startY, { width: 80 });
      doc.text("Description", col.desc, startY, { width: 250 });
      doc.text("Debit", col.debit, startY, { width: 70, align: "right" });
      doc.text("Credit", col.credit, startY, { width: 70, align: "right" });
      doc.text("Balance", col.bal, startY, { width: 70, align: "right" });
      doc.moveTo(20, startY + 12).lineTo(570, startY + 12).stroke();

      let y = startY + rowHeight;
      doc.font("Helvetica").fontSize(9);

      let running = openingBalance;
      const openDebit = openingBalance > 0 ? openingBalance : 0;
      const openCredit = openingBalance < 0 ? Math.abs(openingBalance) : 0;

      doc.text("-", col.date, y, { width: 80 });
      doc.text("Opening Balance", col.desc, y, { width: 250 });
      doc.text(openDebit ? fmt(openDebit) : "", col.debit, y, { width: 70, align: "right" });
      doc.text(openCredit ? fmt(openCredit) : "", col.credit, y, { width: 70, align: "right" });
      doc.text(fmt(running), col.bal, y, { width: 70, align: "right" });
      y += rowHeight;

      if (periodTx.length === 0) {
        doc.font("Helvetica-Oblique").fontSize(9);
        doc.text("-", col.date, y, { width: 80 });
        doc.text("*No transactions for the period*", col.desc, y, { width: 250 });
        doc.text("", col.debit, y, { width: 70 });
        doc.text("", col.credit, y, { width: 70 });
        doc.text("", col.bal, y, { width: 70 });
        doc.font("Helvetica").fontSize(9);
        y += rowHeight;
      } else {
        for (const t of periodTx) {
          running += (t.debit - t.credit);
          const dateText = fmtDate(t.date);

          doc.text(dateText, col.date, y, { width: 80 });
          doc.text(t.desc || "-", col.desc, y, { width: 250 });
          doc.text(t.debit ? fmt(t.debit) : "", col.debit, y, { width: 70, align: "right" });
          doc.text(t.credit ? fmt(t.credit) : "", col.credit, y, { width: 70, align: "right" });
          doc.text(fmt(running), col.bal, y, { width: 70, align: "right" });

          y += rowHeight;
          if (y > doc.page.height - 60) {
            doc.addPage();
            y = 60;
          }
        }
      }

      // Closing balance
      doc.moveDown(0.2);
      doc.font("Helvetica-Bold").fontSize(9);
      doc.text("-", col.date, y, { width: 80 });
      doc.text("Closing Balance", col.desc, y, { width: 250 });
      const closeDebit = running > 0 ? running : 0;
      const closeCredit = running < 0 ? Math.abs(running) : 0;
      doc.text(closeDebit ? fmt(closeDebit) : "", col.debit, y, { width: 70, align: "right" });
      doc.text(closeCredit ? fmt(closeCredit) : "", col.credit, y, { width: 70, align: "right" });
      doc.text(fmt(running), col.bal, y, { width: 70, align: "right" });

      doc.moveDown(0.8);
      doc.moveTo(20, doc.y - 6).lineTo(570, doc.y - 6).stroke();
      doc.moveDown(0.5);
    }
  }
}
    doc.end();


  } catch (err) {
    console.error("REPORT ERROR:", err);
    res.status(500).json({ message: "Report generation failed", error: err.message });
  }
};



