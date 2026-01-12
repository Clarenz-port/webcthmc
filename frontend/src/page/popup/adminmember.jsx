import React, { useState, useEffect } from "react";
import { notify } from "../../utils/toast";
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
  const d = item?.date ?? item?.createdAt ?? item?.created_at ?? item?.paidAt ?? item?.paid_at ?? item?.created;
  const dt = d ? new Date(d) : null;
  return isNaN(dt) ? null : dt;
};

const collectYears = () => {
  const years = new Set();
  [loanHistory, purchases, bills, dividends, shareRows].forEach((arr) =>
    (arr || []).forEach((r) => { const dt = getDateFrom(r); if (dt) years.add(dt.getFullYear()); })
  );
  const arr = Array.from(years).sort((a,b)=>b-a);
  if (arr.length === 0) arr.push(new Date().getFullYear());
  setAvailableYears(arr);
  if (!arr.includes(selectedYear)) setSelectedYear(arr[0]);
};
useEffect(() => collectYears(), [loanHistory, purchases, bills, dividends, shareRows]);

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
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-4xl font-extrabold">{name}</h1>
        <button onClick={onBack} className="text-lg bg-[#7e9e6c] text-white px-4 py-2 rounded hover:bg-[#6a865a]">
          ← Back to Dashboard
        </button>
      </div>
      {/* Overview Chart */}
<div className="mb-6">
 {/* Charts Controls */}
<div className="mb-4 flex items-center gap-3">
  <label className="text-sm font-medium">View by:</label>
<select value={grouping} onChange={(e)=>setGrouping(e.target.value)} className="border px-2 py-1 rounded">
  <option value="Year">Year</option>
  <option value="Month">Month</option>
</select>

<label className="text-sm font-medium ml-3">Year:</label>
<select value={selectedYear} onChange={(e)=>setSelectedYear(Number(e.target.value))} className="border px-2 py-1 rounded">
  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
</select>

{grouping === "Month" && (
  <>
    <label className="text-sm font-medium ml-3">Month:</label>
    <select value={selectedMonth} onChange={(e)=>setSelectedMonth(Number(e.target.value))} className="border px-2 py-1 rounded">
      {monthsLabels.map((m,i)=> <option key={i} value={i+1}>{m}</option>)}
    </select>
  </>
)}
</div>

