import React, { useState, useEffect } from "react";
import { notify } from "../../utils/toast";
import { 
  FiArrowLeft, FiFilter, FiTrendingUp, FiPieChart, 
  FiCreditCard, FiShoppingBag, FiActivity, FiExternalLink, FiCalendar 
} from "react-icons/fi";
import { 
  FiShoppingCart, FiFileText, 
  FiPrinter, FiClock, FiAlertCircle, 
  FiX, FiCheckCircle, FiPackage, FiEye 
} from "react-icons/fi";
import { FiTag,  } from "react-icons/fi";
import PaidLoanPopup from "./adminmem/paidloan.jsx";
import AddSharesPopup from "../popup/AddSharesPopup.jsx";
import AddPurchasePopup from "../popup/AddPurchasePopup.jsx";
import AddBillPaymentPopup from "../popup/AddBillPaymentPopup.jsx";
import LoanApplication from "../popup/Loanappli.jsx";
import Sharehistory from "../popup/Sharehistory.jsx";
import AddDividendPopup from "../popup/AddDividendPopup.jsx";
import AddDividendHistoryPopup from "../popup/AddDividendHistoryPopup.jsx";
import axios from "axios";
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

  const [purchases, setPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [selectedPurchase1, setSelectedPurchase1] = useState(null);
  const [processingPayId, setProcessingPayId] = useState(null);

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

const downloadMemberReport = async () => {
  setLoadingReport(true);
  try {
    const token = localStorage.getItem("token");
    const body = { reportType: "member_ledger", period: "all", memberId: member.id };
    const res = await axios.post("/api/reports/generate", body, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = `member-ledger-${member.id}-${Date.now()}.pdf`;
    link.click();
  } catch (err) {
    notify.success("Failed to generate member report");
    console.error(err);
  } finally {
    setLoadingReport(false);
  }
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

  useEffect(() => {
  if (!openAction) return;
  if (openAction === "paidLoan") setIsPaidPopupOpen(true);
  if (openAction === "purchase") setIsPurchaseOpen(true);
  if (openAction === "addShares") setIsSharePopupOpen(true);
  if (openAction === "payBills") setIsBillOpen(true);
}, [openAction]);

  const loan = loanHistory[0];
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
      const res = await axios.get(`/api/shares/member/${encodeURIComponent(member.id)}`, {
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
      const res = await axios.get(`/api/purchases/member/${id}`, {
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
      const res = await axios.get(`/api/bills/member/${id}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });

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
      const res = await axios.get(`/api/dividends/member/${id}`, {
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
        const res = await axios.get(`/api/loans/member/${encodeURIComponent(member.id)}`, {
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
        const res = await axios.get(`/api/loans/member/${encodeURIComponent(member.id)}/loan-count`, {
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
      const res = await axios.post("/api/shares/add", payload, {
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
      const res = await axios.post(`/api/purchases/${purchaseId}/pay`, {}, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
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
          <h4 className="font-bold text-gray-800">Total Shares</h4>
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
        { label: "Shares History", onClick: () => setIsShareHistoryOpen(true) },
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
    </div>
  </div>

        <h2 className="text-2xl font-bold mt-6 mb-3 text-[#7e9e6c]">Loan History</h2>
{loading ? (
  <p className="text-gray-600 text-lg mb-6">Loading loan history...</p>
) : loanHistory.length > 0 ? (
  <div className="overflow-auto border-gray-400 border rounded-lg">
    <table className="w-full text-lg text-left">
      <thead className="bg-[#d6ead8]">
        <tr>
          <th className="px-3 py-4">Purpose</th>
          <th className="px-3 py-4">Amount</th>
          <th className="px-3 py-4">Months</th>
          <th className="px-3 py-4">Paid (count)</th>
          <th className="px-3 py-4">Status</th>
          <th className="px-3 py-4">Balance</th>
        </tr>
      </thead>
      <tbody>
        {loanHistory.map((l) => (
          <tr key={l.id || Math.random()} className="border-t border-gray-400">
            <td className="px-3 py-4">{l.purpose || "N/A"}</td>
            <td className="px-3 py-4">{fmtMoney(l.loanAmount)}</td>
            <td className="px-3 py-4">{l.duration ?? "0"}</td>
            <td className="px-3 py-4">{l.paymentsMade ?? "0"}</td>
            <td className="px-3 py-4">{l.status ?? "N/A"}</td>
            <td className="px-3 py-4">{fmtMoney(l.remainbalance ?? l.balance ?? 0)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
) : (
  <p className="text-gray-600 text-lg mb-6">No loan history available.</p>
)}

        {/* Pending purchases UI (same as previous) */}
       {loadingPurchases ? (
        <div className="mt-8 flex items-center justify-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#7e9e6c] mr-3"></div>
          <span className="text-sm text-gray-500 font-medium">Syncing purchase data...</span>
        </div>
      ) : (() => {
        const unpaid = purchases.filter((p) => String(p.status).toLowerCase() === "not paid");
        if (unpaid.length === 0) return null;
        
        return (
          <div className="mt-8 bg-white border border-red-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-red-50/50 px-6 py-4 border-b border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                  <FiAlertCircle size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Pending Payments</h3>
                  <p className="text-xs text-red-500 font-medium">Action Required</p>
                </div>
              </div>
              <span className="bg-white border border-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                {unpaid.length} Unpaid
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold uppercase tracking-wider text-xs">Items</th>
                    <th className="text-right px-6 py-3 font-semibold uppercase tracking-wider text-xs">Total</th>
                    <th className="text-right px-6 py-3 font-semibold uppercase tracking-wider text-xs">Due Date</th>
                    <th className="text-center px-6 py-3 font-semibold uppercase tracking-wider text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {unpaid.map((p) => {
                    const pid = p.id ?? p._id ?? p.purchaseId;
                    return (
                      <tr key={pid} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-700">{itemsSummary(p.items)}</div>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-[#7e9e6c]">
                          {fmtMoney(p.total)}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-500">
                          {p.dueDate ? (
                            <div className="flex items-center justify-end gap-1 text-orange-600 bg-orange-50 px-2 py-1 rounded-md inline-flex">
                              <FiClock size={12} />
                              <span className="text-xs font-bold">{new Date(p.dueDate).toLocaleDateString()}</span>
                            </div>
                          ) : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => setSelectedPurchase(p)} 
                              className="p-2 text-gray-400 hover:text-[#7e9e6c] hover:bg-white border border-transparent hover:border-gray-200 rounded-lg transition-all"
                              title="View Details"
                            >
                              <FiEye size={18} />
                            </button>
                            <button 
                              onClick={() => payPurchase(pid)} 
                              disabled={processingPayId === pid} 
                              className="px-4 py-1.5 bg-[#7e9e6c] hover:bg-[#6a865a] text-white rounded-lg text-xs font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                            >
                              {processingPayId === pid ? "Processing..." : (
                                <>
                                  <FiCreditCard /> Pay Now
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* --- ACTION BUTTONS GRID --- */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mt-8">
        {[
          { label: "Paid Loan", icon: <FiCreditCard size={24} />, action: () => {
              if (!loan) { notify.success("No active loan found."); return; }
              const remainBalance = parseFloat(loan.remainbalance) || 0;
              if (remainBalance <= 0) { notify.success("No active loan — this member has fully paid the loan."); return; }
              setIsPaidPopupOpen(true);
            } 
          },
          { label: "Purchase", icon: <FiShoppingCart size={24} />, action: () => setIsPurchaseOpen(true) },
          { label: "Add Shares", icon: <FiPieChart size={24} />, action: () => setIsSharePopupOpen(true) },
          { label: "Pay Bills", icon: <FiFileText size={24} />, action: () => setIsBillOpen(true) },
          { label: "Add Dividend", icon: <FiTrendingUp size={24} />, action: () => setIsDividendOpen(true) },
          { label: "Member Report", icon: <FiPrinter size={24} />, action: downloadMemberReport, disabled: loadingReport, loadingText: "Generating..." }
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
                   <span>Due: {selectedPurchase1.dueDate ? new Date(selectedPurchase1.dueDate).toLocaleDateString() : "-"}</span>
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
                <div className="p-2.5 bg-[#d6ead8] text-[#7e9e6c] rounded-xl">
                  <FiPackage size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Purchase History</h2> 
                </div>
              </div><div className="h-1 w-20 bg-[#7e9e6c] rounded-full"></div>
            </div>

            {/* LIST CONTENT */}
            <div className="flex-1 overflow-auto p-6 bg-white">
              {purchases.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mb-4">
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
                        <th className="text-left px-4 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Date</th>
                        <th className="text-left px-4 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Items</th>
                        <th className="text-right px-4 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Total</th>
                        <th className="text-right px-4 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Due Date</th>
                        <th className="text-center px-4 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                        <th className="text-center px-4 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {purchases.map((p) => {
                        const pid = p.id ?? p._id ?? p.purchaseId;
                        const statusStr = String(p.status).toLowerCase();
                        
                        return (
                          <tr key={pid} className="group hover:bg-[#d6ead8]/10 transition-colors">
                            <td className="px-4 py-4 text-gray-600 font-medium whitespace-nowrap">
                              {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "-"}
                            </td>
                            <td className="px-4 py-4">
                              <p className="text-gray-800 font-semibold line-clamp-1 max-w-[200px]">
                                {itemsSummary(p.items)}
                              </p>
                            </td>
                            <td className="px-4 py-4 text-right font-bold text-[#7e9e6c]">
                              {fmtMoney(p.total)}
                            </td>
                            <td className="px-4 py-4 text-right text-gray-500 italic">
                              {p.dueDate ? new Date(p.dueDate).toLocaleDateString() : "-"}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                statusStr === 'paid' ? 'bg-green-100 text-green-700' :
                                statusStr.includes('not') ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {statusStr}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <button
                                onClick={() => setSelectedPurchase1(p)}
                                className="p-2 text-gray-400 hover:text-[#7e9e6c] hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-gray-100 transition-all"
                                title="View Details"
                              >
                                <FiEye size={18} />
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
            
            {/* FOOTER */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={onBack}
                className="bg-[#b8d8ba] text-white px-6 py-2 rounded-lg hover:bg-[#8fa182] hover:shadow-lg transition-all active:scale-95"
              >
                Close
              </button>
            </div>
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
        <div className="p-2.5 bg-[#d6ead8] text-[#7e9e6c] rounded-xl shadow-sm">
          {/* Ensure FiFileText is imported from 'react-icons/fi' */}
          <FiFileText size={22} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Bills History</h3>
        </div>
      </div>
      <div className="h-1 w-20 bg-[#7e9e6c] rounded-full hidden sm:block"></div>
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
                    {b.date ? new Date(b.date).toLocaleDateString() : "-"}
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

    {/* MODAL FOOTER */}
    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end items-center shrink-0">
      <button
        onClick={() => setIsBillHistoryOpen(false)}
        className="bg-[#b8d8ba] text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-[#8fa182] hover:shadow-lg transition-all active:scale-95 text-sm"
      >
        Close
      </button>
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

      {isLoanHistoryOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center pt-12 px-4">
    <div className="absolute inset-0 bg-black/50" onClick={() => setIsLoanHistoryOpen(false)} />
    <div className="relative w-full max-w-4xl z-60">
      <LoanApplication
        onBack={() => setIsLoanHistoryOpen(false)}
        memberId={member.id}
        memberName={name}
        onLoanUpdated={(updatedLoan) => {
          // keep the displayed loanHistory in sync when a loan is updated from LoanApplication
          setLoanHistory((prev) => (prev || []).map((l) => (l.id === updatedLoan.id ? { ...l, ...updatedLoan } : l)));
        }}
      />
    </div>
  </div>
)}

      {isPaidPopupOpen && (
        <PaidLoanPopup
          isOpen={isPaidPopupOpen}
          onClose={() => setIsPaidPopupOpen(false)}
          member={{ ...member, loan: loanHistory[0] }}
          onUpdateLoan={(updatedLoan) => { setLoanHistory([updatedLoan]); setIsPaidPopupOpen(false); }}
        />
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
