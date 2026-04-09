// Helper to format date as MM/DD/YYYY or locale string
  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d)) return "-";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { notify } from "../../utils/toast";
import API from '../../apis/axios.js';
import { 
  FiArrowLeft, FiFilter, FiTrendingUp, FiPieChart, 
  FiCreditCard, FiShoppingBag, FiActivity, FiExternalLink, FiCalendar 
} from "react-icons/fi";
import { 
  FiShoppingCart, FiFileText, 
  FiPrinter, FiClock, FiAlertCircle, 
  FiX, FiCheckCircle, FiPackage, FiEye
} from "react-icons/fi";
import { 
 FaTimes 
} from "react-icons/fa";
import { FiTag,  } from "react-icons/fi";
import PaidLoanPopup from "./adminmem/paidloan.jsx";
import AddSharesPopup from "../popup/AddSharesPopup.jsx";
import AddPurchasePopup from "../popup/AddPurchasePopup.jsx";
import AddBillPaymentPopup from "../popup/AddBillPaymentPopup.jsx";
import LoanApplication from "../popup/Loanappli.jsx";
import Sharehistory from "../popup/Sharehistory.jsx";
import AddDividendPopup from "../popup/AddDividendPopup.jsx";
import AddDividendHistoryPopup from "../popup/AddDividendHistoryPopup.jsx";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

