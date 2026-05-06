// src/page/Admin.jsx

import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { 
  FaClipboardList, 
  FaCheckCircle, 
  FaClock, 
  FaChartBar,
  FaUserClock,
  FaFileAlt,
  FaArrowLeft,
} from "react-icons/fa";
import { 
  FiActivity, 
  FiRefreshCw, 
  FiUser, 
  FiShield, 
  FiInfo, 
  FiGlobe, 
  FiClock, 
  FiDatabase,
  FiArrowLeft,
  FiInbox,FiSearch, FiX,
  FiMail, FiPhone, FiMapPin, 
  FiChevronLeft, FiDollarSign, FiShoppingCart, FiTrendingUp, FiCreditCard, FiMoreHorizontal,FiChevronDown
} from "react-icons/fi";
import API from '../apis/axios.js';
import Adminnavbar from "../comp/adminnavbar.jsx";
import Sidebar from "../comp/adminsidebar.jsx";
import AccountOnlyPopup from "./popup/accountpopup.jsx";
import MemberDetails from "../page/popup/adminmember.jsx";
import ManageNotice from "../page/popup/AdminCreateNotice.jsx";
import PendingLoanApplications from "../page/popup/pendingloanadmin.jsx";
import Approvedloan from "../page/popup/approvedloan.jsx";
import TotalLoan from "../page/popup/Totalloan.jsx";
import LoanStatusDonut from "../comp/charts/LoanStatusDonut.jsx";
import SharesLineChart from "../comp/charts/SharesLineChart.jsx";
import SharesPage from "../page/popup/SharesPage.jsx";
import ReportModal from "./popup/ReportModal.jsx";  
import Configuration from "./configuration.jsx";




export default function Admin({ onBack }) {
  const [memberDetailsAction, setMemberDetailsAction] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [members, setMembers] = useState([]);
  const [loanCounts, setLoanCounts] = useState({ pending: 0, approvedOrPaid: 0, total: 0 });
  
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [purchaseDueCount, setPurchaseDueCount] = useState(0);

  const [dueDateCount, setDueDateCount] = useState(0);

  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));
  const navigate = useNavigate();

  useEffect(() => {
    if (!loggedIn) {
      navigate("/login", { replace: true });
    }
  }, [loggedIn, navigate]);
  // TOTAL SHARES
  const [sharesTotal, setSharesTotal] = useState(0);
  const [loadingSharesTotal, setLoadingSharesTotal] = useState(false);

  // Expose a function to refresh shares total
  const refreshSharesTotal = async () => {
    setLoadingSharesTotal(true);
    try {
      const token = (localStorage.getItem("token") || "").trim();
      const res = await API.get("/api/shares", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const rows = res?.data ?? [];
      const arr = Array.isArray(rows) ? rows : rows.rows ?? [];
      const sum = arr.reduce((acc, r) => {
        const amt = r.shareamount ?? r.shareAmount ?? r.amount ?? r.value ?? 0;
        return acc + Number(amt || 0);
      }, 0);
      setSharesTotal(sum);
    } catch (err) {
      console.warn("Failed to fetch shares total (refresh):", err?.message || err);
    } finally {
      setLoadingSharesTotal(false);
    }
  };

  // Report modal open state
  const [showReportModal, setShowReportModal] = useState(false);
  // Ledger modal open state
  const [showLedgerModal, setShowLedgerModal] = useState(false);

  // Pending members modal
  const [showPendingMembersModal, setShowPendingMembersModal] = useState(false);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);

  const handlePaidLoan = (m) => { setSelectedMember(m); setMemberDetailsAction("paidLoan"); setActiveSection("memberDetails"); };
