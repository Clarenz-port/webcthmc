// src/page/Admin.jsx
import React, { useState, useEffect } from "react";
import { 
  FaClipboardList, 
  FaCheckCircle, 
  FaClock, 
  FaChartBar,
  FaUserClock,
  FaFileAlt,
  FaArrowLeft
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
  FiChevronLeft, FiDollarSign, FiShoppingCart, FiTrendingUp, FiCreditCard, FiMoreHorizontal
} from "react-icons/fi";

import axios from "axios";
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

// Import the real ReportModal from the popup folder
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

  // TOTAL SHARES
  const [sharesTotal, setSharesTotal] = useState(0);
  const [loadingSharesTotal, setLoadingSharesTotal] = useState(false);

  // Report modal open state
  const [showReportModal, setShowReportModal] = useState(false);

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
      const res = await axios.get("http://localhost:8000/api/admin/pending-members", {
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

  // Handle approve
  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:8000/api/admin/approve/${id}`, {}, {
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
      await axios.delete(`http://localhost:8000/api/admin/reject/${id}`, {
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
     FETCH MEMBERS
  ------------------------------------------------------------------------- */
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const token = (localStorage.getItem("token") || "").trim();
        const res = await axios.get("http://localhost:8000/api/admin/members", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMembers(res.data || []);
      } catch (err) {
        console.error("❌ Error fetching members:", err);
        setMembers([]);
      }
    };
    fetchMembers();
    fetchPendingMembers(); // Also fetch pending count
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
        const resCounts = await axios.get("http://localhost:8000/api/loans/loan-counts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        pendingCount = resCounts.data.pending ?? 0;
        approvedOrPaidCount = resCounts.data.approvedOrPaid ?? 0;
      } catch (err) {
        console.warn("loan-counts endpoint failed:", err?.message);
      }

      try {
        const res = await axios.get("http://localhost:8000/api/loans/approved-loans", {
          headers: { Authorization: `Bearer ${token}` },
        });
        approvedLoans = Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        const resAll = await axios.get("http://localhost:8000/api/loans/members", {
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
            const res = await axios.get(`http://localhost:8000/api/loans/${loan.id}/payments`, {
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
        const resPurchases = await axios.get("http://localhost:8000/api/purchases/pending", {
          headers: { Authorization: `Bearer ${token}` },
        });
        purchaseDue = Array.isArray(resPurchases.data) ? resPurchases.data : [];
      } catch (err) {
        console.warn("Failed to fetch pending purchases:", err?.message);
        purchaseDue = [];
      }

      if (!mounted) return;

      setLoanCounts({
        pending: pendingCount || 0,
        approvedOrPaid: filteredApprovedLoans.length, // Updated to use filtered count
        total: filteredApprovedLoans.length + purchaseDue.length, // MERGED COUNT with filtered loans
      });

      setPurchaseDueCount(purchaseDue.length);

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
          const resCounts = await axios.get("http://localhost:8000/api/loans/loan-counts", {
            headers: { Authorization: `Bearer ${token}` },
          });
          pendingCount = resCounts.data.pending ?? 0;
          approvedOrPaidCount = resCounts.data.approvedOrPaid ?? 0;
        } catch (err) {
          console.warn("loan-counts endpoint failed:", err?.response?.status || err?.message);
        }

        let approvedLoans = [];
        try {
          const res = await axios.get("http://localhost:8000/api/loans/approved-loans", {
            headers: { Authorization: `Bearer ${token}` },
          });
          approvedLoans = Array.isArray(res.data) ? res.data : [];
        } catch (err) {
          try {
            const resAll = await axios.get("http://localhost:8000/api/loans/members", {
              headers: { Authorization: `Bearer ${token}` },
            });
            const allLoans = Array.isArray(resAll.data) ? resAll.data : resAll.data?.loans ?? [];
            approvedLoans = allLoans.filter((l) => ["approved"].includes(String(l.status).toLowerCase()));
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
        const endpoints = [
          "/api/shares",
          "/api/shares/all",
          "http://localhost:8000/api/shares"
        ];

        let res = null;
        for (const ep of endpoints) {
          try {
            res = await axios.get(ep, {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            if (res?.status >= 200 && res?.status < 300) break;
          } catch (e) {}
        }

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
  const filteredMembers = React.useMemo(() => {
    const q = (searchTerm || "").trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const name = `${m.firstName || ""} ${m.middleName || ""} ${m.lastName || ""} ${m.memberName || ""} ${m.name || ""}`.toLowerCase();
      return name.includes(q);
    });
  }, [members, searchTerm]);

  return (
    <div>
  
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
              {members.length} Total Registered Members
            </p>
          </div>
        </div>
      </div>
<div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]"></div>
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
<div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]"></div>
  {/* TABLE AREA */}
  <div className="flex-1 rounded-t-[2rem] bg-white overflow-auto">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-gray-50/50 sticky top-0 z-10 backdrop-blur-md">
          <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
            <div className="flex items-center gap-2"><FiUser className="text-[#7e9e6c]" /> Member Identity</div>
          </th>
          <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
             <div className="flex items-center gap-2"><FiMail className="text-[#7e9e6c]" /> Contact Info</div>
          </th>
          <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
             <div className="flex items-center gap-2"><FiMapPin className="text-[#7e9e6c]" /> Address</div>
          </th>
          <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
             Quick Actions
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
            const fullAddress = [m.street, m.block ? `Blk ${m.block}` : null, m.lot ? `Lot ${m.lot}` : null].filter(Boolean).join(", ") || "—";
            
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

                <td className="px-8 py-5">
                  <div className="flex items-center justify-center gap-2">
                    {/* Action: Paid Loan */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePaidLoan(m); }}
                      title="Paid Loan"
                      className="p-2.5 bg-[#d6ead8] text-[#7e9e6c] rounded-xl hover:bg-[#7e9e6c] hover:text-white transition-all shadow-sm active:scale-90"
                    >
                      <FiDollarSign size={16} />
                    </button>
                    
                    {/* Action: Purchase */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePurchase(m); }}
                      title="Purchase"
                      className="p-2.5 bg-[#ebf1fb] text-[#6b8fd7] rounded-xl hover:bg-[#6b8fd7] hover:text-white transition-all shadow-sm active:scale-90"
                    >
                      <FiShoppingCart size={16} />
                    </button>

                    {/* Action: Add Shares */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleAddShares(m); }}
                      title="Add Shares"
                      className="p-2.5 bg-[#fff4e8] text-[#f6b26b] rounded-xl hover:bg-[#f6b26b] hover:text-white transition-all shadow-sm active:scale-90"
                    >
                      <FiTrendingUp size={16} />
                    </button>

                    {/* Action: Pay Bills */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePayBills(m); }}
                      title="Pay Bills"
                      className="p-2.5 bg-[#fdeaea] text-[#e06b6b] rounded-xl hover:bg-[#e06b6b] hover:text-white transition-all shadow-sm active:scale-90"
                    >
                      <FiCreditCard size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
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
      const res = await axios.get("/api/activity", {
        params: { page: p, limit },
        headers: { Authorization: `Bearer ${token}` },
      });

      // Flexible parsing for different API shapes
      const rows = res.data?.rows ?? (Array.isArray(res.data) ? res.data : []);
      setLogs(rows);

      // Do not use a total count from the API — prefer page-size fallback
      setHasMore(Array.isArray(rows) ? rows.length === limit : false);
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
  <div className="flex items-center justify-between mb-6">
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
                const isSystem = !r.User;
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
                        {r.User ? `${r.User.firstName || ""} ${r.User.lastName || ""}`.trim() : "System"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-500 capitalize">
                      {r.userRole || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-gray-800 uppercase tracking-tight">
                        {r.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate text-xs text-gray-500 group-hover:text-gray-700 transition-colors" title={typeof r.details === "string" ? r.details : JSON.stringify(r.details)}>
                        {r.details }
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
              onClick={handleNext}
              disabled={!hasMore || loading}
              className={`px-3 py-1 rounded-lg text-sm font-semibold ${!hasMore || loading ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
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

    <button
      onClick={handleReport}
      className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-[#7e9e6c] text-white font-bold hover:bg-[#6a8b5a] transition-all shadow-md hover:shadow-lg active:scale-95"
    >
      <FaFileAlt />
      Generate Reports
    </button>
  </div>

  {/* CARDS GRID */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
    
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

    {/* Approved Loan Card */}
    <div
      onClick={() => setActiveSection("approvedLoan")}
      className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border-b-4 hover:border-b-green-400"
    >
      <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
        <FaCheckCircle />
      </div>
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Approved loans</p>
      <p className="text-4xl font-black text-gray-800 mt-1">
        {loadingCounts ? (
          <span className="animate-pulse text-gray-300">...</span>
        ) : (
          loanCounts.approvedOrPaid
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
          loanCounts.total
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
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Shares</p>
      <p className="text-2xl font-black text-gray-800 mt-2 truncate">
        {loadingSharesTotal ? (
          <span className="animate-pulse text-gray-300">...</span>
        ) : (
          formatCurrency(sharesTotal)
        )}
      </p>
    </div>

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

  </div>


            {/* CHARTS */}
            <div className="grid grid-cols-2 gap-8 mb-5">
                <LoanStatusDonut
                  pending={loanCounts.pending}
                  active={loanCounts.approvedOrPaid}
                  duedate={loanCounts.total}
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
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
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