export default function MemberDetails({ member, onBack, openAction }) {
  const [isPaidPopupOpen, setIsPaidPopupOpen] = useState(false);
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [isBillHistoryOpen, setIsBillHistoryOpen] = useState(false);
  const [isSharePopupOpen, setIsSharePopupOpen] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isLoanAppOpen, setIsLoanAppOpen] = useState(false);
  const [isShareHistoryOpen, setIsShareHistoryOpen] = useState(false);
  const [isPurchaseHistoryOpen, setIsPurchaseHistoryOpen] = useState(false);
  const [isLoanHistoryOpen, setIsLoanHistoryOpen] = useState(false);

  const [loanHistory, setLoanHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalLoans, setTotalLoans] = useState(0);

  const [payModal, setPayModal] = useState({ open: false, row: null });
  const [processingPayment, setProcessingPayment] = useState(false);

  const [purchases, setPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [selectedPurchase1, setSelectedPurchase1] = useState(null);
  const [processingPayId, setProcessingPayId] = useState(null);

  const [schedule, setSchedule] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const [bills, setBills] = useState([]);
  const [loadingBills, setLoadingBills] = useState(true);

  const [memberShares, setMemberShares] = useState(0);
  const [loadingShares, setLoadingShares] = useState(true);
  const [shareRows, setShareRows] = useState([]);

  // dividend states
  const [isDividendOpen, setIsDividendOpen] = useState(false);
  const [isDividendHistoryOpen, setIsDividendHistoryOpen] = useState(false);
  const [dividends, setDividends] = useState([]);
  const [loadingDividends, setLoadingDividends] = useState(true);

  const [overviewTotals, setOverviewTotals] = useState({
  shares: 0,
  loans: 0,
  purchases: 0,
  bills: 0,
  dividends: 0,
});



// Chart filter state
const [grouping, setGrouping] = useState("Year");
const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
const [availableYears, setAvailableYears] = useState([]);
// add near other buttons inside the Actions block
const [loadingReport, setLoadingReport] = useState(false);
const allLoaded = !loading && !loadingPurchases && !loadingBills && !loadingShares && !loadingDividends;

const downloadMemberReport = async () => {
  setLoadingReport(true);
  try {
    const doc = new jsPDF();
    let y = 8;
    // --- HEADER WITH LOGO AND CTHMC ---
    // Try to get logo from site config API (if available)
    let logoUrl = null;
    try {
      const configRes = await API.get("/api/config");
      if (configRes?.data?.logo) logoUrl = configRes.data.logo;
    } catch (e) {}
    if (logoUrl) {
      try {
        // Only works for base64 or data:image
        let imgData = logoUrl;
        if (!imgData.startsWith("data:image")) {
          imgData = `data:image/png;base64,${imgData}`;
        }
        // Centered, smaller size
        const imgWidth = 15;
        const imgHeight = 15;
        const pageWidth = doc.internal.pageSize.getWidth();
        const x = (pageWidth - imgWidth) / 2;
        doc.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
        y += imgHeight;
      } catch (e) {}
    }
    y += 5;
    doc.setFontSize(10);
    doc.text("Carmona Townhomes Homeowners", 105, y, { align: "center" });
    y += 4;
    doc.text("Multipurpose Cooperative", 105, y, { align: "center" });
    y += 6;
    // Divider line
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 8;
    // Title
    doc.setFontSize(14);
    doc.text("Member Ledger", 105, y,{ align: "center" });
    y += 10;
    let lastY = y;
    // Shares Table
    doc.setFontSize(11);
    doc.text("Contribution and Savings", 14, lastY);
    autoTable(doc, {
      startY: lastY + 5,
      head: [["Date", "Share Amount", "Payment Method", "Note"]],
      body: (shareRows || []).map(s => [
        s.date ? new Date(s.date).toLocaleDateString() : "-",
        s.shareamount ?? 0,
        s.paymentMethod ?? "-",
        s.note ?? ""
      ])
    });
    lastY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : lastY + 40;
    doc.text("Loans", 14, lastY);
    autoTable(doc, {
      startY: lastY + 5,
      head: [["Date", "Loan Amount", "Amortization", "Balance", "Interest", "Service Charge", "Filing Fee", "Capital Buildup"]],
      body: (loanHistory || []).map(l => [
        l.approvalDate ? new Date(l.approvalDate).toLocaleDateString() : "-",
        l.loanAmount ?? 0,
        l.amortization ?? 0,
        l.loanAmount ?? 0,
        l.interest ?? 0,
        l.serviceCharge ?? 0,
        l.filingFee ?? 0,
        l.capitalBuildUp ?? 0
      ])
    });
    lastY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : lastY + 40;
    doc.text("Purchases", 14, lastY);
    autoTable(doc, {
      startY: lastY + 5,
      head: [["Date", "Items", "Total Cost", "Total Income", "Total"]],
      body: (purchases || []).map(p => [
        p.created_at ? new Date(p.created_at).toLocaleDateString() : "-",
        (p.items || []).map(it => `${it.name ?? "Item"} x${it.qty ?? 1}`).join(", "),
        p.cost ?? 0,
        p.income ?? 0,
        p.total ?? 0
      ])
    });
    lastY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : lastY + 40;
    doc.text("Bills Pay", 14, lastY);
    autoTable(doc, {
      startY: lastY + 5,
      head: [["Date", "Bill Name", "Amount", "Payment Method"]],
      body: (bills || []).map(b => [
        b.date ? new Date(b.date).toLocaleDateString() : "-",
        b.billName ?? "-",
        b.amount ?? 0,
        b.paymentMethod ?? "-"
      ])
    });
    lastY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : lastY + 40;
    doc.text("Dividend", 14, lastY);
    autoTable(doc, {
      startY: lastY + 5,
      head: [["Date", "Amount"]],
      body: (dividends || []).map(d => [
        d.date ? new Date(d.date).toLocaleDateString() : "-",
        d.amount ?? 0
      ])
    });
    // Check if all tables are empty
    const isEmpty = [shareRows, loanHistory, purchases, bills, dividends].every(arr => !arr || arr.length === 0);
    if (isEmpty) {
      notify.error("No data available to generate report.");
      setLoadingReport(false);
      return;
    }
    doc.save("member-report.pdf");
    notify.success("Report generated successfully.");
  } catch (err) {
    notify.error("Failed to generate report: " + (err?.message || err));
  }
  setLoadingReport(false);
};

// normalize date helper
const getDateFrom = (item) => {
  const d = item?.date ?? item?.createdAt ?? item?.created_at ?? item?.paidAt ?? item?.paid_at ?? item?.created ?? item?.approvalDate;
  const dt = d ? new Date(d) : null;
  return isNaN(dt) ? null : dt;
};

const collectYears = () => {
  const years = new Set();
  const months = new Set();
  [loanHistory, purchases, bills, dividends, shareRows].forEach((arr) =>
    (arr || []).forEach((r) => { const dt = getDateFrom(r); if (dt) { years.add(dt.getFullYear()); if (dt.getFullYear() === selectedYear) months.add(dt.getMonth() + 1); } })
  );
  const arr = Array.from(years).sort((a,b)=>b-a);
  if (arr.length === 0) arr.push(new Date().getFullYear());
  setAvailableYears(arr);
  if (!arr.includes(selectedYear)) setSelectedYear(arr[0]);
  // set selectedMonth to latest month in selectedYear if grouping Month
  if (grouping === "Month") {
    const monthArr = Array.from(months).sort((a,b)=>b-a);
    if (monthArr.length > 0) setSelectedMonth(monthArr[0]);
  }
};
useEffect(() => collectYears(), [loanHistory, purchases, bills, dividends, shareRows, grouping, selectedYear]);

const monthsLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const aggregateCounts = (rows, opts = { type: "count", amountField: null }) => {
  const { type, amountField } = opts;
  if (!rows || rows.length === 0) {
    // return empty labels for current selection
    if (grouping === "Year") return { labels: monthsLabels, data: monthsLabels.map(()=>0) };
    // Month -> days in month
    const days = new Date(selectedYear, selectedMonth, 0).getDate();
    return { labels: Array.from({length: days}, (_,i)=>String(i+1)), data: new Array(days).fill(0) };
  }

  if (grouping === "Year") {
    // monthly breakdown for selectedYear
    const byMonth = new Array(12).fill(0);
    rows.forEach((r) => {
      const dt = getDateFrom(r);
      if (!dt) return;
      if (dt.getFullYear() !== Number(selectedYear)) return;
      const m = dt.getMonth(); // 0-11
      byMonth[m] += type === "sum" ? (Number(r[amountField] ?? r.amount ?? r.total ?? 0) || 0) : 1;
    });
    return { labels: monthsLabels, data: byMonth };
  }

  // grouping === "Month"
  const days = new Date(selectedYear, selectedMonth, 0).getDate(); // selectedMonth is 1-12
  const byDay = new Array(days).fill(0);
  rows.forEach((r) => {
    const dt = getDateFrom(r);
    if (!dt) return;
    if (dt.getFullYear() !== Number(selectedYear)) return;
    if (dt.getMonth() !== (Number(selectedMonth) - 1)) return;
    const idx = dt.getDate() - 1; // 0-based
    byDay[idx] += type === "sum" ? (Number(r[amountField] ?? r.amount ?? r.total ?? 0) || 0) : 1;
  });
  return { labels: Array.from({length: days}, (_,i)=>String(i+1)), data: byDay };
};
useEffect(() => {
  const computeOverview = () => {
    const shares = Number(memberShares) || 0;

    // sum loan outstanding balances
    const loans = (loanHistory || []).reduce((s, l) => {
      const v = Number(l.remainbalance ?? l.remaining ?? l.balance ?? 0);
      return s + (Number.isNaN(v) ? 0 : v);
    }, 0);

    // sum purchases totals
    const purchasesTotal = (purchases || []).reduce((s, p) => s + (Number(p.total ?? p.totalAmount ?? 0) || 0), 0);

    // sum bills amounts
    const billsTotal = (bills || []).reduce((s, b) => s + (Number(b.amount ?? b.total ?? 0) || 0), 0);

    // sum dividends amounts
    const dividendsTotal = (dividends || []).reduce((s, d) => s + (Number(d.amount ?? d.dividend ?? 0) || 0), 0);

    setOverviewTotals({
      shares,
      loans,
      purchases: purchasesTotal,
      bills: billsTotal,
      dividends: dividendsTotal,
    });
  };

  computeOverview();
}, [memberShares, loanHistory, purchases, bills, dividends]);


// Auto-refresh schedule every 30 seconds while Pay Loan modal is open
useEffect(() => {
  let intervalId;
  const fetchSchedule = async () => {
    if (!isPaidPopupOpen || !loanHistory[0]?.id) return;
    setLoadingSchedule(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.get(`/api/loans/${loanHistory[0].id}/amortization`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchedule(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setSchedule([]);
    }
    setLoadingSchedule(false);
  };
  if (isPaidPopupOpen && loanHistory[0]?.id) {
    fetchSchedule();
    intervalId = setInterval(fetchSchedule, 30000); // 30 seconds
  }
  return () => {
    if (intervalId) clearInterval(intervalId);
  };
}, [isPaidPopupOpen, loanHistory]);

  useEffect(() => {
  if (!openAction) return;
  if (openAction === "paidLoan") setIsPaidPopupOpen(true);
  if (openAction === "purchase") setIsPurchaseOpen(true);
  if (openAction === "addShares") setIsSharePopupOpen(true);
  if (openAction === "payBills") setIsBillOpen(true);
}, [openAction]);

  const loan = loanHistory[0];
  // only include loans whose status contains "approve" (e.g. "approved", "approve")
  const approvedLoans = Array.isArray(loanHistory) ? loanHistory.filter((l) => String(l.status ?? "").toLowerCase().includes("approve")) : [];

   const unpaid = purchases.filter((p) => String(p.status).toLowerCase() === "not paid");

  const name =
    `${member.firstName || ""} ${member.middleName || ""} ${member.lastName || ""}`.trim() ||
    member.memberName ||
    member.name ||
    "Member";
  const membership = member.createdAt || "Regular Member";

  const formatPeso = (value) => {
    const n = Number(value) || 0;
    return n.toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 0,
    });
  };

  // ---------- Shares ----------
  async function fetchMemberSharesTotal() {
    setLoadingShares(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.get(`/api/shares/member/${encodeURIComponent(member.id)}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const rows = res.data ?? [];
      const sum = rows.reduce((acc, r) => {
        const v = Number(r.shareamount ?? r.shareAmount ?? r.amount ?? 0);
        return acc + (Number.isNaN(v) ? 0 : v);
      }, 0);
      setShareRows(Array.isArray(rows) ? rows : []);
      setMemberShares(sum);
    } catch (err) {
      console.error("Failed to fetch member shares:", err?.response?.data || err);
      setMemberShares(Number(member.shares) || 0);
      setShareRows([]);
    } finally {
      setLoadingShares(false);
    }
  }

  // ---------- Purchases ----------
  async function fetchMemberPurchases() {
    setLoadingPurchases(true);
    try {
      const token = localStorage.getItem("token");
      const id = encodeURIComponent(member.id);
      const res = await API.get(`/api/purchases/member/${id}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });

      const raw = Array.isArray(res.data) ? res.data : res.data.purchases ?? [];

      const normalized = raw.map((p) => {
        let rawItems = p.items ?? p.item ?? p.lines ?? [];
        if (typeof rawItems === "string") {
          try {
            const parsed = JSON.parse(rawItems);
            rawItems = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            rawItems = [];
          }
        }
        if (!Array.isArray(rawItems) && rawItems && typeof rawItems === "object") {
          const maybeArray = Object.keys(rawItems)
            .sort()
            .map((k) => rawItems[k])
            .filter((v) => v != null);
          rawItems = Array.isArray(maybeArray) ? maybeArray : [];
        }
        if (!Array.isArray(rawItems)) rawItems = [];

        return {
          ...p,
          id: p.id ?? p._id ?? p.purchaseId,
          total: Number(p.total ?? p.totalAmount ?? p.totalComputed ?? 0),
          items: rawItems,
          dueDate: p.dueDate ?? null,
          createdAt: p.createdAt ?? p.created_at,
          status: p.status ?? p.paymentStatus ?? "unknown",
        };
      });

      setPurchases(normalized);
    } catch (err) {
      console.error("Failed to fetch purchases:", err?.response?.data || err);
      setPurchases([]);
    } finally {
      setLoadingPurchases(false);
    }
  }

  // ---------- Bills ----------
  async function fetchMemberBills() {
    setLoadingBills(true);
    try {
      const token = localStorage.getItem("token");
      const id = encodeURIComponent(member.id);
      const res = await API.get(`/api/bills/member/${id}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });

      const raw = Array.isArray(res.data) ? res.data : res.data.bills ?? res.data.payments ?? [];

      const normalized = raw.map((b) => ({
        ...b,
        id: b.id ?? b._id ?? b.paymentId,
        date: b.date ?? b.paidAt ?? b.createdAt ?? b.created_at,
        billName: b.name ?? b.billName ?? b.description ?? b.bill ?? "Bill",
        amount: Number(b.amount ?? b.total ?? b.paymentAmount ?? 0),
        paymentMethod: b.paymentMethod ?? b.method ?? b.mode ?? "Unknown",
        status: b.status ?? b.paymentStatus ?? "unknown",
      }));

      setBills(Array.isArray(normalized) ? normalized : []);
    } catch (err) {
      console.error("Failed to fetch bills:", err?.response?.data || err);
      setBills([]);
    } finally {
      setLoadingBills(false);
    }
  }

  // ---------- Dividends ----------
  async function fetchMemberDividends() {
    setLoadingDividends(true);
    try {
      const token = localStorage.getItem("token");
      const id = encodeURIComponent(member.id);
      const res = await API.get(`/api/dividends/member/${id}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        validateStatus: null,
      });

      if (res.status === 204 || res.status === 404) {
        setDividends([]);
        return;
      }
      if (res.status >= 400) {
        console.warn("fetchMemberDividends returned", res.status, res.data);
        setDividends([]);
        return;
      }

      const raw = Array.isArray(res.data) ? res.data : res.data?.dividends ?? res.data?.rows ?? [];
      const normalized = (Array.isArray(raw) ? raw : []).map((d) => ({
        id: d.id ?? d._id ?? d.dividendId,
        memberId: d.memberId ?? d.userId ?? d.member,
        amount: Number(d.amount ?? d.dividend ?? 0),
        date: d.date ?? d.createdAt ?? d.created_at,
        note: d.note ?? d.remarks ?? "",
        raw: d,
      }));
      setDividends(normalized);
    } catch (err) {
      console.error("Failed to fetch dividends:", err?.response?.data || err);
      setDividends([]);
    } finally {
      setLoadingDividends(false);
    }
  }

  // ---------- Loans & other fetches ----------
  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get(`/api/loans/member/${encodeURIComponent(member.id)}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          validateStatus: null,
        });

        // handle different shapes & treat 204/404 as empty
        if (res.status === 204 || res.status === 404) {
          setLoanHistory([]);
        } else if (res.status >= 400) {
          setLoanHistory([]);
        } else {
          // support res.data.loan (single) or array shapes
          if (Array.isArray(res.data)) setLoanHistory(res.data);
          else if (res.data?.loan) setLoanHistory([res.data.loan]);
          else if (res.data?.loans) setLoanHistory(res.data.loans);
          else if (res.data && typeof res.data === "object" && (res.data.id || res.data.loanAmount)) setLoanHistory([res.data]);
          else setLoanHistory([]);
        }
      } catch (err) {
        setLoanHistory([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchTotalLoans = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get(`/api/loans/member/${encodeURIComponent(member.id)}/loan-count`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          validateStatus: null,
        });
        setTotalLoans((res.data && (res.data.totalLoans ?? res.data.total)) || 0);
      } catch (err) {
        console.error("❌ Error fetching total loans:", err);
        setTotalLoans(0);
      }
    };

    // run all
    fetchLoans();
    fetchTotalLoans();
    fetchMemberSharesTotal();
    fetchMemberPurchases();
    fetchMemberBills();
    fetchMemberDividends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member.id]);

  // ---------- loan balance calc ----------
  let newbal = 0;
  if (loan) {
    const monthlyRate = 0.02;
    const months = parseInt(loan.duration) || 1;
    const principal = parseFloat(loan.loanAmount) || 0;
    const bal1 = parseFloat(loan.remainbalance) || 0;
    const remainingPayments = months - (loan.paymentsMade || 0);
    const bal4 = principal * monthlyRate;
    const principal1 = principal + bal4;
    newbal = remainingPayments === months ? principal1 : bal1;
  }

  // ---------- helpers ----------
  const fmtMoney = (val) =>
    Number(val || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 });

  const itemsSummary = (items) => {
    if (!items) return "-";
    if (!Array.isArray(items)) {
      if (typeof items === "string") {
        try {
          const parsed = JSON.parse(items);
          if (Array.isArray(parsed)) items = parsed;
          else return "-";
        } catch {
          return "-";
        }
      } else if (typeof items === "object") {
        const values = Object.keys(items).map((k) => items[k]).filter(Boolean);
        if (values.length === 0) return "-";
        return values.map((it) => (it && it.name ? `${it.name} x${it.qty ?? 1}` : String(it))).join(", ");
      } else return "-";
    }
    if (items.length === 0) return "-";
    return items.map((it) => `${it.name} x${it.qty ?? 1}`).join(", ");
  };

  // ---------- actions ----------
  const handleAddSharesConfirm = async (shareamount, paymentMethod = "Cash") => {
    const amt = Number(shareamount);
    if (!amt || amt <= 0) {
      notify.success("Amount must be greater than zero.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const payload = { userId: member.id, shareamount: amt, date: new Date().toISOString(), paymentMethod };
      const res = await API.post("/api/shares/add", payload, {
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      notify.success(res.data.message || "Shares added!");
      await fetchMemberSharesTotal();
      setIsSharePopupOpen(false);
    } catch (err) {
      console.error("Add shares error:", err?.response?.data || err);
      notify.success("Failed to add shares: " + JSON.stringify(err.response?.data || err.message));
    }
  };

  const handlePurchaseSaved = async (purchase) => {
    notify.success("Purchase recorded.");
    setIsPurchaseOpen(false);
    await fetchMemberPurchases();
  };

  const payPurchase = async (purchaseId) => {
    if (!window.confirm("Mark this purchase as paid?")) return;
    setProcessingPayId(purchaseId);
    try {
      const token = localStorage.getItem("token");
      const res = await API.post(`/api/purchases/${purchaseId}/pay`, {}, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      notify.success(res.data?.message || "Purchase marked as paid");
      await fetchMemberPurchases();
      setSelectedPurchase1(null);
    } catch (err) {
      console.error("Failed to pay purchase:", err?.response?.data || err);
      notify.success(err.response?.data?.message || "Failed to mark as paid");
    } finally {
      setProcessingPayId(null);
    }
  };

  const handleDividendSaved = async (payload, response) => {
    try {
      await fetchMemberDividends();
      // optional: refresh bills or other lists if dividends are shown there
      await fetchMemberBills();
    } catch (e) {
      // ignore
    }
  };

  // ---------- UI ----------
  // ...existing code...
  const [loanBalances, setLoanBalances] = useState({});
  const token = localStorage.getItem("token"); // Adjust if you use a different token source

  useEffect(() => {
    if (!approvedLoans || !approvedLoans.length) return;
    const fetchBalances = async () => {
      const balances = {};
      for (const loan of approvedLoans) {
        try {
          const scheduleRes = await API.get(`/api/loans/${loan.id}/amortization`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const schedule = Array.isArray(scheduleRes.data) ? scheduleRes.data : [];
          const totalPaid = schedule
            .filter(row => row.status === "Paid")
            .reduce((sum, row) => sum + (parseFloat(row.amortization) || 0), 0);
          const balance = (parseFloat(loan.loanAmount) + parseFloat(loan.interest || 0)) - totalPaid;
          balances[loan.id] = balance;
        } catch {
          balances[loan.id] = null;
        }
      }
      setLoanBalances(balances);
    };
    fetchBalances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvedLoans, token]);

  return (
    <div>
      <div className=" mx-auto space-y-3">
  {/* HEADER SECTION */}
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div className="flex items-center gap-4">
      <button 
        onClick={onBack} 
        className="p-3 bg-white border border-gray-100 text-gray-500 hover:text-[#7e9e6c] hover:border-[#7e9e6c] rounded-xl transition-all shadow-sm active:scale-95 group"
      >
        <FiArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
      </button>
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight">{name}</h1>
  
      </div>
    </div>
  </div>

  {/* CHARTS CONTROLS BAR */}
  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-6">
    <div className="flex items-center gap-2 text-[#7e9e6c]">
      <FiFilter size={18} />
      <span className="text-xs font-black uppercase tracking-tighter">Analysis Filters</span>
    </div>
    
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">View By</label>
        <select 
          value={grouping} 
          onChange={(e)=>setGrouping(e.target.value)} 
          className="bg-gray-50 border-none text-sm font-bold text-gray-700 px-3 py-1.5 rounded-lg focus:ring-2 focus:ring-[#7e9e6c] cursor-pointer"
        >
          <option value="Year">Yearly</option>
          <option value="Month">Monthly</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Year</label>
        <select 
          value={selectedYear} 
          onChange={(e)=>setSelectedYear(Number(e.target.value))} 
          className="bg-gray-50 border-none text-sm font-bold text-gray-700 px-3 py-1.5 rounded-lg focus:ring-2 focus:ring-[#7e9e6c] cursor-pointer"
        >
          {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {grouping === "Month" && (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Month</label>
          <select 
            value={selectedMonth} 
            onChange={(e)=>setSelectedMonth(Number(e.target.value))} 
            className="bg-gray-50 border-none text-sm font-bold text-gray-700 px-3 py-1.5 rounded-lg focus:ring-2 focus:ring-[#7e9e6c] cursor-pointer"
          >
            {monthsLabels.map((m,i)=> <option key={i} value={i+1}>{m}</option>)}
          </select>
        </div>
      )}
    </div>
  </div>

  {/* CHARTS GRID */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    
    {/* Total Shares */}
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/40">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#d6ead8] text-[#7e9e6c] rounded-lg"><FiPieChart /></div>
          <h4 className="font-bold text-gray-800">Contribution and Savings</h4>
        </div>
      </div>
      {(() => {
        const { labels, data } = aggregateCounts(shareRows, { type: "sum", amountField: "shareamount" });
        return data.reduce((a,b)=>a+b,0) === 0 ? 
          <div className="h-44 flex items-center justify-center text-xs text-gray-400 font-medium italic bg-gray-50 rounded-xl">No share data recorded</div> : (
          <div className="h-44">
            <Bar data={{ labels, datasets:[{ label:"PHP", data, backgroundColor:"#7e9e6c", borderRadius: 6 }] }}
                 options={{ maintainAspectRatio: false, responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { display: false } } } }} />
          </div>
        );
      })()}
    </div>

    {/* Total Dividend */}
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/40">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#e9e4f9] text-[#9a7ee6] rounded-lg"><FiTrendingUp /></div>
          <h4 className="font-bold text-gray-800">Total Dividend</h4>
        </div>
      </div>
      {(() => {
        const { labels, data } = aggregateCounts(dividends, { type: "sum", amountField: "amount" });
        return data.reduce((a,b)=>a+b,0) === 0 ? 
          <div className="h-44 flex items-center justify-center text-xs text-gray-400 font-medium italic bg-gray-50 rounded-xl">No dividend data recorded</div> : (
          <div className="h-44">
            <Bar data={{ labels, datasets:[{ label:"PHP", data, backgroundColor:"#9a7ee6", borderRadius: 6 }] }}
                 options={{ maintainAspectRatio: false, responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { display: false } } } }} />
          </div>
        );
      })()}
    </div>

    {/* Loan Count */}
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/40">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#fdeaea] text-[#e07a7a] rounded-lg"><FiActivity /></div>
          <h4 className="font-bold text-gray-800">Loan Count</h4>
        </div>
      </div>
      {(() => {
        const { labels, data } = aggregateCounts(loanHistory, { type: "count" });
        console.log('loan data', { labels, data }, data.reduce((a,b)=>a+b,0), loanHistory);
        return data.reduce((a,b)=>a+b,0) === 0 ? 
          <div className="h-44 flex items-center justify-center text-xs text-gray-400 font-medium italic bg-gray-50 rounded-xl">No loan data found</div> : (
          <div className="h-44">
            <Line data={{ labels, datasets:[{ label: "Loans", data, borderColor:"#e07a7a", backgroundColor:"rgba(224,122,122,0.1)", fill: true, tension:0.4 }] }}
                  options={{ maintainAspectRatio: false, responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { display: false } } } }} />
          </div>
        );
      })()}
    </div>

    {/* Purchase Count */}
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/40">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#ebf1fb] text-[#6b8fd7] rounded-lg"><FiShoppingBag /></div>
          <h4 className="font-bold text-gray-800">Purchase Count</h4>
        </div>
      </div>
      {(() => {
        const { labels, data } = aggregateCounts(purchases, { type: "count" });
        return data.reduce((a,b)=>a+b,0) === 0 ? 
          <div className="h-44 flex items-center justify-center text-xs text-gray-400 font-medium italic bg-gray-50 rounded-xl">No purchase records</div> : (
          <div className="h-44">
            <Line data={{ labels, datasets:[{ label: "Purchases", data, borderColor:"#6b8fd7", backgroundColor:"rgba(107,143,215,0.1)", fill: true, tension:0.4 }] }}
                  options={{ maintainAspectRatio: false, responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { display: false } } } }} />
          </div>
        );
      })()}
    </div>

    {/* Bill Payment Count (Full Width) */}
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/40 md:col-span-2">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#fff4e8] text-[#f6b26b] rounded-lg"><FiCreditCard /></div>
          <h4 className="font-bold text-gray-800">Bill Payments Frequency</h4>
        </div>
      </div>
      {(() => {
        const { labels, data } = aggregateCounts(bills, { type: "count" });
        return data.reduce((a,b)=>a+b,0) === 0 ? 
          <div className="h-44 flex items-center justify-center text-xs text-gray-400 font-medium italic bg-gray-50 rounded-xl">No bill payments found</div> : (
          <div className="h-44">
            <Line data={{ labels, datasets:[{ label: "Bill Payments", data, borderColor:"#f6b26b", backgroundColor:"rgba(246,178,107,0.1)", fill: true, tension:0.4 }] }}
                  options={{ maintainAspectRatio: false, responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
          </div>
        );
      })()}
    </div>
  </div>

  {/* VIEW HISTORY QUICK ACTIONS */}
  <div className="pt-4 border-t border-gray-100">
    <div className="flex items-center gap-2 mb-4">
      <FiExternalLink className="text-[#7e9e6c]" />
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Detailed Audit History</span>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {[
        { label: "Loan History", onClick: () => setIsLoanHistoryOpen(true) },
        { label: "Purchase History", onClick: () => setIsPurchaseHistoryOpen(true) },
        { label: "Bill History", onClick: () => setIsBillHistoryOpen(true) },
        { label: "Contribution and Savings History", onClick: () => setIsShareHistoryOpen(true) },
        { label: "Dividend History", onClick: () => setIsDividendHistoryOpen(true) },
      ].map((btn, idx) => (
        <button 
          key={idx}
          onClick={btn.onClick}
          className="px-4 py-3 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:border-[#7e9e6c] hover:text-[#7e9e6c] hover:shadow-lg hover:shadow-green-100 transition-all text-center"
        >
          {btn.label}
        </button>
      ))}
          {/* Loan History Modal using LoanApplication */}
          {isLoanHistoryOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="absolute inset-0" onClick={() => setIsLoanHistoryOpen(false)} />
              <div className="relative w-[95vw] max-w-5xl bg-white rounded-2xl shadow-2xl overflow-auto z-60">
                <LoanApplication
                  memberId={member.id}
                  memberName={name}
                  onBack={() => setIsLoanHistoryOpen(false)}
                />
              </div>
            </div>
          )}
    </div>
  </div>

    <div className="mt-8">
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-2xl font-extrabold tracking-tight text-[#5a7a4a]">
      Active Loans
    </h2>
  </div>

  {loading ? (
    <div className="flex items-center space-x-3 animate-pulse">
      <div className="w-4 h-4 bg-[#7e9e6c] rounded-full"></div>
      <p className="text-gray-500 font-medium">Fetching records...</p>
    </div>
  ) : approvedLoans.length > 0 ? (
    <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50/50 border-b border-gray-100">
            <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Purpose</th>
            <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
            <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider text-center">Term</th>
            <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider text-center">Balance</th>
            <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {approvedLoans.map((l) => (
            <tr key={l.id || Math.random()} className="hover:bg-gray-50/80 transition-colors group">
              <td className="px-6 py-5">
                <p className="font-semibold text-gray-800">{l.purpose || "N/A"}</p>
                <p className="text-xs text-gray-400 mt-0.5">{l.paymentsMade ?? "0"} payments made</p>
              </td>
              <td className="px-6 py-5 font-medium text-gray-700">
                {fmtMoney(l.loanAmount)}
              </td>
              <td className="px-6 py-5 text-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                  {l.duration ?? "0"} Months
                </span>
              </td>
              <td className="px-6 py-5 text-center font-bold text-gray-700">
                {loanBalances[l.id] !== undefined && loanBalances[l.id] !== null
                  ? fmtMoney(loanBalances[l.id])
                  : <span className="text-gray-400 text-xs">...</span>}
              </td>
              <td className="px-6 py-5 text-center">
                <button
                  className="px-3 py-1 bg-[#7e9e6c] text-white rounded-lg text-center text-xs font-bold shadow-sm hover:bg-[#6a865a] transition-all"
                  onClick={() => {
                    setLoanHistory([l]);
                    setIsPaidPopupOpen(true);
                  }}
                  title="Mark as Paid"
                >
                   Paid Loan
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-xl">
      <p className="text-gray-400 text-lg">No approved loans.</p>
    </div>
  )}
</div>
      
      {/* --- ACTION BUTTONS GRID --- */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mt-8">
        {[
          { label: "Purchase", icon: <FiShoppingCart size={24} />, action: () => setIsPurchaseOpen(true) },
          { label: "Add Contribution and Savings", icon: <FiPieChart size={24} />, action: () => setIsSharePopupOpen(true) },
          { label: "Pay Bills", icon: <FiFileText size={24} />, action: () => setIsBillOpen(true) },
          { label: "Add Dividend", icon: <FiTrendingUp size={24} />, action: () => setIsDividendOpen(true) },
          { label: "Member Report", icon: <FiPrinter size={24} />, action: downloadMemberReport, disabled: loadingReport || !allLoaded, loadingText: "Generating..." }
        ].map((btn, idx) => (
          <button
            key={idx}
            onClick={btn.action}
            disabled={btn.disabled}
            className="group flex flex-col items-center justify-center gap-3 bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-[#7e9e6c]/30 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="p-4 bg-[#f0f7ef] text-[#7e9e6c] rounded-full group-hover:bg-[#7e9e6c] group-hover:text-white transition-colors duration-300">
              {btn.icon}
            </div>
            <span className="font-bold text-gray-700 text-sm group-hover:text-[#7e9e6c]">
              {btn.disabled ? btn.loadingText : btn.label}
            </span>
          </button>
        ))}
      </div>

      {/* --- PURCHASE DETAILS MODAL (selectedPurchase1) --- */}
      {selectedPurchase1 && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[900] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-5 bg-[#7e9e6c] text-white flex justify-between items-start">
               <div>
                 <h4 className="text-xl font-bold">Purchase Details</h4>
                 <p className="text-[#dbece0] text-xs mt-1">Transaction ID: {selectedPurchase1.id ?? selectedPurchase1._id ?? "N/A"}</p>
               </div>
               <button 
                 onClick={() => setSelectedPurchase1(null)} 
                 className="p-1 bg-white/20 hover:bg-white/40 rounded-full transition-colors"
               >
                 <FiX size={20} />
               </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-xs uppercase">Item</th>
                    <th className="text-right px-6 py-3 font-semibold text-xs uppercase">Qty</th>
                    <th className="text-right px-6 py-3 font-semibold text-xs uppercase">Price</th>
                    <th className="text-right px-6 py-3 font-semibold text-xs uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(selectedPurchase1.items || []).map((it, i) => (
                    <tr key={i}>
                      <td className="px-6 py-3 text-gray-700 font-medium">{it.name}</td>
                      <td className="px-6 py-3 text-right text-gray-500">{it.qty ?? 1}</td>
                      <td className="px-6 py-3 text-right text-gray-500">{fmtMoney(it.unitPrice)}</td>
                      <td className="px-6 py-3 text-right font-semibold text-gray-800">{fmtMoney((it.qty ?? 1) * (it.unitPrice ?? 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <div className="flex justify-between items-center mb-4">
                 <span className="text-gray-500 font-medium text-sm">Total Amount</span>
                 <span className="text-2xl font-bold text-[#7e9e6c]">{fmtMoney(selectedPurchase1.total)}</span>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500 bg-white p-3 rounded-lg border border-gray-100">
                 <div className="flex items-center gap-2">
                   <FiCalendar className="text-[#7e9e6c]" />
                   <span>Due: {selectedPurchase1.dueDate ? new Date(selectedPurchase1.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${String(selectedPurchase1.status).toLowerCase() === 'paid' ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                    <span className="capitalize">{selectedPurchase1.status}</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PURCHASE HISTORY MODAL (isPurchaseHistoryOpen) --- */}
      {isPurchaseHistoryOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-50 p-4 bg-black/45 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100">
            
            {/* HEADER */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#56794a]">Purchase History</h2> 
                </div>
              </div>
              <button
                onClick={() => setIsPurchaseHistoryOpen(false)}
                className="p-2 ml-4 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 hover:text-[#7e9e6c] transition-colors"
                title="Close"
                aria-label="Close"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* LIST CONTENT */}
            <div className="flex-1 overflow-auto p-6 bg-white">
              {purchases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                    <FiPackage size={32} />
                  </div>
                  <h4 className="text-gray-800 font-semibold">No records found</h4>
                  <p className="text-sm text-gray-400 mt-1">No purchase history available for this member.</p>
                </div>
              ) : (
                <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr className="border-b border-gray-100">
                                <th className="text-left px-4 py-4 font-bold text-gray-500 uppercase tracking-tighter">Date</th>
                                <th className="text-left px-4 py-4 font-bold text-gray-500 uppercase tracking-tighter">Items Summary</th>
                                <th className="text-right px-4 py-4 font-bold text-gray-500 uppercase tracking-tighter">Cost</th> 
                                <th className="text-right px-4 py-4 font-bold text-gray-500 uppercase tracking-tighter">Total Income</th>
                                <th className="text-right px-4 py-4 font-bold text-gray-500 uppercase tracking-tighter">Total</th>
  
                                <th className="text-center px-4 py-4 font-bold text-gray-500 uppercase tracking-tighter">Status</th>
<th className="text-center px-4 py-4 font-bold text-gray-500 uppercase tracking-tighter">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {purchases.map((p, i) => {
                                const pid = p.id || p._id || p.purchaseId || i;
                                const statusStr = String(p.status ?? p.paymentStatus ?? "unknown").toLowerCase();
                                // Compute total income if not present
                                const totalIncome = typeof p.income === 'number' ? p.income : (Array.isArray(p.items) ? p.items.reduce((sum, it) => sum + (((it.unitPrice || 0) - (it.costOfSale || 0)) * (it.qty || 1)), 0) : 0);
                                const cost = typeof p.cost === 'number' ? p.cost : (Array.isArray(p.items) ? p.items.reduce((sum, it) => sum + ((it.costOfSale || 0) * (it.qty || 1)), 0) : 0);
                                const incomePerUnit = Array.isArray(p.items) && p.items.length > 0 ? (p.items[0].unitPrice || 0) - (p.items[0].costOfSale || 0) : (p.incomePerUnit || 0);
                                return (
                                  <tr key={pid} className="group hover:bg-[#d6ead8]/10 transition-colors">
                                    <td className="px-4 py-4 text-gray-600 font-medium whitespace-nowrap">
                                      {(p.createdAt || p.created_at || p.date) ? new Date(p.createdAt || p.created_at || p.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}
                                    </td>
                                    <td className="px-4 py-4">
                                      <p className="text-gray-800 font-semibold line-clamp-1 truncate max-w-[190px]">
                                        {itemsSummary(p.items)}
                                      </p>
                                    </td>
                                    <td className="px-4 py-4 text-right text-gray-700">
                                      {fmtMoney(cost)}
                                    </td>
                                    <td className="px-4 py-4 text-right text-gray-700">
                                      {fmtMoney(totalIncome)}
                                    </td>
                                    <td className="px-4 py-4 text-right font-bold text-[#7e9e6c]">
                                      {fmtMoney(p.total ?? p.totalAmount ?? p.amount ?? p.price ?? 0)}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                        statusStr === 'paid' ? 'bg-green-100 text-green-700' :
                                        statusStr === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-gray-100 text-gray-600'
                                      }`}>
                                        {statusStr}
                                      </span>
                                      
                                    </td>
                                    <td>
                                      <button
                                        className="ml-2 px-3 py-1 bg-[#7e9e6c] text-white rounded-lg text-xs font-bold shadow-sm hover:bg-[#6a865a] transition-all"
                                        onClick={() => setSelectedPurchase(p)}
                                        title="View Details"
                                      >
                                        View Details
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
              )}
            </div>
            {/* PURCHASE DETAILS MODAL (selectedPurchase) */}
            {selectedPurchase && (
              <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
                  <div className="p-6 bg-[#7e9e6c] text-white">
                    <div className="flex justify-between items-start mb-4">
                      <FiCheckCircle size={32} className="opacity-80" />
                      <button onClick={() => setSelectedPurchase(null)} className="hover:rotate-90 transition-transform">
                        <FiX size={24} />
                      </button>
                    </div>
                    <h3 className="text-2xl font-black">Purchase Details</h3>
                  </div>
                  <div className="flex-1 overflow-auto p-6">
                    <table className="w-full text-sm mb-6">
                      <thead>
                        <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                          <th className="text-left pb-2">Item Description</th>
                          <th className="text-right pb-2">Qty</th>
                          <th className="text-right pb-2">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(selectedPurchase.items ?? []).map((it, index) => (
                          <tr key={index}>
                            <td className="py-3 text-gray-700 font-medium">{it.name || it.item}</td>
                            <td className="py-3 text-right text-gray-500">x{it.qty ?? 1}</td>
                            <td className="py-3 text-right font-bold text-gray-900">
                              {fmtMoney((it.qty ?? 1) * (it.unitPrice ?? 0))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">

                      <div className="flex justify-between text-gray-900 font-black text-lg border-t border-gray-200 pt-2">
                        <span>Total Amount</span>
                        <span className="text-[#7e9e6c]">{fmtMoney(selectedPurchase.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

        {/* Bill history modal */}
        {isBillHistoryOpen && (
          <div className="fixed inset-0 flex justify-center items-center z-50 p-4  bg-black/45">
  {/* Backdrop Close Event */}
  <div className="absolute inset-0 z-[-1]" onClick={() => setIsBillHistoryOpen(false)} />

  <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
    
    {/* MODAL HEADER */}
    <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
      <div className="flex items-center gap-3">
        <div>
          <h3 className="text-2xl font-extrabold text-[#56794a]">Bills History</h3>
        </div>
      </div>
      <button
        onClick={() => setIsBillHistoryOpen(false)}
        className="p-2 ml-4 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 hover:text-[#7e9e6c] transition-colors"
        title="Close"
        aria-label="Close"
      >
        <FaTimes className="text-xl" />
      </button>
    </div>

    {/* CONTENT AREA */}
    <div className="flex-1 overflow-auto p-6 bg-white">
      {bills.length === 0 ? (
        // EMPTY STATE
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mb-4 border border-gray-100">
            <FiFileText size={32} />
          </div>
          <h4 className="text-gray-800 font-semibold text-lg">No records found</h4>
          <p className="text-sm text-gray-400 max-w-[260px] mt-1">
            There are no bill payment records available for this member.
          </p>
        </div>
      ) : (
        // DATA TABLE
        <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-4 py-4 text-left font-bold text-gray-500 uppercase tracking-tighter">
                  <div className="flex items-center gap-2"><FiCalendar size={14} /> Date</div>
                </th>
                <th className="px-4 py-4 text-left font-bold text-gray-500 uppercase tracking-tighter">
                  <div className="flex items-center gap-2"><FiTag size={14} /> Bill Name</div>
                </th>
                <th className="px-4 py-4 text-center font-bold text-gray-500 uppercase tracking-tighter">
                  <div className="flex items-center justify-center gap-2"><FiCreditCard size={14} /> Method</div>
                </th>
                <th className="px-4 py-4 text-right font-bold text-gray-500 uppercase tracking-tighter">
                   <div className="flex items-center justify-end gap-2">Amount</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bills.map((b) => (
                <tr 
                  key={b.id ?? b._id} 
                  className="group hover:bg-[#d6ead8]/15 transition-colors"
                >
                  {/* Date */}
                  <td className="px-4 py-4 text-gray-600 font-medium whitespace-nowrap">
                    {b.date ? new Date(b.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}
                  </td>

                  {/* Bill Name */}
                  <td className="px-4 py-4">
                    <span className="text-gray-800 font-bold">
                      {b.billName}
                    </span>
                  </td>

                  {/* Payment Method */}
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-[11px] font-extrabold uppercase tracking-tight group-hover:shadow-sm">
                      {b.paymentMethod}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-4 text-[#7e9e6c] font-black text-right">
                    {fmtMoney(b.amount)}                  
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

  </div>
</div>
        )}
      </div>

      <AddSharesPopup
        isOpen={isSharePopupOpen}
        onClose={() => setIsSharePopupOpen(false)}
        onConfirm={(amount, paymentMethod) => handleAddSharesConfirm(amount, paymentMethod)}
        memberName={name}
        date={new Date()}
      />

      <AddPurchasePopup
        isOpen={isPurchaseOpen}
        onClose={() => setIsPurchaseOpen(false)}
        memberId={member.id}
        memberName={name}
        onSaved={handlePurchaseSaved}
      />

      <AddBillPaymentPopup
        isOpen={isBillOpen}
        onClose={() => setIsBillOpen(false)}
        memberId={member.id}
        onSaved={async () => { notify.success("Bill payment recorded!"); setIsBillOpen(false); await fetchMemberBills(); }}
      />


      {isPaidPopupOpen && (
        <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[900] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 bg-[#7e9e6c] text-white flex justify-between items-start">
              <div>
                <h4 className="text-xl font-bold">Pay Loan</h4>
              </div>
              <button 
                onClick={() => setIsPaidPopupOpen(false)} 
                className="p-1 bg-white/20 hover:bg-white/40 rounded-full transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-auto p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-xs uppercase">Month</th>
                    <th className="text-right px-6 py-3 font-semibold text-xs uppercase">Due Date</th>
                    <th className="text-right px-6 py-3 font-semibold text-xs uppercase">Amortization</th>
                    <th className="text-center px-6 py-3 font-semibold text-xs uppercase">Status</th>
                    <th className="text-center px-6 py-3 font-semibold text-xs uppercase">Penalty</th>
                    <th className="text-center px-6 py-3 font-semibold text-xs uppercase">Paid Date</th>
                    <th className="text-center px-6 py-3 font-semibold text-xs uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
  {loadingSchedule ? (
    <tr>
      <td colSpan={7} className="text-center py-8 text-gray-400">Loading schedule...</td>
    </tr>
  ) : schedule.length === 0 ? (
    <tr>
      <td colSpan={7} className="text-center py-8 text-gray-400">No schedule found.</td>
    </tr>
  ) : (
    (() => {
      // Find the first row that is neither Paid nor Late
      const firstUnpaidIdx = schedule.findIndex(r => r.status !== "Paid" && r.status !== "Late");
      const today = new Date();
      return schedule.map((row, idx) => {
        // Compute penalty if overdue and not paid/late, but do NOT override status
        let penalty = Number(row.penalty) || 0;
        if (row.status !== "Paid" && row.status !== "Late" && row.dueDate) {
          const due = new Date(row.dueDate);
          if (due < today) {
            penalty = Number(row.amortization) * 0.01;
          }
        }
        return (
          <tr key={idx}>
            <td className="px-6 py-3 text-gray-700 font-medium">{row.month}</td>
            <td className="px-6 py-3 text-right text-gray-500">{row.dueDate ? formatDate(row.dueDate) : "-"}</td>
            <td className="px-6 py-3 text-right font-semibold text-gray-800">{fmtMoney(row.amortization)}</td>
            <td className="px-6 py-3 text-center">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                row.status === "Paid"
                  ? "bg-green-100 text-green-700"
                  : row.status === "Late"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-600"
              }`}>{row.status}</span>
            </td>
            <td className="px-6 py-3 text-center text-orange-600">{fmtMoney(penalty)}</td>
            <td className="px-6 py-3 text-center">
              {row.paidDate ? formatDate(row.paidDate) : (row.status === "Paid" ? "—" : "")}
            </td>
            <td className="px-6 py-3 text-center">
              {/* Only show Paid button for the first unpaid and not late row */}
              {row.status !== "Paid" && row.status !== "Late" && idx === firstUnpaidIdx && (
                <button
                  className="px-3 py-1 bg-[#7e9e6c] text-white rounded-lg text-center text-xs font-bold shadow-sm hover:bg-[#6a865a] transition-all"
                  onClick={() => setPayModal({ open: true, row: { ...row, penalty } })}
                  title="Mark as Paid"
                >
                  Paid
                </button>
              )}
            </td>
          </tr>
        );
      });
    })()
  )}
</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {payModal.open && payModal.row && (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40">
    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 flex flex-col items-center">
      <h2 className="text-xl font-bold mb-4 text-[#56794a]">Confirm Payment</h2>
      <div className="mb-4 text-center">
        <div className="text-gray-700 mb-2">
          <span className="font-semibold">Month:</span> {payModal.row.month}
        </div>
        <div className="text-gray-700 mb-2">
          <span className="font-semibold">Amortization:</span> {fmtMoney(payModal.row.amortization)}
        </div>
        <div className="text-gray-700 mb-2">
          <span className="font-semibold">Penalty:</span> {
            (() => {
              let penalty = Number(payModal.row.penalty) || 0;
              if (payModal.row.status !== "Paid" && payModal.row.status !== "Late" && payModal.row.dueDate) {
                const due = new Date(payModal.row.dueDate);
                const today = new Date();
                if (due < today) {
                  penalty = Number(payModal.row.amortization) * 0.01;
                }
              }
              return fmtMoney(penalty);
            })()
          }
        </div>
        <div className="text-gray-700 mb-2">
          <span className="font-semibold">Paid Date:</span> {new Date().toLocaleString()}
        </div>
        <div className="text-lg font-bold text-[#7e9e6c] mt-2">
          Total to Pay: {
            (() => {
              let penalty = Number(payModal.row.penalty) || 0;
              if (payModal.row.status !== "Paid" && payModal.row.status !== "Late" && payModal.row.dueDate) {
                const due = new Date(payModal.row.dueDate);
                const today = new Date();
                if (due < today) {
                  penalty = Number(payModal.row.amortization) * 0.01;
                }
              }
              return fmtMoney(Number(payModal.row.amortization) + penalty);
            })()
          }
        </div>
      </div>
      <div className="flex gap-4 mt-4">
        <button
  className="px-6 py-2 bg-[#7e9e6c] text-white rounded-lg font-bold hover:bg-[#6a865a] transition-all"
  disabled={processingPayment}
  onClick={async () => {
    setProcessingPayment(true);
    try {
      const token = localStorage.getItem("token");
      const now = new Date();
      const due = payModal.row.dueDate ? new Date(payModal.row.dueDate) : null;
      let newStatus = "Paid";
      let penalty = 0;
      // If overdue, set penalty to 1% of balance and status to Late
      if (due && now > due) {
        newStatus = "Late";
        // Use remaining balance for penalty calculation
        const balance = loanHistory[0]?.remainbalance || loanHistory[0]?.balance || 0;
        penalty = Number(balance) * 0.01;
      }
      await API.post(
        "/api/loans/loanpayment/add",
        {
          loanId: loanHistory[0]?.id,
          memberId: member.id,
          paymentNumber: payModal.row.month,
          amount: Number(payModal.row.amortization) + penalty,
          penalty,
          status: newStatus,
          paidAt: now,
          dueDate: payModal.row.dueDate,
          paidDate: now,
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      // Increment paymentsMade in UI after successful payment
      setLoanHistory((prev) => {
        if (!prev || prev.length === 0) return prev;
        const updated = [...prev];
        const loanObj = { ...updated[0] };
        loanObj.paymentsMade = (loanObj.paymentsMade || 0) + 1;
        updated[0] = loanObj;
        return updated;
      });
      notify.success("Payment recorded!");
      setPayModal({ open: false, row: null });
      // Refresh schedule after payment
      setLoadingSchedule(true);
      const res = await API.get(`/api/loans/${loanHistory[0].id}/amortization`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchedule(Array.isArray(res.data) ? res.data : []);
      setLoadingSchedule(false);
    } catch (err) {
      notify.success("Failed to record payment: " + (err?.response?.data?.message || err.message));
      setLoadingSchedule(false);
    }
    setProcessingPayment(false);
  }}
>
  {processingPayment ? "Processing..." : "Confirm"}
</button>
        <button
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-all"
          onClick={() => setPayModal({ open: false, row: null })}
          disabled={processingPayment}
        >
          No
        </button>
      </div>
    </div>
  </div>
)}

      {isLoanAppOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsLoanAppOpen(false)} />
          <div className="relative w-[90vw] max-w-4xl bg-white rounded-2xl shadow-2xl overflow-auto z-60">

            <LoanApplication
              onBack={() => setIsLoanAppOpen(false)}
              memberId={member.id}
              memberName={name}
              onLoanUpdated={(updatedLoan) => {
                setLoanHistory((prev) => {
                  if (!prev || prev.length === 0) return prev;
                  return prev.map((l) => (l.id === updatedLoan.id ? { ...l, ...updatedLoan } : l));
                });
              }}
            />
          </div>
        </div>
      )}

      {isShareHistoryOpen && <Sharehistory isOpen={isShareHistoryOpen} onClose={() => setIsShareHistoryOpen(false)} rows={shareRows} loading={loadingShares} />}

      {/* Dividend add modal */}
      <AddDividendPopup isOpen={isDividendOpen} onClose={() => setIsDividendOpen(false)} memberId={member.id} memberName={name} onSaved={handleDividendSaved} />

      {/* Dividend history modal */}
      <AddDividendHistoryPopup isOpen={isDividendHistoryOpen} onClose={() => setIsDividendHistoryOpen(false)} rows={dividends} loading={loadingDividends} />
    </div>
  );
}
