// src/page/popup/approvedloan.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiArrowLeft, 
  FiClock, 
  FiUser, 
  FiCalendar, 
  FiAlertCircle, 
  FiEye,
  FiActivity
} from "react-icons/fi";
import API from '../../apis/axios.js';
import MemberDetails from "../popup/adminmember.jsx";

export default function Duedate({ onBack, onView, onDueDateCountChange }) {
  const navigate = useNavigate();
  const [loanRecords, setLoanRecords] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingNextDue, setLoadingNextDue] = useState(true);
  const [error, setError] = useState(null);

  // modal state for MemberDetails
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [memberForDetails, setMemberForDetails] = useState(null);

  const formatCurrency = (num) =>
    typeof num === "number"
      ? num.toLocaleString("en-PH", { style: "currency", currency: "PHP" })
      : num
      ? Number(num).toLocaleString("en-PH", { style: "currency", currency: "PHP" })
      : "₱0.00";

  // detect 1-month method
  const isOneMonthMethod = (pm) => {
    if (!pm) return false;
    const s = String(pm).toLowerCase();
    return (
      s.includes("1month") ||
      s.includes("1 month") ||
      s.includes("one month") ||
      s.includes("month to pay") ||
      s.includes("share-deduction") ||
      s.includes("share")
    );
  };

  // LOAN schedule builder
  const buildSchedule = (loan, paymentsSum = 0) => {
    const principal = parseFloat(loan.loanAmount) || 0;
    const months = parseInt(loan.duration, 10) || 0;
    const monthlyRate = 0.02;

    const scheduleData = [];
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

      const status = paymentsSum >= paidSoFar + totalPayment ? "Paid" : "Unpaid";

      scheduleData.push({
        month: i,
        interestPayment: Number(interestPayment.toFixed(2)),
        totalPayment: Number(totalPayment.toFixed(2)),
        remainingBalance: Number(remainingBalance.toFixed(2)),
        dueDate: new Date(approvalDate.getFullYear(), approvalDate.getMonth() + i, approvalDate.getDate()),
        status,
      });

      remainingBalance -= principalPayment;
      paidSoFar += totalPayment;
    }

    return scheduleData;
  };

  const daysFromToday = (date) => {
    if (!date) return null;
    const today = new Date();
    const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const d = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.round((d - t) / (1000 * 60 * 60 * 24));
  };

  const findNextDueFromSchedule = (sched) => {
    if (!sched || sched.length === 0) return null;
    return sched.find((s) => s.status !== "Paid") || null;
  };