{/* Charts grid */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
  {/* Total Shares (Bar) */}
  <div className="bg-white p-4 rounded-lg border shadow-sm">
    <h4 className="font-semibold mb-2 text-[#7e9e6c]">Total Shares</h4>
    {(() => {
      const { labels, data } = aggregateCounts(shareRows, { type: "sum", amountField: "shareamount" });
      return data.reduce((a,b)=>a+b,0) === 0 ? <div className="text-gray-500">No share data</div> : (
        <div className="h-44">
        <Bar data={{ labels, datasets:[{ label:"PHP", data, backgroundColor:"#7e9e6c" }] }}
             options={{
      maintainAspectRatio: false, // keep this, but size is controlled by wrapper
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }}   />
    </div>
      );
    })()}
  </div>

  {/* Total Dividend (Bar) */}
  <div className="bg-white p-4 rounded-lg border shadow-sm">
    <h4 className="font-semibold mb-2 text-[#9a7ee6]">Total Dividend</h4>
    {(() => {
      const { labels, data } = aggregateCounts(dividends, { type: "sum", amountField: "amount" });
      return data.reduce((a,b)=>a+b,0) === 0 ? <div className="text-gray-500">No dividend data</div> : (
        <div className="h-44">
        <Bar data={{ labels, datasets:[{ label:"PHP", data, backgroundColor:"#9a7ee6" }] }}
             options={{
      maintainAspectRatio: false, // keep this, but size is controlled by wrapper
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }} />
    </div>
      );
    })()}
  </div>

  {/* Loan Count (Line) */}
  <div className="bg-white p-4 rounded-lg border shadow-sm">
    <h4 className="font-semibold mb-2 text-[#e07a7a]">Loan Count</h4>
    {(() => {
      const { labels, data } = aggregateCounts(loanHistory, { type: "count" });
      return data.reduce((a,b)=>a+b,0) === 0 ? <div className="text-gray-500">No loan data</div> : (
        <div className="h-44">
        <Line data={{ labels, datasets:[{ label: "Loans", data, borderColor:"#e07a7a", backgroundColor:"rgba(224,122,122,0.2)", tension:0.3 }] }}
              options={{
      maintainAspectRatio: false, // keep this, but size is controlled by wrapper
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }} />
      </div>
            );
    })()}
  </div>

  {/* Purchase Count (Line) */}
  <div className="bg-white p-4 rounded-lg border shadow-sm">
    <h4 className="font-semibold mb-2 text-[#6b8fd7]">Purchase Count</h4>
    {(() => {
      const { labels, data } = aggregateCounts(purchases, { type: "count" });
      return data.reduce((a,b)=>a+b,0) === 0 ? <div className="text-gray-500">No purchase data</div> : (
      <div className="h-44">  
        <Line data={{ labels, datasets:[{ label: "Purchases", data, borderColor:"#6b8fd7", backgroundColor:"rgba(107,143,215,0.2)", tension:0.3 }] }}
              options={{
      maintainAspectRatio: false, // keep this, but size is controlled by wrapper
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }} />
    </div>
      );
    })()}
  </div>

  {/* Bill Payment Count (Line) */}
  <div className="bg-white p-4 rounded-lg border shadow-sm md:col-span-2">
    <h4 className="font-semibold mb-2 text-[#f6b26b]">Bill Payments Count</h4>
    {(() => {
      const { labels, data } = aggregateCounts(bills, { type: "count" });
      return data.reduce((a,b)=>a+b,0) === 0 ? <div className="text-gray-500">No bill payment data</div> : (
        <div className="h-44">
        <Line data={{ labels, datasets:[{ label: "Bill Payments", data, borderColor:"#f6b26b", backgroundColor:"rgba(246,178,107,0.2)", tension:0.3 }] }}
              options={{
      maintainAspectRatio: false, // keep this, but size is controlled by wrapper
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }} />
    </div>
      );
    })()}
  </div>
</div>

{/* View history buttons */}
<div className="flex flex-wrap gap-3 justify-end mb-4">
  <button onClick={() => setIsLoanHistoryOpen(true)} className="px-3 py-2 border rounded text-sm">View Loan History</button>
  <button onClick={() => setIsPurchaseHistoryOpen(true)} className="px-3 py-2 border rounded text-sm">View Purchase History</button>
  <button onClick={() => setIsBillHistoryOpen(true)} className="px-3 py-2 border rounded text-sm">View Bill History</button>
  <button onClick={() => setIsShareHistoryOpen(true)} className="px-3 py-2 border rounded text-sm">View Shares History</button>
  <button onClick={() => setIsDividendHistoryOpen(true)} className="px-3 py-2 border rounded text-sm">View Dividend History</button>
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
          <div className="mt-8 text-sm text-gray-600">Loading purchases...</div>
        ) : (() => {
          const unpaid = purchases.filter((p) => String(p.status).toLowerCase() === "not paid");
          if (unpaid.length === 0) return null;
          return (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-2xl font-bold text-[#7e9e6c]">Pending Purchases (1 month to pay)</h3>
                <div className="text-sm text-gray-600">{`${unpaid.length} Purchase to pay`}</div>
              </div>

              <div className="overflow-auto border-gray-400 border rounded-lg">
                <table className="w-full text-lg">
                  <thead className="bg-[#d6ead8]">
                    <tr>
                      <th className="text-left px-3 py-4">Items</th>
                      <th className="text-right px-3 py-4">Total</th>
                      <th className="text-right px-3 py-4">Due Date</th>
                      <th className="text-center px-3 py-4">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {unpaid.map((p) => {
                      const pid = p.id ?? p._id ?? p.purchaseId;
                      return (
                        <tr key={pid} className="border-t border-gray-400">
                          <td className="px-3 py-4">{itemsSummary(p.items)}</td>
                          <td className="px-3 py-4 right-10px text-right">{fmtMoney(p.total)}</td>
                          <td className="px-3 py-4 text-right">{p.dueDate ? new Date(p.dueDate).toLocaleDateString() : "-"}</td>
                          <td className="px-3 py-4 place-items-center">
                            <div className="flex gap-2">
                              <button onClick={() => setSelectedPurchase(p)} className="px-2 py-1 border rounded text-sm">View</button>
                              <button onClick={() => payPurchase(pid)} disabled={processingPayId === pid} className="px-3 py-1 bg-[#7e9e6c] text-white rounded text-sm disabled:opacity-50">
                                {processingPayId === pid ? "Processing..." : "Pay"}
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

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-6 mt-6">
          <button onClick={() => {
            if (!loan) { notify.success("No active loan found."); return; }
            const remainBalance = parseFloat(loan.remainbalance) || 0;
            if (remainBalance <= 0) { notify.success("No active loan — this member has fully paid the loan."); return; }
            setIsPaidPopupOpen(true);
          }} className="bg-[#7e9e6c] shadow-md text-white text-xl px-12 py-5 rounded-2xl font-semibold hover:bg-[#6a865a] transition">Paid Loan</button>

          <button onClick={() => setIsPurchaseOpen(true)} className="bg-[#7e9e6c] shadow-md text-white text-xl px-12 py-5 rounded-2xl font-semibold hover:bg-[#6a865a] transition">Purchase</button>

          <button onClick={() => setIsSharePopupOpen(true)} className="bg-[#7e9e6c] shadow-md text-white text-xl px-12 py-5 rounded-2xl font-semibold hover:bg-[#6a865a] transition">Add Shares</button>

          <button onClick={() => setIsBillOpen(true)} className="bg-[#7e9e6c] shadow-md text-white text-xl px-12 py-5 rounded-2xl font-semibold hover:bg-[#6a865a] transition">Pay Bills</button>

          <button onClick={() => setIsDividendOpen(true)} className="bg-[#7e9e6c] shadow-md text-white text-xl px-12 py-5 rounded-2xl font-semibold hover:bg-[#6a865a] transition">Add Dividend</button>
        
          <button
            onClick={downloadMemberReport}
            disabled={loadingReport}
            className="bg-[#7e9e6c] shadow-md text-white text-xl px-12 py-5 rounded-2xl font-semibold hover:bg-[#6a865a] transition disabled:opacity-50"
          >
            {loadingReport ? "Generating..." : "Member Report"}
          </button>
        </div>

        {/* Purchase detail modals */}
        {selectedPurchase && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[900] p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-auto p-6">
              <div className="flex items-start justify-between mb-4"><h4 className="text-lg font-semibold">Purchase Details</h4></div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr><th className="text-left px-3 py-2">Item</th><th className="text-right px-3 py-2">Qty</th><th className="text-right px-3 py-2">Unit Price</th><th className="text-right px-3 py-2">Line Total</th></tr>
                  </thead>
                  <tbody>
                    {(selectedPurchase.items || []).map((it, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{it.name}</td>
                        <td className="px-3 py-2 text-right">{it.qty ?? 1}</td>
                        <td className="px-3 py-2 text-right">{fmtMoney(it.unitPrice)}</td>
                        <td className="px-3 py-2 text-right">{fmtMoney((it.qty ?? 1) * (it.unitPrice ?? 0))}</td>
                      </tr>
                    ))}
                    <tr className="border-t"><td colSpan={3} className="px-3 py-2 text-right font-semibold">Total</td><td className="px-3 py-2 text-right font-bold">{fmtMoney(selectedPurchase.total)}</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="text-right mt-4 text-sm text-gray-600">
                Due date: <span className="font-medium">{selectedPurchase.dueDate ? new Date(selectedPurchase.dueDate).toLocaleDateString() : "-"}</span>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedPurchase(null)} className="px-4 py-2 border rounded">Close</button>
                  <button onClick={() => payPurchase(selectedPurchase.id ?? selectedPurchase._id ?? selectedPurchase.purchaseId)} className="px-6 py-1 bg-[#7e9e6c] text-white rounded">Pay</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedPurchase1 && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[900] p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-auto p-6">
              <div className="flex items-start justify-between mb-4"><h4 className="text-lg font-semibold">Purchase Details</h4></div>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr><th className="text-left px-3 py-2">Item</th><th className="text-right px-3 py-2">Qty</th><th className="text-right px-3 py-2">Unit Price</th><th className="text-right px-3 py-2">Line Total</th></tr>
                  </thead>
                  <tbody>
                    {(selectedPurchase1.items || []).map((it, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{it.name}</td>
                        <td className="px-3 py-2 text-right">{it.qty ?? 1}</td>
                        <td className="px-3 py-2 text-right">{fmtMoney(it.unitPrice)}</td>
                        <td className="px-3 py-2 text-right">{fmtMoney((it.qty ?? 1) * (it.unitPrice ?? 0))}</td>
                      </tr>
                    ))}
                    <tr className="border-t"><td colSpan={3} className="px-3 py-2 text-right font-semibold">Total</td><td className="px-3 py-2 text-right font-bold">{fmtMoney(selectedPurchase1.total)}</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="text-right mt-4 text-sm text-gray-600">
                Due date: <span className="font-medium">{selectedPurchase1.dueDate ? new Date(selectedPurchase1.dueDate).toLocaleDateString() : "-"}</span>
                <div className="flex gap-2"><button onClick={() => setSelectedPurchase1(null)} className="px-4 py-2 border rounded">Close</button></div>
              </div>
            </div>
          </div>
        )}

        {/* Purchase history modal */}
        {isPurchaseHistoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pt-12 px-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsPurchaseHistoryOpen(false)} />
            <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-auto p-6 z-60">
              <div className="flex items-center justify-between mb-4"><h3 className="text-2xl font-bold text-[#7e9e6c]">Purchase History</h3></div>
              <div className="overflow-auto shadow-md border-gray-400 border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-[#d6ead8]">
                    <tr><th className="text-left px-3 py-3">Date</th><th className="text-left px-3 py-3">Items</th><th className="text-right px-3 py-3">Total</th><th className="text-right px-3 py-3">Due Date</th><th className="text-center px-3 py-3">Status</th><th className="text-center px-3 py-3">Actions</th></tr>
                  </thead>
                  <tbody>
                    {purchases.length === 0 ? (
                      <tr><td colSpan={6} className="px-3 py-4 text-center text-gray-600">No purchases found for this member.</td></tr>
                    ) : (
                      purchases.map((p) => {
                        const pid = p.id ?? p._id ?? p.purchaseId;
                        return (
                          <tr key={pid} className="border-t border-gray-400">
                            <td className="px-3 py-3">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "-"}</td>
                            <td className="px-3 py-3">{itemsSummary(p.items)}</td>
                            <td className="px-3 py-3 text-right">{fmtMoney(p.total)}</td>
                            <td className="px-3 py-3 text-right">{p.dueDate ? new Date(p.dueDate).toLocaleDateString() : "-"}</td>
                            <td className="px-3 py-3 text-center">{String(p.status).charAt(0).toUpperCase() + String(p.status).slice(1)}</td>
                            <td className="px-3 py-3 text-center"><div className="flex items-center justify-center gap-2"><button onClick={() => setSelectedPurchase1(p)} className="px-2 py-1 border-gray-400 shadow-lg border rounded text-sm">View</button></div></td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end gap-2"><button className="bg-[#b8d8ba] text-white px-6 py-2 rounded-lg hover:bg-[#8fa182]" onClick={() => setIsPurchaseHistoryOpen(false)}>Close</button></div>
            </div>
          </div>
        )}

        {/* Bill history modal */}
        {isBillHistoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pt-12 px-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsBillHistoryOpen(false)} />
            <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-auto p-6 z-60">
              <div className="flex items-center justify-between mb-4"><h3 className="text-2xl font-bold text-[#7e9e6c]">Bill History</h3></div>
              <div className="overflow-auto shadow-md border-gray-400 border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-[#d6ead8]"><tr><th className="text-left px-3 py-3">Date</th><th className="text-left px-3 py-3">Bill</th><th className="text-right px-3 py-3">Amount</th><th className="text-center px-3 py-3">Method</th></tr></thead>
                  <tbody>
                    {bills.length === 0 ? <tr><td colSpan={4} className="px-3 py-4 text-center text-gray-600">No bill payments found.</td></tr> : bills.map((b) => (
                      <tr key={b.id ?? b._id} className="border-t border-gray-400"><td className="px-3 py-3">{b.date ? new Date(b.date).toLocaleDateString() : "-"}</td><td className="px-3 py-3">{b.billName}</td><td className="px-3 py-3 text-right">{fmtMoney(b.amount)}</td><td className="px-3 py-3 text-center">{b.paymentMethod}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end gap-2"><button className="bg-[#b8d8ba] text-white px-6 py-2 rounded-lg hover:bg-[#8fa182]" onClick={() => setIsBillHistoryOpen(false)}>Close</button></div>
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
