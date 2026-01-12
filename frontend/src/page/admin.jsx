// src/page/Admin.jsx
import React, { useState, useEffect } from "react";
import { 
  FaClipboardList, 
  FaCheckCircle, 
  FaClock, 
  FaChartBar,
  FaUserClock,
  FaArrowLeft
} from "react-icons/fa";

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

export default function Admin() {
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
          ["approved", "paid"].includes(String(l.status).toLowerCase())
        );
      }

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
        approvedOrPaid: approvedOrPaidCount || approvedLoans.length,
        total: approvedLoans.length + purchaseDue.length, // MERGED COUNT
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
            approvedLoans = allLoans.filter((l) => ["approved", "paid"].includes(String(l.status).toLowerCase()));
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
    <div className="bg-white shadow-lg p-4 rounded-lg overflow-auto">
      <div className="flex items-center mt-4 relative mb-4">
        <button
          onClick={() => setActiveSection("dashboard")}
          className="absolute left-0 text-[#5a7350] hover:text-[#7e9e6c] transition text-2xl"
        >
          <FaArrowLeft />
        </button>

        <div className="flex-1 text-center">
          <h2 className="text-4xl text-[#5a7350] font-bold">Members</h2>
          <p className="text-md text-gray-500 mb-4 mt-1">{members.length} members</p>
        </div>
      </div>

      {/* Search Row */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by member name..."
          className="border px-3 py-2 rounded w-full max-w-lg"
        />
        <div className="text-sm text-gray-500">{filteredMembers.length} result{filteredMembers.length !== 1 ? "s" : ""}</div>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Member Name</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Email</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Phone</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Address</th>
            <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {members.length === 0 ? (
            <tr>
              <td colSpan="5" className="px-4 py-6 text-center text-gray-500 italic">No members found</td>
            </tr>
          ) : filteredMembers.length === 0 ? (
            <tr>
              <td colSpan="5" className="px-4 py-6 text-center text-gray-500 italic">No results for "{searchTerm}"</td>
            </tr>
          ) : (
            filteredMembers.map((m) => {
              const name = `${m.firstName || ""} ${m.middleName || ""} ${m.lastName || ""}`.trim();
              const address = [m.street, m.block ? `Block ${m.block}` : null, m.lot ? `Lot ${m.lot}` : null].filter(Boolean).join(", ") || "—";
              return (
                <tr key={m.id} className="hover:bg-[#f5f9ef] cursor-pointer">
                  <td className="px-4 py-3 text-sm">{name || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{m.email || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{m.phoneNumber || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{address}</td>
                  <td className="px-4 py-3 text-sm text-center space-x-2">
                    <button onClick={() => handlePaidLoan(m)} className="px-2 py-1 text-xs bg-[#7e9e6c] text-white rounded hover:bg-[#6a8b5a]">Paid Loan</button>
                    <button onClick={() => handlePurchase(m)} className="px-2 py-1 text-xs bg-[#6b8fd7] text-white rounded hover:bg-[#5278c0]">Purchase</button>
                    <button onClick={() => handleAddShares(m)} className="px-2 py-1 text-xs bg-[#f6b26b] text-white rounded hover:bg-[#e09b3f]">Add Shares</button>
                    <button onClick={() => handlePayBills(m)} className="px-2 py-1 text-xs bg-[#e06b6b] text-white rounded hover:bg-[#c85050]">Pay Bills</button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

  // inside admin.jsx — replace UsersActivityView with this:
const UsersActivityView = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  const fetchLogs = async (p = page) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/activity", {
        params: { page: p, limit },
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs(res.data.rows || []);
    } catch (err) {
      console.error("Failed to fetch activity logs:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(1); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Activity Logs</h2>
        <div className="space-x-2">
          <button onClick={() => fetchLogs(1)} className="px-3 py-1 border rounded">Refresh</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow overflow-auto">
        {loading ? <p>Loading...</p> : (
          logs.length === 0 ? (
            <p className="text-gray-500 italic">No activity logs found</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left">Date</th>
                  <th className="px-2 py-2 text-left">User</th>
                  <th className="px-2 py-2 text-left">Role</th>
                  <th className="px-2 py-2 text-left">Action</th>
                  <th className="px-2 py-2 text-left">Details</th>
                  <th className="px-2 py-2 text-left">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((r) => (
                  <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                    <td className="px-2 py-2">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="px-2 py-2">{r.User ? `${r.User.firstName || ""} ${r.User.lastName || ""}`.trim() : "System"}</td>
                    <td className="px-2 py-2">{r.userRole || "—"}</td>
                    <td className="px-2 py-2">{r.action}</td>
                    <td className="px-2 py-2">{r.details ? (typeof r.details === "string" ? r.details : JSON.stringify(r.details)) : "-"}</td>
                    <td className="px-2 py-2">{r.ip || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
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
        ) : (
          <>
            {/* ------------------------------------------------------------------
                DASHBOARD HEADER (Updated with Report Button)
            ------------------------------------------------------------------ */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-extrabold">Dashboard</h1>
              </div>

              <button
                onClick={handleReport}
                className="px-12 py-2 rounded-lg bg-[#7e9e6c] text-lg text-white font-bold hover:bg-[#6a8b5a] shadow-lg"
              >
                Reports
              </button>
            </div>

            {/* CARDS */}
            <div className="grid grid-cols-5 gap-4 mb-5">
              {/* Pending */}
              <div
                onClick={() => setActiveSection("pendingLoans")}
                className="bg-white pt-20 rounded-2xl border-2 p-5 border-gray-300 shadow-lg cursor-pointer hover:bg-[#dce8c8]"
              >
                <div className="text-5xl text-gray-700 mb-3">
                  <FaClipboardList />
                </div>
                <p className="text-lg font-bold">Pending Loan Applications</p>
                <p className="text-5xl font-bold">{loadingCounts ? "..." : loanCounts.pending}</p>
              </div>

              {/* Approved */}
              <div
                onClick={() => setActiveSection("approvedLoan")}
                className="bg-white pt-20 rounded-2xl border-2 p-5 border-gray-300 shadow-lg cursor-pointer hover:bg-[#dce8c8]"
              >
                <div className="text-5xl text-gray-700 mb-3">
                  <FaCheckCircle />
                </div>
                <p className="text-lg font-bold">Approved Loans</p>
                <p className="text-5xl font-bold">{loadingCounts ? "..." : loanCounts.approvedOrPaid}</p>
              </div>

              {/* Duedate */}
              <div
                onClick={() => setActiveSection("totalloan")}
                className="bg-white pt-20 rounded-2xl border-2 p-5 border-gray-300 shadow-lg cursor-pointer hover:bg-[#dce8c8]"
              >
                <div className="text-5xl text-gray-700 mb-3">
                  <FaClock />
                </div>
                <p className="text-lg font-bold">Duedate</p>
                <p className="text-5xl font-bold">
                  {loadingCounts ? "..." : loanCounts.total}
                </p>
              </div>
              {/* Total Shares */}
              <div
                onClick={() => setActiveSection("shares")}
                className="bg-white pt-20 rounded-2xl border-2 p-5 border-gray-300 shadow-lg cursor-pointer hover:bg-[#dce8c8]"
              >
                <div className="text-5xl text-gray-700 mb-3">
                  <FaChartBar />
                </div>
                <p className="text-lg font-bold">Total Shares</p>
                <p className="text-4xl font-bold">
                  {loadingSharesTotal ? "..." : formatCurrency(sharesTotal)}
                </p>
              </div>

              {/* Pending Member */}
              <div className="bg-white pt-20 rounded-2xl border-2 p-5 border-gray-300 shadow-lg cursor-pointer hover:bg-[#dce8c8]">
                <div className="text-5xl text-gray-700 mb-3">
                  <FaUserClock />
                </div>
                <p className="text-lg font-bold">Pending Member</p>
                <p className="text-5xl font-bold">0</p>
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
      </main>
    </div>
  );
}