const handlePurchase = (m) => { setSelectedMember(m); setMemberDetailsAction("purchase"); setActiveSection("memberDetails"); };
const handleAddShares = (m) => { setSelectedMember(m); setMemberDetailsAction("addShares"); setActiveSection("memberDetails"); };
const handlePayBills = (m) => { setSelectedMember(m); setMemberDetailsAction("payBills"); setActiveSection("memberDetails"); };

  /* -------------------------------------------------------------------------
     REPORT BUTTON HANDLER
  ------------------------------------------------------------------------- */
  const handleReport = () => {
    setShowReportModal(true);
  };
  // Fetch pending members
  const fetchPendingMembers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/api/admin/pending-members", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingMembers(res.data || []);
      setPendingCount(res.data.length || 0);
    } catch (err) {
      console.error("Failed to fetch pending members:", err);
      setPendingMembers([]);
      setPendingCount(0);
    }
  };

  // Fetch pending members count on mount
  useEffect(() => {
    fetchPendingMembers();
  }, []);

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await API.put(`/api/admin/approve/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Remove from pending list
      setPendingMembers(prev => prev.filter(m => m.id !== id));
      setPendingCount(prev => prev - 1);
      // Update members list if needed
      setMembers(prev => prev.map(m => m.id === id ? { ...m, status: 'approved' } : m));
    } catch (err) {
      console.error("Failed to approve member:", err);
    }
  };

  // Handle reject
  const handleReject = async (id) => {
    try {
      const token = localStorage.getItem("token");
     await API.delete(`/api/admin/reject/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Remove from list
      setPendingMembers(prev => prev.filter(m => m.id !== id));
      setPendingCount(prev => prev - 1);
    } catch (err) {
      console.error("Failed to reject member:", err);
    }
  };

  /* -------------------------------------------------------------------------
     PREVENT BACK BUTTON FROM NAVIGATING TO MEMBER PAGE
  ------------------------------------------------------------------------- */
  useEffect(() => {
    // Push a history state when component mounts
    window.history.pushState({ page: "admin" }, null);

    // Handle the back button
    const handleBackButton = (event) => {
      // Prevent going back to member page
      // Check if there's another state in history, if not just stay
      if (window.history.length > 1) {
        window.history.pushState({ page: "admin" }, null);
      }
    };

    window.addEventListener("popstate", handleBackButton);

    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, []);


  /* -------------------------------------------------------------------------
     FETCH MEMBERS
  ------------------------------------------------------------------------- */
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const token = (localStorage.getItem("token") || "").trim();
        const res = await API.get("/api/admin/members", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMembers(res.data || []);
      } catch (err) {
        console.error("❌ Error fetching members:", err);
        setMembers([]);
      }
      };
      fetchMembers();
    }, []);

  useEffect(() => {
    let mounted = true;

    const fetchCounts = async () => {
      setLoadingCounts(true);
      try {
        const token = (localStorage.getItem("token") || "").trim();

        // FETCH LOANS
        let pendingCount = 0;
        let approvedOrPaidCount = 0;
        let approvedLoans = [];

        try {
          const resCounts = await API.get("/api/loans/loan-counts", {
            headers: { Authorization: `Bearer ${token}` },
          });
          pendingCount = resCounts.data.pending ?? 0;
          approvedOrPaidCount = resCounts.data.approvedOrPaid ?? 0;
        } catch (err) {
          console.warn("loan-counts endpoint failed:", err?.message);
        }

        try {
          const res = await API.get("/api/loans/approved-loans", {
            headers: { Authorization: `Bearer ${token}` },
          });
          approvedLoans = Array.isArray(res.data) ? res.data : [];
        } catch (err) {
          const resAll = await API.get("/api/loans/members", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const allLoans = Array.isArray(resAll.data) ? resAll.data : resAll.data?.loans ?? [];
          approvedLoans = allLoans.filter((l) =>
            ["approved"].includes(String(l.status).toLowerCase())
          );
        }

        // Filter approved loans to exclude fully paid ones
        const filteredApprovedLoans = (await Promise.all(
          approvedLoans.map(async (loan) => {
            let payments = [];
            try {
              const res = await API.get(`/api/loans/${loan.id}/payments`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              payments = res.data || [];
            } catch {}

            const paymentsSum = payments.reduce(
              (acc, p) => acc + (parseFloat(p.amountPaid || p.amount || 0) || 0),
              0
            );

            // Build schedule to calculate total due
            const principal = parseFloat(loan.loanAmount) || 0;
            const months = parseInt(loan.duration, 10) || 0;
            const monthlyRate = 0.02;
            const schedule = [];
            let remainingBalance = principal;
            const approvalDate = loan.approvalDate ? new Date(loan.approvalDate) : new Date(loan.createdAt || Date.now());
            const monthlyPrincipal = months > 0 ? principal / months : principal;
            let paidSoFar = 0;

            for (let i = 1; i <= Math.max(1, months); i++) {
              const interestPayment = remainingBalance * monthlyRate;
              let principalPayment = monthlyPrincipal;
              let totalPayment = principalPayment + interestPayment;

              if (i === months) {
                totalPayment = remainingBalance + interestPayment;
                principalPayment = remainingBalance;
              }

              schedule.push({
                month: i,
                interestPayment: Number(interestPayment.toFixed(2)),
                totalPayment: Number(totalPayment.toFixed(2)),
                remainingBalance: Number(remainingBalance.toFixed(2)),
                dueDate: new Date(approvalDate.getFullYear(), approvalDate.getMonth() + i, approvalDate.getDate()),
              });

              remainingBalance -= principalPayment;
              paidSoFar += totalPayment;
            }

            const totalDue = schedule.reduce((acc, s) => acc + s.totalPayment, 0);
            const isFullyPaid = paymentsSum >= totalDue;

            return isFullyPaid ? null : loan;
          })
        )).filter(Boolean);

        // FETCH UNPAID PURCHASES
        let purchaseDue = [];
        try {
          const resPurchases = await API.get("/api/purchases/pending", {
            headers: { Authorization: `Bearer ${token}` },
          });
          purchaseDue = Array.isArray(resPurchases.data) ? resPurchases.data : [];
        } catch (err) {
          console.warn("Failed to fetch pending purchases:", err?.message);
          purchaseDue = [];
        }

        // Fetch due date count from ApproveLoan amortization schedule (like Totalloan.jsx)
        let dueDateCount = 0;
        for (const loan of filteredApprovedLoans) {
          try {
            const schedRes = await API.get(`/api/loans/${loan.id}/amortization`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const schedule = Array.isArray(schedRes.data) ? schedRes.data : [];
            for (const row of schedule) {
              if (row.status !== 'Paid' && row.status !== 'Late' && row.dueDate) {
                const dueDate = new Date(row.dueDate);
                const today = new Date();
                const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
                const d = Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
                const daysRemaining = Math.round((d - t) / (1000 * 60 * 60 * 24));
                if (typeof daysRemaining === 'number' && daysRemaining <= 5) {
                  dueDateCount++;
                }
              }
            }
          } catch {}
        }

        if (!mounted) return;

        setLoanCounts({
          pending: pendingCount || 0,
          approvedOrPaid: filteredApprovedLoans.length,
          approvedOrPaid1: approvedLoans.length,
          total: filteredApprovedLoans.length + purchaseDue.length,
        });

        setPurchaseDueCount(purchaseDue.length);
        setDueDateCount(dueDateCount);

      } catch (err) {
        console.error("❌ Error fetching counts:", err);
        setLoanCounts({ pending: 0, approvedOrPaid: 0, total: 0 });
        setPurchaseDueCount(0);
      } finally {
        if (mounted) setLoadingCounts(false);
      }
    };

    fetchCounts();
    return () => (mounted = false);
  }, []);


  /* -------------------------------------------------------------------------
     FETCH LOAN COUNTS
  ------------------------------------------------------------------------- */
  useEffect(() => {
    let mounted = true;

    const fetchCounts = async () => {
      setLoadingCounts(true);
      try {
        const token = (localStorage.getItem("token") || "").trim();

        let pendingCount = 0;
        let approvedOrPaidCount = 0;

        try {
          const resCounts = await API.get("/api/loans/loan-counts", {
            headers: { Authorization: `Bearer ${token}` },
          });
          pendingCount = resCounts.data.pending ?? 0;
          approvedOrPaidCount = resCounts.data.approvedOrPaid ?? 0;
        } catch (err) {
          console.warn("loan-counts endpoint failed:", err?.response?.status || err?.message);
        }

        let approvedLoans = [];
        try {
          const res = await API.get("/api/loans/approved-loans", {
            headers: { Authorization: `Bearer ${token}` },
          });
          approvedLoans = Array.isArray(res.data) ? res.data : [];
        } catch (err) {
          try {
            const resAll = await API.get("/api/loans/members", {
              headers: { Authorization: `Bearer ${token}` },
            });
            const allLoans = Array.isArray(resAll.data) ? resAll.data : resAll.data?.loans ?? [];
            approvedLoans = allLoans.filter((l) => ["Approved", "Paid"].includes(String(l.status).toLowerCase()));
          } catch (err2) {
            console.error("Failed to fetch approved loans fallback:", err2);
            approvedLoans = [];
          }
        }

        if (!mounted) return;

        setLoanCounts({
          pending: pendingCount || 0,
          approvedOrPaid: approvedOrPaidCount || approvedLoans.length,
          total: approvedLoans.length,
        });
      } catch (err) {
        console.error("❌ Error fetching loan counts:", err);
        setLoanCounts({ pending: 0, approvedOrPaid: 0, total: 0 });
      } finally {
        if (mounted) setLoadingCounts(false);
      }
    };

    fetchCounts();
    return () => {
      mounted = false;
    };
  }, []);

  /* -------------------------------------------------------------------------
     FETCH TOTAL SHARES
  ------------------------------------------------------------------------- */
  useEffect(() => {
    let cancelled = false;

    const quickSum = () => {
      if (!Array.isArray(members) || members.length === 0) return 0;
      return members.reduce((acc, m) => {
        const v = Number(m.totalShares ?? m.shares ?? m.shareTotal ?? 0) || 0;
        return acc + v;
      }, 0);
    };

    setSharesTotal(quickSum());

    const fetchSharesTotal = async () => {
      setLoadingSharesTotal(true);
      try {
        const token = (localStorage.getItem("token") || "").trim();
        const res = await API.get("/api/shares", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

        if (cancelled) return;

        const rows = res?.data ?? [];
        const arr = Array.isArray(rows) ? rows : rows.rows ?? [];

        const sum = arr.reduce((acc, r) => {
          const amt = r.shareamount ?? r.shareAmount ?? r.amount ?? r.value ?? 0;
          return acc + Number(amt || 0);
        }, 0);

        setSharesTotal(sum);
      } catch (err) {
        console.warn("Failed to fetch shares total:", err?.message || err);
      } finally {
        if (!cancelled) setLoadingSharesTotal(false);
      }
    };

    fetchSharesTotal();
    return () => (cancelled = true);
  }, [members]);

  /* -------------------------------------------------------------------------
     HANDLERS
  ------------------------------------------------------------------------- */
  const handleSelectMember = (member) => {
    setSelectedMember(member);
    setActiveSection("memberDetails");
  };

  const handleNavigate = (section) => {
    setSelectedMember(null);
    setActiveSection(section);
  };

  /* -------------------------------------------------------------------------
     UI COMPONENT: Users -> Members
  ------------------------------------------------------------------------- */
  const UsersMembersView = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("az"); // "az" or "za"
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  useEffect(() => {
    if (!showSortDropdown) return;
    const handler = () => setShowSortDropdown(false);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [showSortDropdown]);
  const approvedMembers = React.useMemo(() => members.filter(m => String(m.status).toLowerCase() === "approved"), [members]);
  const filteredMembers = React.useMemo(() => {
    const q = (searchTerm || "").trim().toLowerCase();
    let list = approvedMembers;
    if (q) {
      list = list.filter((m) => {
        const name = `${m.firstName || ""} ${m.middleName || ""} ${m.lastName || ""} ${m.memberName || ""} ${m.name || ""}`.toLowerCase();
        return name.includes(q);
      });
    }
    // Sort by name
    list = [...list].sort((a, b) => {
      const nameA = `${a.firstName || ""} ${a.middleName || ""} ${a.lastName || ""}`.trim().toLowerCase();
      const nameB = `${b.firstName || ""} ${b.middleName || ""} ${b.lastName || ""}`.trim().toLowerCase();
      if (sortOrder === "az") return nameA.localeCompare(nameB);
      else return nameB.localeCompare(nameA);
    });
    return list;
  }, [approvedMembers, searchTerm, sortOrder]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* HEADER SECTION */}
      <div className="border-b border-gray-50 ">
        <div className="flex flex-col md:flex-row md:items-center mb-2 justify-between gap-6">
          <div className="flex items-center gap-5">
            <button
              onClick={() => setActiveSection("dashboard")}
              className="p-3 bg-white border border-gray-100 text-gray-500 hover:text-[#7e9e6c] hover:border-[#7e9e6c] rounded-xl transition-all shadow-sm active:scale-95 group"
              title="Back to Dashboard"
            >
              <FiArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h2 className="text-3xl font-black text-gray-800 tracking-tight">Members</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex h-2 w-2 rounded-full bg-[#7e9e6c]"></span>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {approvedMembers.length} Approved Members
                </p>
              </div>
            </div>
          </div>
          {/* SEARCH ROW */}
          <div className="flex items-center gap-4">
            <div className="relative w-full md:w-80 group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiSearch className={`transition-colors ${searchTerm ? "text-[#7e9e6c]" : "text-gray-300"}`} />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search members..."
                className="w-full bg-gray-50 border border-gray-400 py-3 pl-11 pr-12 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[#7e9e6c]/20 transition-all placeholder:text-gray-300"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-4  flex items-center text-gray-300 hover:text-red-400 transition-colors"
                >
                  <FiX size={18} />
                </button>
              )}
            </div>
            <button
              onClick={() => { fetchPendingMembers(); setShowPendingMembersModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 transition-all shadow-sm active:scale-95"
              title="View Pending Members"
            >
              <FaUserClock size={16} />
              Pending Members
            </button>
          </div>
        </div>
      </div>
      {/* TABLE AREA */}
      <div className="flex-1 min-h-0 rounded-t-[2rem] bg-white overflow-hidden flex flex-col">
        <div className="overflow-auto" style={{ maxHeight: '72vh' }}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 sticky top-0 z-10 backdrop-blur-md">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <div 
                    className="flex items-center gap-2 relative cursor-pointer select-none"
                    onClick={e => {
                      e.stopPropagation();
                      setShowSortDropdown(v => !v);
                    }}
                  >
                    <FiUser className="text-[#7e9e6c]" /> Member<FiChevronDown size={14} className="text-gray-500 group-hover:text-[#7e9e6c] transition-colors" />
                    <div className="relative">
                      {/* Dropdown */}
                      {showSortDropdown && (
                        <div className="absolute z-10 top-6 left-0 bg-white border border-gray-200 rounded shadow-md w-28">
                          <button
                            className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-50 ${sortOrder === "az" ? "font-bold text-[#7e9e6c]" : ""}`}
                            onClick={e => { e.stopPropagation(); setSortOrder("az"); setShowSortDropdown(false); }}
                          >A - Z</button>
                          <button
                            className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-50 ${sortOrder === "za" ? "font-bold text-[#7e9e6c]" : ""}`}
                            onClick={e => { e.stopPropagation(); setSortOrder("za"); setShowSortDropdown(false); }}
                          >Z - A</button>
                        </div>
                      )}
                    </div>
                  </div>
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <div className="flex items-center gap-2"><FiMail className="text-[#7e9e6c]" /> Contact Info</div>
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <div className="flex items-center gap-2"><FiMapPin className="text-[#7e9e6c]" /> Address</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center opacity-30">
                      <FiUser size={48} />
                      <p className="mt-4 font-bold uppercase tracking-widest text-xs">No members found in database</p>
                    </div>
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-8 py-20 text-center">
                    <p className="text-gray-400 italic">No results matching "{searchTerm}"</p>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => {
                  const fullName = `${m.firstName || ""} ${m.middleName || ""} ${m.lastName || ""}`.trim();
                  const fullAddress = m.address || "—";
                  
                  return (
                    <tr
                      key={m.id}
                      onClick={() => handleSelectMember(m)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectMember(m); }}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-8 py-5">
                        <p className="text-sm font-black text-gray-800 group-hover:text-[#7e9e6c] transition-colors uppercase tracking-tight">
                          {fullName || "Unnamed Member"}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">ID: {m.id?.toString().slice(-6).toUpperCase() || 'N/A'}</p>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                            <FiMail size={12} className="text-gray-300" /> {m.email || "—"}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                            <FiPhone size={12} className="text-gray-300" /> {m.phoneNumber || "—"}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-xs text-gray-500 max-w-[200px] leading-relaxed line-clamp-2 italic">
                          {fullAddress}
                        </p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* FOOTER STATS */}
      <div className="px-8 py-4 bg-gray-50 rounded-b-[2rem] border-t border-gray-100 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        <span>Showing results for current filter</span>
        <span className="text-[#7e9e6c]">{filteredMembers.length} Active Profiles</span>
      </div>
    </div>
  );
};

  // inside admin.jsx — replace UsersActivityView with this:
const UsersActivityView = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // show 10 logs per page to avoid long scrolls
  const [hasMore, setHasMore] = useState(false);

  const fetchLogs = async (p = 1) => {
    try {
      setLoading(true);
      setPage(p);
      const token = localStorage.getItem("token");
      const res = await API.get("/api/activity", {
        params: { page: p, limit },
        headers: { Authorization: `Bearer ${token}` },
      });

      // Flexible parsing for different API shapes
      const rows = res.data?.rows ?? (Array.isArray(res.data) ? res.data : []);
      setLogs(rows);

      // Do not use a total count from the API — prefer page-size fallback
      // If the API returns exactly 'limit' logs, check if the next page has data
      if (Array.isArray(rows) && rows.length === limit) {
        // Try to fetch the next page to check if it has data
        const token = localStorage.getItem("token");
        try {
          const nextRes = await API.get("/api/activity", {
            params: { page: p + 1, limit },
            headers: { Authorization: `Bearer ${token}` },
          });
          const nextRows = nextRes.data?.rows ?? (Array.isArray(nextRes.data) ? nextRes.data : []);
          setHasMore(nextRows.length > 0);
        } catch {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to fetch activity logs:", err);
      setLogs([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(1); }, []);

  const handlePrev = () => { if (page > 1) fetchLogs(page - 1); };
  const handleNext = () => { if (hasMore) fetchLogs(page + 1); };

  const startIndex = (page - 1) * limit + 1;
  const endIndex = startIndex + logs.length - 1;

  return (
    <div>
      <div className="space-y-4">
  {/* HEADER SECTION */}
  <div className="flex items-center justify-between mb-">
    <div className="flex items-center gap-3">
      <button
  onClick={() => setActiveSection("dashboard")}
  className="p-3 bg-white border border-gray-100 text-gray-500 hover:text-[#7e9e6c] hover:border-[#7e9e6c] rounded-xl transition-all shadow-sm active:scale-95 group"
        >
          <FiArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
</button>
      <div>
        <h2 className="text-3xl font-black text-gray-800 tracking-tight">Activity Logs</h2>
      </div>
    </div>
    
    <button 
      onClick={() => fetchLogs(page)} 
      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm shadow-sm hover:border-[#7e9e6c] hover:text-[#7e9e6c] transition-all active:scale-95"
    >
      <FiRefreshCw className={loading ? "animate-spin" : ""} />
      Refresh Logs
    </button>
  </div>

  {/* TABLE CONTAINER */}
  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
    {loading ? (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-12 h-12 border-4 border-[#d6ead8] border-t-[#7e9e6c] rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-400 font-medium animate-pulse">Synchronizing logs...</p>
      </div>
    ) : logs.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mb-4">
          <FiInbox size={32} />
        </div>
        <h4 className="text-gray-800 font-semibold">No logs found</h4>
        <p className="text-sm text-gray-400 max-w-[250px] mt-1">
          There are no activity records for the current period.
        </p>
      </div>
    ) : (
      <div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest"><div className="flex items-center gap-2"><FiClock /> Timestamp</div></th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest"><div className="flex items-center gap-2"><FiUser /> User</div></th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest"><div className="flex items-center gap-2"><FiShield /> Role</div></th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest"><div className="flex items-center gap-2"><FiDatabase /> Action</div></th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest"><div className="flex items-center gap-2"><FiInfo /> Details</div></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((r) => {
                // Try to parse details for userName/userRole if present
                let parsedDetails = {};
                if (typeof r.details === 'string') {
                  try {
                    parsedDetails = JSON.parse(r.details);
                  } catch (e) {
                    parsedDetails = {};
                  }
                } else if (typeof r.details === 'object' && r.details !== null) {
                  parsedDetails = r.details;
                }
                const showName = parsedDetails.userName || (r.User ? `${r.User.firstName || ''} ${r.User.lastName || ''}`.trim() : 'System');
                const showRole = parsedDetails.userRole || r.userRole || '—';
                const isSystem = !showName || showName === 'System';
                return (
                  <tr key={r.id}>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold text-gray-700">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium">
                        {new Date(r.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${isSystem ? 'bg-gray-100 text-gray-500' : 'bg-[#d6ead8] text-[#7e9e6c]'}`}>
                        {showName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-500 capitalize">
                      {showRole}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-gray-800 uppercase tracking-tight">
                        {r.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate text-xs text-gray-500 group-hover:text-gray-700 transition-colors" title={typeof r.details === "string" ? r.details : JSON.stringify(r.details)}>
                        {/* Show a summary of details, but not userName/userRole */}
                        {(() => {
                          // Remove userName/userRole from details for display
                          const { userName, userRole, ...rest } = parsedDetails;
                          const summary = Object.entries(rest).map(([k, v]) => `${k}: ${v}`).join(", ");
                          return summary || (typeof r.details === 'string' ? r.details : JSON.stringify(r.details));
                        })()}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            <span>Showing {startIndex}-{endIndex}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={page === 1 || loading}
              className={`px-3 py-1 rounded-lg text-sm font-semibold ${page === 1 || loading ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
            >
              Previous
            </button>

            <div className="text-xs text-gray-500 px-3">Page {page}</div>

            <button
              onClick={hasMore && logs.length === limit && !loading ? handleNext : undefined}
              disabled={!hasMore || logs.length !== limit || loading}
              className={`px-3 py-1 rounded-lg text-sm font-semibold ${!hasMore || logs.length !== limit || loading ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
</div>
    </div>
  );
};

  const formatCurrency = (n) =>
    Number(n || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" });

  /* -------------------------------------------------------------------------
     RENDER
  ------------------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-[#f3f3f3] font-sans flex flex-col">
      <Adminnavbar onManageNotice={() => setActiveSection("notice")} />

      <Sidebar
        members={members}
        onSelectMember={handleSelectMember}
        selectedMember={selectedMember}
        onNavigate={handleNavigate}
      />

      <main className="flex-1 p-6 overflow-auto ml-64 mt-24">
        {activeSection === "notice" ? (
          <ManageNotice onBack={() => setActiveSection("dashboard")} />
        ) : activeSection === "pendingLoans" ? (
          <PendingLoanApplications onBack={() => setActiveSection("dashboard")} />
        ) : activeSection === "approvedLoan" ? (
          <Approvedloan onBack={() => setActiveSection("dashboard")} />
        ) : activeSection === "totalloan" ? (
          <TotalLoan
            onBack={() => setActiveSection("dashboard")}
            onView={(loanRecord) => {
              const memberId = loanRecord?.userId ?? loanRecord?.memberId ?? loanRecord?.member_id ?? null;
              if (memberId) {
                const nameParts = (loanRecord.memberName || "").split(" ");
                setSelectedMember({
                  id: memberId,
                  firstName: nameParts[0],
                  lastName: nameParts.slice(1).join(" "),
                  loanId: loanRecord.id,
                  loanRecord,
                });
              } else {
                setSelectedMember({
                  id: loanRecord.id,
                  firstName: loanRecord.memberName ?? "Member",
                  loanId: loanRecord.id,
                  loanRecord,
                });
              }
              setActiveSection("memberDetails");
            }}
          />
        ) : activeSection === "memberDetails" && selectedMember ? (
  <MemberDetails
    member={selectedMember}
    onBack={() => { setSelectedMember(null); setActiveSection("dashboard"); setMemberDetailsAction(null); }}
    openAction={memberDetailsAction}
    onSharesChanged={refreshSharesTotal}
  />
        ) : activeSection === "shares" ? (
          <SharesPage onBack={() => setActiveSection("dashboard")} members={members} />
        ) : activeSection === "users:members" ? (
          <UsersMembersView />
        ) : activeSection === "users:admins" ? (
          <AccountOnlyPopup inline={true} onClose={() => setActiveSection("dashboard")} />
        ) : activeSection === "users:activity" ? (
          <UsersActivityView />
        ) : activeSection === "configuration" ? (
          <Configuration onBack={() => setActiveSection("dashboard")} />
        ) : (
          <>
            {/* ------------------------------------------------------------------
                DASHBOARD HEADER (Updated with Report Button)
            ------------------------------------------------------------------ */}
  {/* HEADER SECTION */}
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
    <div>
      <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Dashboard</h1>
    </div>

    <div className="flex gap-4">
      <button
        onClick={handleReport}
        className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-[#7e9e6c] text-white font-bold hover:bg-[#6a8b5a] transition-all shadow-md hover:shadow-lg active:scale-95"
      >
        <FaFileAlt />
        Generate Reports
      </button>
    </div>
  </div>

  {/* CARDS GRID */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">

    {/* Pending Member Card */}
    <div 
      onClick={() => { fetchPendingMembers(); setShowPendingMembersModal(true); }}
      className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border-b-4 hover:border-b-purple-400"
    >
      <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
        <FaUserClock />
      </div>
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Pending Members</p>
      <p className="text-4xl font-black text-gray-800 mt-1">{pendingCount}</p>
    </div>
    
    {/* Pending Loan Card */}
    <div
      onClick={() => setActiveSection("pendingLoans")}
      className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border-b-4 hover:border-b-orange-400"
    >
      <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
        <FaClipboardList />
      </div>
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Pending loan applications</p>
      <p className="text-4xl font-black text-gray-800 mt-1">
        {loadingCounts ? (
          <span className="animate-pulse text-gray-300">...</span>
        ) : (
          loanCounts.pending
        )}
      </p>
    </div>

    {/* Due Date Card */}
    <div
      onClick={() => setActiveSection("totalloan")}
      className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border-b-4 hover:border-b-red-400"
    >
      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
        <FaClock />
      </div>
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Duedates</p>
      <p className="text-4xl font-black text-gray-800 mt-1">
        {loadingCounts ? (
          <span className="animate-pulse text-gray-300">...</span>
        ) : (
          dueDateCount
        )}
      </p>
    </div>

 {/* Approved Loan Card */}
    <div
      onClick={() => setActiveSection("approvedLoan")}
      className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border-b-4 hover:border-b-green-400"
    >
      <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
        <FaCheckCircle />
      </div>
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total loans</p>
      <p className="text-4xl font-black text-gray-800 mt-1">
        {loadingCounts ? (
          <span className="animate-pulse text-gray-300">...</span>
        ) : (
          loanCounts.approvedOrPaid1
        )}
      </p>
    </div>

    {/* Total Shares Card */}
    <div
      onClick={() => setActiveSection("shares")}
      className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border-b-4 hover:border-b-blue-400"
    >
      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
        <FaChartBar />
      </div>
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Contribution and Savings</p>
      <p className="text-2xl font-black text-gray-800 mt-2 truncate">
        {loadingSharesTotal ? (
          <span className="animate-pulse text-gray-300">...</span>
        ) : (
          formatCurrency(sharesTotal)
        )}
      </p>
    </div>

  </div>


            {/* CHARTS */}
            <div className="grid grid-cols-2 gap-8 mb-5">
                <LoanStatusDonut
                  pending={loanCounts.pending}
                  active={loanCounts.approvedOrPaid}
                  duedate={loanCounts.total}
                  dueSoon5={dueDateCount}
                />


              <SharesLineChart members={members} />
            </div>
          </>
        )}
        {/* REPORT MODAL */}
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          endpoints={{
            loans: "/api/loans",
            shares: "/api/shares",
            purchases: "/api/purchases",
            bills: "/api/bills",
          }}
        />

        {/* PENDING MEMBERS MODAL */}
        {showPendingMembersModal && (
          <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Pending Members</h3>
                </div>
                {pendingMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <FiUser size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No pending members at this time.</p>
                    <p className="text-sm text-gray-400 mt-2">All members have been processed.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 z-10 bg-gray-50">
                        <tr className="bg-gray-50/80 border-b border-gray-100">
                          <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</th>
                          <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Username</th>
                          <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
                          <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone</th>
                          <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Registered</th>
                          <th className="px-4 py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {pendingMembers.map((m) => (
                          <tr key={m.id}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-800">
                              {`${m.firstName || ""} ${m.middleName || ""} ${m.lastName || ""}`.trim()}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{m.username}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{m.email || "—"}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{m.phoneNumber || "—"}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {new Date(m.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => handleApprove(m.id)}
                                  className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(m.id)}
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => setShowPendingMembersModal(false)}
                    className="px-4 py-2 bg-[#7e9e6c] text-white rounded-xl hover:bg-[#6a8b5a] transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
