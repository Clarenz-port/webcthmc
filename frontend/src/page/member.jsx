// src/page/Member.jsx
import { notify } from "../utils/toast";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaHistory,
  FaFileInvoiceDollar,
  FaWallet,
  FaPlusCircle,
  FaMoneyBillWave,
  FaUserCircle,
  FaCreditCard,
  FaRegCalendarAlt,
  FaTimes,
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
          <Card className="flex flex-col col-span-2 items-center text-center">
            {!user ? (
              <div className="animate-pulse space-y-4 w-full">
                <div className="h-36 w-36 rounded-full bg-gray-200 mx-auto" />
                <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mt-2" />
              </div>
            ) : (
              <>
                <img
                  src={getAvatarSrc(user)}
                  alt={`${user.firstName ?? ""} ${user.lastName ?? ""}`}
                  className="w-36 h-36 rounded-full border-4 border-[#7e9e6c] object-cover mb-4"
                />
                <h2 className="text-2xl font-bold">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-sm text-gray-600">
                  Member since{" "}
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "—"}
                </p>

                <div className="w-full mt-10 text-left space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700">Contact</h3>
                  <p className="text-sm text-gray-600">📞 {user.phoneNumber || "—"}</p>
                  <p className="text-sm text-gray-600">📧 {user.email || "—"}</p>
                  <p className="text-sm text-gray-600">🎂 {user.birthdate || "—"}</p>

                  <h3 className="text-sm font-semibold text-gray-700 mt-5">Address</h3>
                  <p className="text-sm text-gray-600">
                    {user.street ? `${user.street} ` : ""}
                    {user.block ? `Block ${user.block} ` : ""}
                    {user.lot ? `Lot ${user.lot}` : ""}
                  </p>
                </div>
              </>
            )}
          </Card>

          {/* SHARES CARD */}
          <Card className="col-span-3">
            <div className="flex flex-col pb-4 md:flex-row gap-6">
              <div className="flex-1">
                <h3 className="text-2xl font-semibold text-gray-700">Shares</h3>
                <p className="text-md text-gray-500 mb-20">Overview & history</p>

                <button
                  onClick={handleOpenShareHistory}
                  className="inline-flex items-center gap-2 px-24 py-6 rounded-md border border-green-600 text-green-700 font-semibold shadow-sm hover:bg-green-50"
                >
                  <FaHistory /> View History
                </button>

                <div className="mt-22 bg-[#d6ead8] p-4 rounded-md">
                  <div className="text-xl font-medium text-gray-700">Your Shares</div>
                  <div className="text-4xl font-extrabold text-green-800 mt-2">
                    ₱{loadingShares ? "Loading..." : formatMoney(memberSharesTotal)}
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center">
                <img src={Wallet} alt="Wallet" className="w-90 h-90 object-contain" />
              </div>
            </div>
          </Card>

          {/* ACTIONS CARD */}
          <Card className="flex col-span-3 flex-col justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-gray-700">Quick Actions</h3>
              <p className="text-md text-gray-500 mb-7">Apply for loans or view payment history</p>

              <div className="space-y-3">
                <button
                  onClick={() => { setIsPaymentPopupOpen(false); handleOpenDividendHistory(); }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-4 rounded-md border border-green-600 text-green-800 font-semibold hover:bg-green-50"
                >
                  <FaFileInvoiceDollar /> Dividend History
                </button>

                <button
                  onClick={() => setIsPaymentPopupOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-4 rounded-md border border-green-700 text-green-800 font-semibold hover:bg-green-50"
                >
                  <FaMoneyBillWave /> Payment History
                </button>

                <button
                  onClick={handleLoanNowClick}
                  disabled={hasActiveLoan}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-4 rounded-md font-semibold ${
                    hasActiveLoan
                      ? "bg-gray-300 text-white border-gray-300 cursor-not-allowed"
                      : "bg-green-700 text-white hover:bg-green-800"
                  }`}
                >
                  <FaCreditCard />
                  {hasActiveLoan ? "Active Loan Exists" : "Loan Now"}
                </button>
              </div>
            </div>

            <div className="mt-6 w-full bg-gray-50 p-6 rounded-md border">
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
          <Card>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Loan Summary</h3>
            <div className="space-y-3">
              {activeLoan ? (
                <>
                  <div>
                    <div className="text-md text-gray-600">Loan Amount</div>
                    <div className="text-xl font-bold mt-1">
                      ₱{formatMoney(activeLoan.loanAmount ?? activeLoan.loan_amount ?? activeLoan.amount ?? 0)}
                    </div>
                  </div>

                  <div>
                    <div className="text-md text-gray-600">To Pay (this installment)</div>
                    <div className="text-lg font-bold mt-1">₱{paidAmount}</div>
                  </div>

                  <div>
                    <div className="text-md text-gray-600">Next Payment</div>
                    <div className="text-sm mt-1">
                      {activeLoan.dueDate ??
                        activeLoan.nextPaymentDate ??
                        activeLoan.next_payment_date ??
                        "No Due Date"}
                    </div>
                  </div>

                  <div>
                    <div className="text-md text-gray-600">Status</div>
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                          activeLoan.status === "Approved" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        <FaUserCircle /> {activeLoan.status}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-gray-600 h-64">No existing loan. You can apply for a loan using "Loan Now".</div>
              )}
            </div>
          </Card>

          <Card className="col-span-3">
            <h3 className="text-2xl font-semibold text-gray-700 mb-5">Loans Breakdown</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#d6ead8] rounded-lg p-12 text-center shadow-sm">
                <div className="text-4xl font-bold">₱5,000</div>
                <div className="text-md text-gray-600 mt-1">Interest (2%)</div>
              </div>
              <div className="bg-[#d6ead8] rounded-lg p-12 text-center shadow-sm">
                <div className="text-4xl font-bold">₱10,000</div>
                <div className="text-md text-gray-600 mt-1">Interest (2%)</div>
              </div>
              <div className="bg-[#d6ead8] rounded-lg p-12 text-center shadow-sm md:col-span-1">
                <div className="text-4xl font-bold">₱15,000</div>
                <div className="text-md text-gray-600 mt-1">Interest (2%)</div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                  onClick={() => setShowLoanApplication(true)}
                  className="inline-flex items-center gap-2 px-10 py-4 rounded-md border border-gray-300 text-gray-800 font-semibold hover:bg-gray-50"
                >
                  <FaHistory /> Loan History
                </button>
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/45 z-50 px-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">

            <h2 className="text-2xl font-bold text-[#22543d] mb-4">Payment History</h2>
            <div className="space-y-3">
              {/* PURCHASE HISTORY */}
              <button
                onClick={() => {
                  // fetch purchases for current member then open modal
                  setIsPaymentPopupOpen(false);
                  handleOpenPurchaseHistory();
                }}
                className="w-full py-3 text-lg font-semibold bg-green-600 border border-gray-300 shadow-md text-white rounded-md hover:bg-green-800"
              >
                🛒 Purchase History
              </button>

              {/* BILLS PAYMENT */}
              <button
                onClick={() => {
                  setIsPaymentPopupOpen(false);
                  handleOpenBillHistory();
                }}
                className="w-full py-3 text-lg font-semibold border border-gray-300 shadow-md bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                🧾 Bills Payment
              </button>
            </div>

            <div className="mt-4 text-right">
              <button
                onClick={() => setIsPaymentPopupOpen(false)}
                className="px-4 py-2 border-gray-400 shadow-md rounded-md text-sm bg-gray-300 hover:bg-gray-400"
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
          