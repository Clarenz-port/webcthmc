// src/page/Member.jsx
import { notify } from "../utils/toast";
import { FiPhone, FiMail, FiCalendar, FiMapPin, FiDollarSign, FiTrendingUp, FiTarget, FiLayers, FiZap,FiInfo } from "react-icons/fi";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaHistory,
  FaFileInvoiceDollar,
  FaMoneyCheckAlt,
  FaPlusCircle,
  FaMoneyBillWave,
  FaUserCircle,
  FaCreditCard,
  FaRegCalendarAlt,
  FaTimes,
  FaArrowRight
} from "react-icons/fa";


import Wallet from "../design/wallet.png";
import ShareHistoryPopup from "../page/popup/Sharehistory.jsx";
import DividendHistoryPopup from "../page/popup/Dividendhistory.jsx";
import LoanApplication from "../page/popup/Loanappli.jsx";
import Loannow from "../page/popup/loannow/LoanNow.jsx";
import PurchaseHistory from "../page/popup/Purchasehis.jsx";
import BillHistory from "../page/popup/billshis.jsx";
import LoanHistory from "../page/popup/loanhis.jsx";

export default function Member() {
  const navigate = useNavigate();

  // UI states
  const [isSharePopupOpen, setIsSharePopupOpen] = useState(false);
  const [isDivPopupOpen, setIsDivPopupOpen] = useState(false);
  const [isLoanNowOpen, setIsLoanNowOpen] = useState(false);
  const [isPaymentPopupOpen, setIsPaymentPopupOpen] = useState(false);

  const [showLoanApplication, setShowLoanApplication] = useState(false);
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
  const [showBillHistory, setShowBillHistory] = useState(false);
  const [showLoanHistory, setShowLoanHistory] = useState(false);

  // data states
  const [user, setUser] = useState(null);
  const [hasActiveLoan, setHasActiveLoan] = useState(false);
  const [activeLoan, setActiveLoan] = useState(null);

  // shares
  const [memberSharesTotal, setMemberSharesTotal] = useState(0);
  const [loadingShares, setLoadingShares] = useState(true);
  const [shareHistoryRows, setShareHistoryRows] = useState([]);
  const [loadingShareHistory, setLoadingShareHistory] = useState(false);

  // bills for member (new)
  const [billsRows, setBillsRows] = useState([]);
  const [loadingBills, setLoadingBills] = useState(false);

  // purchases for member (added)
  const [purchasesRows, setPurchasesRows] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);

  // dividends for member (added)
  const [dividendsRows, setDividendsRows] = useState([]);
  const [loadingDividends, setLoadingDividends] = useState(false);

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><rect fill='%23e5e7eb' width='100%' height='100%' rx='16' ry='16'/><text x='50%' y='50%' font-size='18' text-anchor='middle' fill='%237e9e6c' dy='.35em'>Avatar</text></svg>`;
  const DEFAULT_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  const formatMoney = (val) => {
    if (val === null || val === undefined || val === "") return "0.00";
    const n = Number(val);
    if (Number.isNaN(n)) return String(val);
    return n.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getAvatarSrc = (u) => {
    if (!u) return DEFAULT_AVATAR;
    const avatarUrl = u.avatarUrl ?? u.avatar ?? null;
    if (!avatarUrl) return DEFAULT_AVATAR;
    if (avatarUrl.startsWith("http")) return avatarUrl;
    const rel = avatarUrl.startsWith("/") ? avatarUrl : `/${avatarUrl}`;
    return `http://localhost:8000${rel}`;
  };

  // fetch profile
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    axios
      .get("http://localhost:8000/api/members/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const payload = res.data?.member ?? res.data;
        setUser(payload);
      })
      .catch(() => navigate("/login"));
  }, [navigate]);

  // fetch loans (active loan detection)
  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const response = await axios.get("http://localhost:8000/api/loans/members", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const records = Array.isArray(response.data) ? response.data : [];
        const active = records.find((loan) =>
          ["Approved", "Pending", "Active"].includes(loan.status)
        );
        setHasActiveLoan(!!active);
        setActiveLoan(active || null);
      } catch (err) {
        console.error("Error checking loan status:", err);
      }
    };
    fetchLoans();
  }, []);

  // compute amount to pay (kept your logic)
  const [paidAmount, setPaidAmount] = useState("0.00");
  useEffect(() => {
    if (!activeLoan) {
      setPaidAmount("0.00");
      return;
    }

    const get = (obj, ...keys) => {
      for (const k of keys) {
        if (obj == null) break;
        if (obj[k] !== undefined) return obj[k];
      }
      return undefined;
    };

    const monthlyRate = 0.02;
    const duration = parseInt(get(activeLoan, "duration", "loan_duration"), 10) || 1;
    const principal = parseFloat(get(activeLoan, "loanAmount", "loan_amount", "amount")) || 0;
    const remainBalance = parseFloat(
      get(activeLoan, "remainbalance", "remain_balance", "remainBalance", "loanball")
    ) || 0;
    const loanball = parseFloat(get(activeLoan, "loanball", "loan_ball")) || 0;
    const paymentsMade =
      parseInt(get(activeLoan, "paymentsMade", "payments_made", "paidInstallments"), 10) || 0;

    const remainingPayments = Math.max(duration - paymentsMade, 0);
    const principalPayment = duration > 0 ? principal / duration : principal;
    const interest =
      remainingPayments === duration ? principal * monthlyRate : (loanball || remainBalance) * monthlyRate;
    const amortization = principalPayment + interest;

    const amountToPay =
      remainingPayments === 1
        ? (remainBalance || loanball || 0).toFixed(2)
        : amortization.toFixed(2);

    setPaidAmount(formatMoney(amountToPay));
  }, [activeLoan]);

  // fetch shares total
  const fetchMemberSharesTotal = async (memberId) => {
    setLoadingShares(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:8000/api/shares/member/${memberId}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const rows = Array.isArray(res.data) ? res.data : [];
      const sum = rows.reduce((acc, r) => {
        const v = Number(r.shareamount ?? r.shareAmount ?? r.amount ?? 0);
        return acc + (Number.isNaN(v) ? 0 : v);
      }, 0);
      setMemberSharesTotal(sum);
    } catch (err) {
      console.error("Failed to fetch member shares total:", err?.response?.data || err);
      setMemberSharesTotal(0);
    } finally {
      setLoadingShares(false);
    }
  };

  // fetch share history
  const fetchShareHistory = async (memberId) => {
    setLoadingShareHistory(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:8000/api/shares/member/${memberId}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const rows = Array.isArray(res.data) ? res.data : [];
      setShareHistoryRows(rows);
    } catch (err) {
      console.error("Failed to fetch share history:", err?.response?.data || err);
      setShareHistoryRows([]);
    } finally {
      setLoadingShareHistory(false);
    }
  };

  // when user loads, fetch shares
  useEffect(() => {
    if (!user?.id && !user?.userId && !user?.memberId) return;
    const memberId = user.id ?? user.userId ?? user.memberId;
    fetchMemberSharesTotal(memberId);
  }, [user]);

  // open share history
  const handleOpenShareHistory = async () => {
    if (!user) return;
    const memberId = user.id ?? user.userId ?? user.memberId;
    await fetchShareHistory(memberId);
    setIsSharePopupOpen(true);
  };

  // open bill history for current member (fetch then open)
  const handleOpenBillHistory = async () => {
    if (!user) return;
    const memberId = user.id ?? user.userId ?? user.memberId;
    setLoadingBills(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        notify.success("You must be logged in.");
        return;
      }
      const res = await axios.get(`http://localhost:8000/api/bills/member/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: null,
      });
      const raw = Array.isArray(res.data) ? res.data : res.data?.bills ?? res.data ?? [];
      // normalization: keep as array of objects
      const normalized = Array.isArray(raw) ? raw : [];
      setBillsRows(normalized);
      setShowBillHistory(true);
    } catch (err) {
      console.error("Failed to fetch bills for member:", err?.response?.data || err);
      setBillsRows([]);
      setShowBillHistory(true);
    } finally {
      setLoadingBills(false);
    }
  };

  // open purchase history for current member (fetch then open)
  const handleOpenPurchaseHistory = async () => {
    if (!user) return;
    const memberId = user.id ?? user.userId ?? user.memberId;
    setLoadingPurchases(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        notify.success("You must be logged in.");
        return;
      }
      const res = await axios.get(`/api/purchases/member/${encodeURIComponent(memberId)}`, {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: null,
      });

      // normalize response: array or { purchases: [...] }
      const raw = Array.isArray(res.data) ? res.data : res.data?.purchases ?? res.data ?? [];
      let rows = Array.isArray(raw) ? raw : [];

      // basic normalization for items/fields to keep PurchaseHistory component stable
      rows = rows.map((p) => {
        let items = p.items ?? p.item ?? p.lines ?? [];
        if (typeof items === "string") {
          try {
            const parsed = JSON.parse(items);
            items = Array.isArray(parsed) ? parsed : [];
          } catch {
            items = [];
          }
        }
        if (!Array.isArray(items) && items && typeof items === "object") {
          const maybeArray = Object.keys(items)
            .sort()
            .map((k) => items[k])
            .filter((v) => v != null);
          items = Array.isArray(maybeArray) ? maybeArray : [];
        }
        return {
          ...p,
          id: p.id ?? p._id ?? p.purchaseId,
          items,
          total: Number(p.total ?? p.totalAmount ?? p.totalComputed ?? 0),
          createdAt: p.createdAt ?? p.created_at,
          dueDate: p.dueDate ?? null,
          status: p.status ?? p.paymentStatus ?? "unknown",
        };
      });

      setPurchasesRows(rows);
      setShowPurchaseHistory(true);
    } catch (err) {
      console.error("Failed to fetch purchases for member:", err?.response?.data || err);
      setPurchasesRows([]);
      setShowPurchaseHistory(true);
    } finally {
      setLoadingPurchases(false);
    }
  };

  // open dividend history for current member (fetch then open)
  const handleOpenDividendHistory = async () => {
    if (!user) return;
    const memberId = user.id ?? user.userId ?? user.memberId;
    setLoadingDividends(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        notify.success("You must be logged in.");
        return;
      }

      const res = await axios.get(`/api/dividends/member/${encodeURIComponent(memberId)}`, {
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: null,
      });

      const raw = Array.isArray(res.data) ? res.data : res.data?.dividends ?? res.data ?? [];
      let rows = Array.isArray(raw) ? raw : [];

      rows = rows.map((d) => ({
        ...d,
        id: d.id ?? d._id ?? d.dividendId,
        amount: Number(d.amount ?? d.dividend ?? 0),
        date: d.date ?? d.createdAt ?? d.created_at ?? null,
        note: d.note ?? d.remarks ?? "",
        memberId: d.memberId ?? d.userId ?? d.member ?? memberId,
      }));

      setDividendsRows(rows);
      setIsDivPopupOpen(true);
    } catch (err) {
      console.error("Failed to fetch dividends for member:", err?.response?.data || err);
      setDividendsRows([]);
      setIsDivPopupOpen(true);
    } finally {
      setLoadingDividends(false);
    }
  };

  const handleLoanNowClick = () => {
    if (hasActiveLoan) {
      notify.success("⚠️ You cannot apply for a new loan until your approved loan is fully paid or closed.");
      return;
    }
    setIsLoanNowOpen(true);
  };

  // small reusable UI pieces
  const Card = ({ children, className = "" }) => (
    <div className={`bg-white shadow-sm border border-gray-200 p-5 h-full ${className}`}>{children}</div>
  );

  // close modal on Escape
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        if (showLoanApplication) setShowLoanApplication(false);
        if (isLoanNowOpen) setIsLoanNowOpen(false);
        if (isSharePopupOpen) setIsSharePopupOpen(false);
        if (isDivPopupOpen) setIsDivPopupOpen(false);
        if (isPaymentPopupOpen) setIsPaymentPopupOpen(false);
        if (showPurchaseHistory) setShowPurchaseHistory(false);
        if (showBillHistory) setShowBillHistory(false);
        if (showLoanHistory) setShowLoanHistory(false);
      }
    },
    [
      showLoanApplication,
      isLoanNowOpen,
      isSharePopupOpen,
      isDivPopupOpen,
      isPaymentPopupOpen,
      showPurchaseHistory,
      showBillHistory,
      showLoanHistory,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="min-h-screen pr-2 bg-[#f3f3f3] font-sans pt-4">
      <div className="pt-20 mx-auto space-y-5">
        {/* Top responsive layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-6 items-stretch auto-rows-fr">
          {/* PROFILE CARD */}
          <Card className="overflow-hidden border-none rounded-2xl shadow-lg bg-white col-span-2">
  {!user ? (
    /* Skeleton Loading State */
    <div className="animate-pulse w-full">
      <div className="h-24 bg-gray-100 w-full" />
      <div className="p-6 -mt-12 flex flex-col items-center">
        <div className="h-32 w-32 rounded-full bg-gray-200 border-4 border-white" />
        <div className="h-6 bg-gray-200 rounded w-1/2 mt-4" />
        <div className="h-4 bg-gray-200 rounded w-1/3 mt-2" />
        <div className="w-full mt-8 space-y-3">
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-full" />
        </div>
      </div>
    </div>
  ) : (
    <>
      {/* Top Decorative Banner */}
      <div className="h-24 bg-green-700 w-full" />

      <div className="px-2 pb-8 -mt-16 flex flex-col items-center">
        {/* Profile Image */}
        <div className="relative">
          <img
            src={getAvatarSrc(user)}
            alt={`${user.firstName ?? ""} ${user.lastName ?? ""}`}
            className="w-32 h-32 rounded-full border-4 border-white shadow-md object-cover"
          />
        </div>

        {/* Name & Join Date */}
        <div className="text-center mt-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {user.firstName} {user.lastName}
          </h2>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-1">
            Member since{" "}
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                })
              : "—"}
          </p>
        </div>

        {/* Info Sections */}
        <div className="w-full mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Contact Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-green-700 uppercase tracking-widest border-b pb-1">
              Contact Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-center text-gray-600 gap-3">
                <FiPhone className="text-green-700  shrink-0" />
                <span className="text-sm">{user.phoneNumber || "No phone provided"}</span>
              </div>
              <div className="flex items-center text-gray-600 gap-3">
                <FiMail className="text-green-700  shrink-0" />
                <span className="text-sm truncate">{user.email || "No email provided"}</span>
              </div>
              <div className="flex items-center text-gray-600 gap-3">
                <FiCalendar className="text-green-700  shrink-0" />
                <span className="text-sm">{user.birthdate || "Birthdate not set"}</span>
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-green-700  uppercase tracking-widest border-b pb-1">
              Location
            </h3>
            <div className="flex items-start text-gray-600 gap-3 pt-1">
              <FiMapPin className="text-green-700  mt-0.5 shrink-0" />
              <p className="text-sm leading-relaxed">
                {user.address ? (
                  <span>{user.address}</span>
                ) : (
                  "No address on file"
                )}
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  )}
</Card>

          {/* SHARES CARD */}
          <Card className="col-span-3 overflow-hidden rounded-2xl border-none shadow-lg bg-white">
  <div className="flex flex-col md:flex-row items-stretch min-h-[350px]">
    
    {/* Left Content Section */}
    <div className="flex-1 p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-2xl font-bold text-gray-800">Shares</h3>
        </div>
        <p className="text-sm text-gray-500">Manage your investment overview and history</p>
      </div>

      {/* Balance Display */}
      <div className="mt-8 mb-8 relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-green-100 to-[#d6ead8] rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative bg-[#f0f9f1] border border-green-100 p-6 rounded-xl shadow-sm">
          <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Your Total Shares</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-green-800">₱</span>
            <span className="text-4xl font-black text-green-900 tracking-tight">
              {loadingShares ? "..." : formatMoney(memberSharesTotal)}
            </span>
          </div>
          {loadingShares && (
            <div className="h-1 w-24 bg-green-200 animate-pulse rounded-full mt-2" />
          )}
        </div>
      </div>

      {/* Action Button */}
      <div>
        <button
          onClick={handleOpenShareHistory}
          className="group inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-white border-2 border-green-600 text-green-700 font-bold shadow-sm transition-all hover:bg-green-600 hover:text-white active:scale-95"
        >
          <FaHistory className="group-hover:rotate-[-45deg] transition-transform" />
          View History
          <FaArrowRight className="text-sm opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
        </button>
      </div>
    </div>

    {/* Right Illustration Section */}
    <div className="flex-1  flex items-center justify-center p-8 relative">
      {/* Decorative Circle Background */}
      <div className="absolute w-64 h-64 bg-white/50 rounded-full blur-3xl" />
      
      <img 
        src={Wallet} 
        alt="Wallet" 
        className="w-72 h-72 object-contain relative z-10 drop-shadow-2xl animate-float" 
        style={{ 
          filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.1))' 
        }}
      />
    </div>
  </div>
</Card>
          {/* ACTIONS CARD */}
          <Card className="flex col-span-3 flex-col rounded-2xl shadow-lg justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-gray-700">Quick Actions</h3>
              <p className="text-md text-gray-500 mb-7">Apply for loans or view payment history</p>

              <div className="space-y-3">
                <button
                  onClick={() => { setIsPaymentPopupOpen(false); handleOpenDividendHistory(); }}
                  className="w-full inline-flex items-center justify-center group gap-3 px-6 py-3 rounded-xl bg-white border-2 border-green-600 text-green-700 font-bold shadow-sm transition-all hover:bg-green-600 hover:text-white active:scale-95"
                >
                  <FaFileInvoiceDollar className="group-hover:rotate-[-360deg] transition-transform"/> Dividend History
                  <FaArrowRight className="text-sm opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </button>

                <button
                  onClick={() => setIsPaymentPopupOpen(true)}
                  className="w-full inline-flex items-center justify-center group gap-3 px-6 py-3 rounded-xl bg-white border-2 border-green-600 text-green-700 font-bold shadow-sm transition-all hover:bg-green-600 hover:text-white active:scale-95"
                >
                  <FaMoneyBillWave className="group-hover:rotate-[-180deg] transition-transform"/> Payment History
                  <FaArrowRight className="text-sm opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </button>

                <button
                  onClick={handleLoanNowClick}
                  disabled={hasActiveLoan}
                  className={`w-full inline-flex items-center justify-center group gap-3 px-6 py-3 rounded-xl border-2 font-bold shadow-sm ${
                    hasActiveLoan
                      ? "bg-gray-300 text-white border-gray-300 cursor-not-allowed"
                      : "bg-green-700 text-white hover:bg-green-600 transition-all active:scale-95"
                  }`}
                >
                  {hasActiveLoan ? <FaCreditCard/> :  <FaCreditCard className="group-hover:rotate-[-360deg] transition-transform"/>} 
                  {hasActiveLoan ? "Active Loan Exists" : "Loan Now"}
                 {hasActiveLoan ? "" : <FaArrowRight className="text-sm opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />} 
                </button>
              </div>
            </div>

            <div className="mt-6 w-full bg-gray-50 p-6 rounded-md border border-green-700">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center p-3 rounded-full bg-green-100 text-green-800">
                  <FaRegCalendarAlt />
                </span>
                <div>
                  <div className="text-xs font-medium text-gray-600">Active Loan</div>
                  <div className="text-sm font-bold">
                    {activeLoan ? activeLoan.status : "No active loan"}
                  </div>
                  {activeLoan && (
                    <div className="text-xs font-medium text-gray-500 mt-1">
                      Next payment:{" "}
                      {activeLoan.dueDate ??
                        activeLoan.nextPaymentDate ??
                        activeLoan.next_payment_date ??
                        "—"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* SECOND ROW: Loans detail + breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch auto-rows-fr">
         <Card className="flex flex-col bg-white border border-gray-100 shadow-lg rounded-2xl overflow-hidden">
  <div>
    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
      Loan Summary
    </h3>
  </div>

  <div className="p-2">
    {activeLoan ? (
      <div className="space-y-4">
        {/* Hero: Total Loan Amount */}
        <div className="bg-gradient-to-br from-[#7e9e6c]/10 to-transparent p-4 rounded-xl border border-[#7e9e6c]/20">
          <div className="text-[10px] font-bold text-[#7e9e6c] uppercase tracking-widest mb-1">
            Total Loan Principal
          </div>
          <div className="text-3xl font-black text-gray-900 flex items-center">
            <span className="text-xl mr-0.5">₱</span>
            {formatMoney(activeLoan.loanAmount ?? activeLoan.loan_amount ?? activeLoan.amount ?? 0)}
          </div>
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-1 gap-5">
          {/* Current Installment */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mt-1">
              <FiDollarSign size={18} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-tighter">To Pay (This Installment)</p>
              <p className="text-lg font-bold text-gray-800">₱{paidAmount}</p>
            </div>
          </div>

          {/* Due Date */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-50 rounded-lg text-orange-600 mt-1">
              <FiCalendar size={18} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-tighter">Next Due Date</p>
              <p className="text-sm font-semibold text-gray-700">
                {activeLoan.dueDate ??
                  activeLoan.nextPaymentDate ??
                  activeLoan.next_payment_date ??
                  "No Due Date"}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loan Status</span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${
                  activeLoan.status === "Approved" 
                    ? "bg-green-50 text-green-700 ring-green-600/20" 
                    : "bg-yellow-50 text-yellow-700 ring-yellow-600/20"
                }`}
              >
                <FaUserCircle className="text-sm" /> 
                {activeLoan.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    ) : (
      /* Empty State */
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <FiInfo className="text-gray-300 w-8 h-8" />
        </div>
        <h4 className="text-gray-800 font-semibold mb-1">No Active Loans</h4>
        <p className="text-sm text-gray-500 max-w-[200px] leading-relaxed">
          You currently have no existing loan records. Use <span className="text-green-700 font-bold"><button
                  onClick={handleLoanNowClick}
                  className="cursor-pointer"
                >
                "loan now"</button></span> to apply.
        </p>
      </div>
    )}
  </div>