useEffect(() => {
    if (typeof onDueDateCountChange === "function") {
      const count = loanRecords.filter(record => record.type === 'Loan' && record.daysRemaining <= 5).length;
      onDueDateCountChange(count);
    }
  }, [loanRecords, onDueDateCountChange]);
  useEffect(() => {
    let mounted = true;

    const fetchDueApproveLoans = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token")?.trim() || "";

        // 1) fetch approved loans
        let approved = [];
        try {
          const res = await API.get("/api/loans/approved-loans", {
            headers: { Authorization: `Bearer ${token}` },
          });
          approved = Array.isArray(res.data) ? res.data : [];
        } catch {
          approved = [];
        }

        // 2) For each loan, fetch amortization schedule (ApproveLoan rows)
        let dueRows = [];
        for (const loan of approved) {
          try {
            const schedRes = await API.get(`/api/loans/${loan.id}/amortization`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const schedule = Array.isArray(schedRes.data) ? schedRes.data : [];
            for (const row of schedule) {
              if (row.status !== 'Paid' && row.status !== 'Late' && row.dueDate) {
                const dueDate = new Date(row.dueDate);
                const daysRemaining = daysFromToday(dueDate);
                if (typeof daysRemaining === 'number' && daysRemaining <= 5) {
                  dueRows.push({
                    id: row.id,
                    loanId: loan.id,
                    memberId: loan.memberId,
                    memberName: loan.memberName || loan.name || 'Unknown',
                    type: 'Loan',
                    dueDate,
                    daysRemaining,
                    status: row.status,
                    amortization: row.amortization,
                    penalty: row.penalty,
                  });

                  // --- SEND SMS NOTIFICATION ---
                  // Only send if member has a phone number and daysRemaining is close
                  if (loan.memberPhone || loan.phone || loan.mobile) {
                    const phone = loan.memberPhone || loan.phone || loan.mobile;
                    const message = `Hello ${loan.memberName || loan.name || 'Member'}, your loan due in ${dueDate.toLocaleDateString('en-PH')} in total of ${row.amortization ? Number(row.amortization).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' }) : ''} please pay before duedate thank you.`;
                    try {
                      await API.post('/api/sms/send', {
                        to: phone,
                        message,
                      }, {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                    } catch (smsErr) {
                      // Optionally log or ignore SMS errors
                      console.warn('Failed to send SMS to', phone, smsErr);
                    }
                  }
                  // --- END SMS NOTIFICATION ---
                }
              }
            }
          } catch (err) {
            // skip loan if error
          }
        }

        // Sort by nearest due
        dueRows.sort((a, b) => {
          const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          return da - db;
        });

        if (!mounted) return;
        setLoanRecords(dueRows);
      } catch (err) {
        if (mounted) setError("Failed to load due dates.");
      } finally {
        if (mounted) {
          setLoading(false);
          setLoadingNextDue(false);
        }
      }
    };

    fetchDueApproveLoans();
    return () => (mounted = false);
  }, []);

  // Resolve member object - prefer exact member by id, fallback to name search
  const resolveMemberFromRecord = async (record) => {
    if (!record) return null;

    const possibleId =
      record.memberId ??
      record.userId ??
      record.customerId ??
      record.customer?.id ??
      record.member?.id ??
      record.user?._id ??
      record.member?._id ??
      null;

    const token = localStorage.getItem("token")?.trim();

    // If we have an id, fetch exact member
    if (possibleId) {
      try {
        const res = await API.get(`/api/members/${encodeURIComponent(possibleId)}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          validateStatus: null,
        });
        if (res.status < 400 && res.data) {
          // normalize common fields into the member object expected by MemberDetails
          return {
            id: res.data.id ?? res.data._id ?? res.data.memberId ?? possibleId,
            ...res.data,
          };
        }
      } catch (err) {
        console.warn("Failed to fetch member by id:", err);
      }
    }

    // If no id or lookup failed, try name search
    const name = record.memberName ?? record.customerName ?? record.name ?? null;
    if (name) {
      try {
        const res = await API.get(`/api/members?search=${encodeURIComponent(name)}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          validateStatus: null,
        });
        const rows = Array.isArray(res.data) ? res.data : res.data?.members ?? [];
        if (rows && rows.length > 0) {
          return {
            id: rows[0].id ?? rows[0]._id ?? rows[0].memberId ?? null,
            ...rows[0],
          };
        }
      } catch (err) {
        console.warn("Member name search failed:", err);
      }
    }

    // fallback minimal member-like object
    return { id: null, memberName: name ?? record.memberName ?? "Unknown" };
  };

  const openMemberDetailsForRecord = async (record) => {
    let member = null;
    // If record.memberId is missing, try to fetch from loan
    let memberId = record.memberId;
    if (!memberId && record.loanId) {
      try {
        const token = localStorage.getItem("token")?.trim();
        const res = await API.get(`/api/loans/${record.loanId}`);
        if (res.data && (res.data.userId || res.data.memberId)) {
          memberId = res.data.userId || res.data.memberId;
        }
      } catch (err) {
        // fallback to null
      }
    }
    if (memberId) {
      try {
        const token = localStorage.getItem("token")?.trim();
        const res = await API.get(`/api/members/${encodeURIComponent(memberId)}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          validateStatus: null,
        });
        if (res.status < 400 && res.data) {
          member = {
            id: res.data.id ?? res.data._id ?? res.data.memberId ?? memberId,
            ...res.data,
          };
        }
      } catch (err) {
        // fallback to null
      }
    }
    if (!member) {
      member = await resolveMemberFromRecord(record);
    }
    const memberWithContext = {
      ...(member || {}),
      // include the full raw record so MemberDetails can highlight which purchase/loan triggered this
      _triggeredBy: record,
    };
    setMemberForDetails(memberWithContext);
    setShowMemberDetails(true);
  };

  const computeSchedule = async (loan) => {
    const principal = parseFloat(loan.loanAmount) || 0;
    const months = parseInt(loan.duration, 10) || 0;
    const monthlyRate = 0.02;

    let payments = [];
    try {
      const token = localStorage.getItem("token")?.trim() || "";
      const res = await API.get(`/api/loans/${loan.id}/payments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      payments = res.data || [];
    } catch (err) {
      console.warn("Failed to fetch loan payments:", err);
    }

    const paymentsSum = payments.reduce(
      (a, p) => a + (parseFloat(p.amountPaid || p.amount || 0) || 0),
      0
    );

    const scheduleData = buildSchedule(loan, paymentsSum);
    setSchedule(scheduleData);
    setSelectedLoan(loan);
  };

  return (
    <div>
      {/* HEADER SECTION */}
      <div>
        <div className="flex items-center mb-2 gap-6">
          <button
            onClick={onBack}
            className="p-3 bg-white border border-gray-100 text-gray-500 hover:text-[#7e9e6c] hover:border-[#7e9e6c] rounded-xl transition-all shadow-sm active:scale-95 group"
            title="Go Back"
          >
            <FiArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h2 className="text-3xl font-black text-gray-800 tracking-tight">Due Dates</h2>
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-gray-100 border-t-[#7e9e6c] rounded-full animate-spin" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Fetching payment records...</p>
          </div>
        ) : error ? ( 
          <div className="flex flex-col items-center justify-center py-20 text-red-500 bg-red-50 rounded-[2rem] border border-red-100">
            <FiAlertCircle size={48} className="mb-4" />
            <p className="font-bold">{error}</p>
          </div>
        ) : (() => {
          // Filter: Only show unpaid loans with due date within 5 days
          const filteredLoans = loanRecords.filter(record => {
            return (
              record.type === 'Loan' &&
              typeof record.daysRemaining === 'number' &&
              record.daysRemaining <= 5
            );
          });
          // Debug: log filtered loans
          console.log('Filtered Loans for Due Table:', filteredLoans);
          if (filteredLoans.length === 0) {
            return (
              <div className="flex flex-col items-center bg-white rounded-t-[2rem] justify-center py-20 text-gray-300">
                <FiCalendar size={64} className="mb-4 opacity-20" />
                <p className="font-bold uppercase tracking-widest text-xs italic text-gray-400">No upcoming loan due dates found</p>
              </div>
            );
          }
          return (
            <div className="bg-gray-50 rounded-t-[2rem] overflow-x-auto" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr className="text-gray-400">
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-left"><div className="flex items-center gap-2"><FiUser /> Member</div></th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-left"><div className="flex items-center gap-2"><FiActivity /> Type</div></th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-left">Due Status</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-left">Amortization</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.map((record, index) => {
                    const isOverdue = record.daysRemaining < 0;
                    return (
                      <tr key={record.id || index}>
                        {/* Member Column - now clickable */}
                        <td className={`px-6 py-4 bg-white`}>
                          <button
                            className="text-sm font-black text-gray-800 uppercase tracking-tight hover:underline hover:text-[#7e9e6c] focus:outline-none"
                            title="View Member Details"
                            onClick={async () => {
                              await openMemberDetailsForRecord(record);
                            }}
                          >
                            {record.memberName}
                          </button>
                        </td>

                        {/* Type Column */}
                        <td className={`px-6 py-4 bg-white`}>
                          <span className={`text-[11px] font-black px-2 py-1 rounded-md uppercase tracking-tighter bg-purple-100 text-purple-600`}>
                            {record.type}
                          </span>
                          <div className="text-[10px] font-bold text-gray-400 mt-1 italic">
                            Amortization
                          </div>
                        </td>

                        {/* Next Due Column */}
                        <td className={`px-6 py-4 bg-white`}>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-600">
                              {record.dueDate ? new Date(record.dueDate).toLocaleDateString("en-PH", { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </span>
                            <span className={`text-[10px] font-black uppercase mt-1 ${isOverdue ? 'text-red-500' : 'text-[#7e9e6c]'}`}>
                              {isOverdue 
                                ? `${Math.abs(record.daysRemaining)} day(s) overdue` 
                                : `${record.daysRemaining} days remaining`}
                            </span> 
                          </div>
                        </td>
                        <td className={`px-10 py-4 bg-white`}>
                          <div className="flex flex-col font-bold">

                              {formatCurrency(record.amortization)}
                              {record.penalty && Number(record.penalty) > 0 && (
                                <span className="text-xs text-red-500">Penalty: {formatCurrency(record.penalty)}</span>
                              )}
                          </div>
                        </td>

                        {/* Action Column */}
                        <td className={`px-6 py-4 bg-white  text-center`}>
                          <button
                            onClick={() => {
                              if (typeof onView === "function") {
                                onView(record);
                                return;
                              }
                              const id = record.memberId;
                              const idNum = Number(id);
                              if (
                                id !== undefined &&
                                id !== null &&
                                id !== '' &&
                                !isNaN(idNum) &&
                                isFinite(idNum)
                              ) {
                                navigate(`/members/${idNum}`);
                              } else {
                                alert("No valid member ID found for this record.");
                              }
                            }}
                            className="p-3 bg-white border  border-gray-100 text-[#7e9e6c] rounded-xl hover:bg-[#7e9e6c] hover:text-white hover:border-[#7e9e6c] transition-all shadow-sm active:scale-90"
                            title="View Member Details"
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
          );
        })()}
      </div>

      {/* FOOTER LEGEND */}
      <div className="p-5 bg-gray-50 rounded-b-[2rem] border-t border-gray-50 flex justify-between items-center">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Overdue</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#7e9e6c]"></span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active</span>
          </div>
        </div>
      </div>

      {/* MemberDetails modal shown when View clicked (only if parent didn't handle onView) */}
      {showMemberDetails && memberForDetails && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMemberDetails(false)} />
          <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-auto p-6 z-60">
            <button onClick={() => setShowMemberDetails(false)} className="mb-4 px-3 py-1 bg-gray-200 rounded">
              Close
            </button>

            {/* MemberDetails will fetch its own data using member.id if present */}
            <MemberDetails member={memberForDetails} onBack={() => setShowMemberDetails(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
