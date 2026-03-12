// src/page/popup/PendingLoanApplications.jsx
import React, { useEffect, useState } from "react";
import { notify } from "../../utils/toast";
import { 
  FiArrowLeft, 
  FiClock, 
  FiUser, 
  FiDollarSign, 
  FiCalendar, 
  FiFileText, 
  FiEye, 
  FiInbox,
  FiLoader 
} from "react-icons/fi";
import { 
  FaTimes, 
  FaUser, 
  FaMapMarkerAlt, 
  FaBullseye, 
  FaMoneyBillWave, 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaTimesCircle 
} from "react-icons/fa";
import API from '../../apis/axios.js';
export default function PendingLoanApplications({ onBack }) {
  const userRole = localStorage.getItem("role");
  const isSuperAdmin = userRole === "superadmin";

  const [pendingLoans, setPendingLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // new: check number state for approval
  const [checkNumber, setCheckNumber] = useState("");

  useEffect(() => {
    fetchPendingLoans();
  }, []);

  // Fetch pending loans
  const fetchPendingLoans = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found.");
        setLoading(false);
        return;
      }

      const res = await API.get("/api/loans/pending-loans", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPendingLoans(res.data || []);
    } catch (err) {
      console.error("❌ Error fetching pending loans:", err);
      setError("Failed to load pending loans.");
    } finally {
      setLoading(false);
    }
  };

  // Format currency helper
  const formatCurrency = (num) =>
    num ? num.toLocaleString("en-PH", { style: "currency", currency: "PHP" }) : "₱0.00";

  const computeSchedule = async (loan) => {
    const principal = parseFloat(loan.loanAmount) || 0;
    const months = parseInt(loan.duration) || 0;
    const monthlyRate = 0.02; // 2% interest per month

    // Fetch payments for this loan
    let payments = [];
    try {
      const token = localStorage.getItem("token");
      const res = await API.get(`/api/loans/${loan.id}/payments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      payments = Array.isArray(res.data) ? res.data.map((p) => parseFloat(p.amountPaid || p.amount || 0)) : [];
    } catch (err) {
      console.error("❌ Failed to fetch payments:", err);
    }

    const totalPaid = payments.reduce((a, b) => a + b, 0); // total paid
    const scheduleData = [];
    let remainingBalance = principal;

    let approvalDate = loan.createdAt ? new Date(loan.createdAt) : new Date();

    const monthlyPrincipal = months > 0 ? principal / months : principal;
    for (let i = 1; i <= Math.max(1, months); i++) {
      const interestPayment = remainingBalance * monthlyRate;
      let totalPayment = monthlyPrincipal + interestPayment;
      if (i === months) {
        totalPayment = remainingBalance + interestPayment;
      }

      scheduleData.push({
        month: i,
        totalPayment,
        interestPayment,
        remainingBalance: parseFloat(remainingBalance.toFixed(2)),
        dueDate: new Date(approvalDate.getFullYear(), approvalDate.getMonth() + i, approvalDate.getDate()),
      });

      remainingBalance -= monthlyPrincipal;
    }

    setSchedule(scheduleData);
  };

  // approve with checkNumber
  const handleApprove = async (loanId) => {
    try {
      // require check number
      const trimmedCheck = String(checkNumber).trim();
      if (!trimmedCheck) {
        notify.error("Please enter check number before approving.");
        return;
      }
      if (!/^[0-9]{10}$/.test(trimmedCheck)) {
        notify.error("Check number must be exactly 10 digits.");
        return;
      }
      const token = localStorage.getItem("token");
      if (!token) {
        notify.error("Not authenticated.");
        return;
      }

      const endpoint = `/api/loans/loan/${loanId}/approve`;
      const res = await API.post(
        endpoint,
        { checkNumber: trimmedCheck },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      notify.success(res.data?.message || "Loan approved");
      fetchPendingLoans();
      setSelectedLoan(null);
      setCheckNumber("");
    } catch (err) {
      console.error("❌ Approve failed:", err);
      notify.error(err.response?.data?.message || "Approve failed");
    }
  };

  // reject
  const handleReject = async (loanId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        notify.success("Not authenticated.");
        return;
      }
      const endpoint = `/api/loans/loan/${loanId}/reject`;
      const res = await API.post(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
      notify.success(res.data?.message || "Loan rejected");
      fetchPendingLoans();
      setSelectedLoan(null);
      setCheckNumber("");
    } catch (err) {
      console.error("❌ Reject failed:", err);
      notify.success(err.response?.data?.message || "Reject failed");
    }
  };

  return (
    <div>
      {/* Back Button */}
      <div >
  
  {/* HEADER SECTION */}
  <div >
    <div className="flex flex-col mb-2 md:flex-row md:items-center justify-between gap-6">
      <div className="flex items-center gap-5">
        <button
          onClick={onBack}
          className="p-3 bg-white border border-gray-100 text-gray-500 hover:text-[#7e9e6c] hover:border-[#7e9e6c] rounded-xl transition-all shadow-sm active:scale-95 group"
          title="Back"
        >
          <FiArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Pending Applications</h2>
          <div className="flex items-center gap-2 mt-1">
          </div>
        </div>
      </div>

      {/* SUMMARY BADGE */}
      {!loading && !error && pendingLoans.length > 0 && (
        <div className="px-5 py-2 bg-amber-50 border border-amber-100 rounded-2xl">
          <span className="text-xs font-black text-amber-600 uppercase tracking-tighter">
            {pendingLoans.length} Applications
          </span>
        </div>
      )}
    </div>
  </div>

  {/* CONTENT AREA */}
  <div >
    {loading ? (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <FiLoader className="w-10 h-10 text-[#7e9e6c] animate-spin" />
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading queue...</p>
      </div>
    ) : error ? (
      <div className="flex flex-col items-center justify-center py-24 text-red-500 bg-red-50 rounded-[2.5rem] border border-red-100 italic">
        <p className="font-bold">{error}</p>
      </div>
    ) : pendingLoans.length === 0 ? (
      <div className="flex flex-col items-center bg-white rounded-t-[2rem] justify-center py-24 text-gray-300">
        <FiInbox size={64} className="mb-4 opacity-10" />
        <p className="font-bold uppercase tracking-widest text-xs italic text-gray-400">No pending applications found</p>
      </div>
    ) : (
      <div className="bg-gray-50 rounded-t-[2rem] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-gray-400">
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-left"><div className="flex items-center gap-2"><FiUser /> Member</div></th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-left"><div className="flex items-center gap-2"><FiFileText /> Purpose</div></th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-left"><div className="flex items-center gap-2"><FiDollarSign /> Loan Amount</div></th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-left"><div className="flex items-center gap-2"><FiClock /> Term</div></th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-left"><div className="flex items-center gap-2"><FiCalendar /> Applied Date</div></th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingLoans.map((loan, index) => (
              <tr 
                key={loan.id || index}
                className="group transition-all duration-300"
              >
                {/* Member Identity */}
                <td className="px-6 py-5 bg-white ">
                  <p className="text-sm font-black text-gray-800 uppercase tracking-tight">
                    {loan.memberName || "N/A"}
                  </p>
                </td>

                {/* Purpose Tag */}
                <td className="px-6 py-5 bg-white">
                  <span className="text-[10px] font-black px-3 py-1 bg-white border border-gray-100 rounded-lg text-gray-400 uppercase tracking-tighter">
                    {loan.purpose || "General"}
                  </span>
                </td>

                {/* Amount */}
                <td className="px-6 py-5 bg-white">
                  <span className="text-sm font-black text-gray-700 font-mono">
                    {formatCurrency(loan.loanAmount)}
                  </span>
                </td>

                {/* Duration */}
                <td className="px-6 py-5 bg-white">
                  <span className="text-xs font-bold text-gray-500">
                    {loan.duration} <span className="text-[10px] uppercase">months</span>
                  </span>
                </td>

                {/* Date Applied */}
                <td className="px-6 py-5 bg-white">
                  <p className="text-xs font-bold text-gray-600">
                    {loan.createdAt ? new Date(loan.createdAt).toLocaleDateString("en-PH", { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
                  </p>
                </td>

                {/* Action Column */}
                <td className="px-6 py-5 bg-white text-center">
                  <button
                    onClick={() => {
                      setSelectedLoan(loan);
                      setCheckNumber("");
                      computeSchedule(loan);
                    }}
                    className="p-2 bg-white border font-bold border-gray-100 text-[#7e9e6c] rounded-xl hover:bg-[#7e9e6c] hover:text-white hover:border-[#7e9e6c] transition-all shadow-sm active:scale-90"
                    title="Review Application"
                  >
                    view
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>

  {/* FOOTER METADATA */}
  <div className="p-5 bg-gray-50 rounded-b-[2rem] border-t border-gray-50 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
    <span>Confidential Pending Queue</span>
    <div className="flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
      <span>Awaiting Administrative Action</span>
    </div>
  </div>
</div>

      {/* Loan Details Modal */}
      {selectedLoan && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6  transition-opacity">
    <div className="relative w-full max-w-[850px] max-h-full overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
      
      {/* Header section (Sticky) */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#56794a]">Loan Application Details</h2>
        </div>
        <button
          onClick={() => {
            setSelectedLoan(null);
            setCheckNumber("");
          }}
          className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <FaTimes className="text-xl" />
        </button>
      </div>

      {/* Scrollable Content Body */}
      <div className="overflow-y-auto px-6 py-5 custom-scrollbar">
        
        {/* Loan Details Grid */}
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-100 bg-gray-50 p-5 md:grid-cols-2">
          <div className="flex items-start gap-3">
            <FaUser className="mt-1 text-[#7e9e6c]" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Member Name</p>
              <p className="text-base font-medium text-gray-900">{selectedLoan.memberName}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <FaMapMarkerAlt className="mt-1 text-[#7e9e6c]" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Address</p>
              <p className="text-base font-medium text-gray-900">{selectedLoan.address}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FaBullseye className="mt-1 text-[#7e9e6c]" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Purpose</p>
              <p className="text-base font-medium text-gray-900">{selectedLoan.purpose}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FaMoneyBillWave className="mt-1 text-[#7e9e6c]" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Loan Amount</p>
              <p className="text-lg font-bold text-green-700">{formatCurrency(selectedLoan.loanAmount)}</p>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 mt-2 flex flex-wrap gap-4 border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 shadow-sm border border-gray-100">
              <FaCalendarAlt className="text-[#7e9e6c]" />
              <span className="text-sm text-gray-600"><strong>Duration:</strong> {selectedLoan.duration} months</span>
            </div>

          </div>
        </div>

        {/* Amortization Table */}
        <div className="mt-8">
          <h3 className="mb-3 text-lg font-bold text-[#56794a]">Amortization Schedule</h3>
          <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-[#f4f9f4] text-[#56794a]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Month</th>
                  <th className="px-4 py-3 text-center font-semibold">Interest</th>
                  <th className="px-4 py-3 text-center font-semibold">Balance</th>
                  <th className="px-4 py-3 text-center font-semibold">Amortization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {schedule.map((row) => (
                  <tr key={row.month} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-700">{row.month}</td>
                    <td className="px-4 py-2.5 text-center text-gray-600">{formatCurrency(row.interestPayment)}</td>
                    <td className="px-4 py-2.5 text-center text-gray-600">{formatCurrency(row.remainingBalance)}</td>
                    <td className="px-4 py-2.5 text-center font-medium text-gray-800">{formatCurrency(row.totalPayment)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer / Action Area (Sticky Bottom) */}
      <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
        {isSuperAdmin ? (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex-1 max-w-sm">
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Check Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={checkNumber}
                onChange={(e) => setCheckNumber(e.target.value)}
                placeholder="Required for approval"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 transition-all focus:border-[#7e9e6c] focus:outline-none focus:ring-2 focus:ring-[#7e9e6c]/20"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleReject(selectedLoan.id)}
                className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 transition-all hover:bg-red-100 hover:border-red-300 focus:ring-4 focus:ring-red-100"
              >
                <FaTimesCircle />
                Reject
              </button>
              
              <button
                onClick={() => handleApprove(selectedLoan.id)}
                className="flex items-center gap-2 rounded-lg bg-[#56794a] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#46633c] focus:ring-4 focus:ring-[#7e9e6c]/30"
              >
                <FaCheckCircle />
                Approve
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-amber-50 p-3 text-center border border-amber-200">
            <p className="text-sm font-medium text-amber-800">
              Only Super Admins have permission to approve or reject loans.
            </p>
          </div>
        )}
      </div>

    </div>
  </div>
)}
    </div>
  );
}