</Card>

          <Card className="col-span-3 p-6 bg-white shadow-lg border border-gray-100 rounded-2xl">
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
    <div>
      <h3 className="text-xl font-bold text-gray-800">Loans Breakdown</h3>
      <p className="text-sm text-gray-500">Available loan tiers and interest rates</p>
    </div>
    
    <button
      onClick={() => setShowLoanApplication(true)}
      className=" inline-flex items-center justify-center group gap-3 px-5 py-2  rounded-xl bg-white border-2 border-green-600 text-green-700 font-bold shadow-sm transition-all hover:bg-green-600 hover:text-white active:scale-95"
    >
      <FaHistory  className="group-hover:rotate-[-45deg] transition-transform"/>
      Loan History
      <FaArrowRight className="text-sm opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
    </button>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {/* Tier 1 */}
    <div className="group relative bg-green-50/50 border border-green-100 rounded-2xl p-8 transition-all hover:shadow-md hover:-translate-y-1">
      <div className="absolute top-4 right-4 bg-green-600 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">
        2% Interest
      </div>
      <div className="p-3 bg-white rounded-xl w-fit shadow-sm text-green-600 mb-4 group-hover:scale-110 transition-transform">
        <FiLayers size={24} />
      </div>
      <div className="text-3xl mt-6 font-black text-gray-900">₱5,000</div>
      
    </div>

    {/* Tier 2 */}
    <div className="group relative bg-[#7e9e6c]/10 border border-[#7e9e6c]/20 rounded-2xl p-8 transition-all hover:shadow-md hover:-translate-y-1">
      <div className="absolute top-4 right-4 bg-green-600 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">
        2% Interest
      </div>
      <div className="p-3 bg-white rounded-xl w-fit shadow-sm text-green-700 mb-4 group-hover:scale-110 transition-transform">
        <FiLayers size={24} />
      </div>
      <div className="text-3xl mt-6 font-black text-gray-900">₱10,000</div>
    </div>

    {/* Tier 3 */}
    <div className="group relative bg-green-50/50 border border-green-100 rounded-2xl p-8 transition-all hover:shadow-md hover:-translate-y-1">
      <div className="absolute top-4 right-4 bg-green-600 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">
        2% Interest
      </div>
      <div className="p-3 bg-white rounded-xl w-fit shadow-sm text-green-600 mb-4 group-hover:scale-110 transition-transform">
        <FiLayers size={24} />
      </div>
      <div className="text-3xl mt-6 font-black text-gray-900">₱15,000</div>
      
    </div>
  </div>
</Card>
        </div>
      </div>

      {/* Popups (existing) */}
      <Loannow isOpen={isLoanNowOpen} onClose={() => setIsLoanNowOpen(false)} />
      <ShareHistoryPopup
        isOpen={isSharePopupOpen}
        onClose={() => setIsSharePopupOpen(false)}
        loading={loadingShareHistory}
        rows={shareHistoryRows}
      />
      {/* pass rows + loading to DividendHistoryPopup */}
      <DividendHistoryPopup
        isOpen={isDivPopupOpen}
        onClose={() => setIsDivPopupOpen(false)}
        rows={dividendsRows}
        loading={loadingDividends}
      />

      {/* Payment History quick modal */}
      {isPaymentPopupOpen && (
      <div className="fixed inset-0 flex items-center justify-center bg-black/45 z-50 px-4 transition-all duration-300">
  {/* Modal Container */}
  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
    
    {/* Header Section */}
    <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Payment History</h2>
        <p className="text-xs text-gray-500 mt-1">Select a category to view details</p>
      </div>
    </div>

    {/* Body Section */}
    <div className="p-6 space-y-4">
      
      {/* PURCHASE HISTORY BUTTON */}
      <button
        onClick={() => {
          setIsPaymentPopupOpen(false);
          handleOpenPurchaseHistory();
        }}
        className="group w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-green-500 hover:bg-green-50 transition-all duration-200"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-700 rounded-full group-hover:bg-green-600 group-hover:text-white transition-colors">
            {/* Shopping Cart Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-800 group-hover:text-green-800">Purchase History</h3>
            <p className="text-xs text-gray-400 group-hover:text-green-600">View past items bought</p>
          </div>
        </div>
        {/* Chevron Icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300 group-hover:text-green-600 transform group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* BILLS PAYMENT BUTTON */}
      <button
        onClick={() => {
          setIsPaymentPopupOpen(false);
          handleOpenBillHistory();
        }}
        className="group w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-green-500 hover:bg-green-50 transition-all duration-200"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-700 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
            {/* Receipt Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-800 group-hover:text-blue-800">Bills Payment</h3>
            <p className="text-xs text-gray-400 group-hover:text-blue-600">View bill transactions</p>
          </div>
        </div>
        {/* Chevron Icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

    </div>

    {/* Footer Section */}
    <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
      <button
        onClick={() => setIsPaymentPopupOpen(false)}
        className="bg-[#b8d8ba] text-white px-6 py-2 rounded-lg hover:bg-[#8fa182] hover:shadow-lg transition-all active:scale-95"
      >
        Close
      </button>
    </div>

  </div>
</div>
      )}

      {/* Loan Application Modal */}
      {showLoanApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="relative w-full max-w-4xl lg p-6">
       

            <LoanApplication onBack={() => setShowLoanApplication(false)} />
          </div>
        </div>
      )}

      {/* Purchase History Modal */}
      {showPurchaseHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="relative w-full max-w-4xl p-6">
            <button
              aria-label="Close purchase history"
              onClick={() => setShowPurchaseHistory(false)}
              className="absolute right-4 top-4 text-gray-600 hover:text-gray-800"
            >
              <FaTimes size={18} />
            </button>

            {/* pass rows + loading to PurchaseHistory (component should accept these props) */}
            <PurchaseHistory rows={purchasesRows} loading={loadingPurchases} onBack={() => setShowPurchaseHistory(false)} />
          </div>
        </div>
      )}

      {/* Bills Payment Modal */}
      {showBillHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="relative w-full max-w-4xl p-6">
            <button
              aria-label="Close bills payment"
              onClick={() => setShowBillHistory(false)}
              className="absolute right-4 top-4 text-gray-600 hover:text-gray-800"
            >
              <FaTimes size={18} />
            </button>

            <BillHistory rows={billsRows} loading={loadingBills} onBack={() => setShowBillHistory(false)} />
          </div>
        </div>
      )}

      {/* Loan History Modal */}
      {showLoanHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="relative w-full max-w-4xl p-6">
            <button
              aria-label="Close loan history"
              onClick={() => setShowLoanHistory(false)}
              className="absolute right-4 top-4 text-gray-600 hover:text-gray-800"
            >
              <FaTimes size={18} />
            </button>

            <LoanHistory onBack={() => setShowLoanHistory(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
          