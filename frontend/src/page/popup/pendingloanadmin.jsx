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
import axios from "axios";

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

      const res = await axios.get("http://localhost:8000/api/loans/pending-loans", {
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
      const res = await axios.get(`/api/loans/${loan.id}/payments`, {
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
      if (!checkNumber || String(checkNumber).trim() === "") {
        notify.success("Please enter check number before approving.");
        return;
      }
      const token = localStorage.getItem("token");
      if (!token) {
        notify.success("Not authenticated.");
        return;
      }

      const endpoint = `http://localhost:8000/api/loans/loan/${loanId}/approve`;
      const res = await axios.post(
        endpoint,
        { checkNumber: String(checkNumber).trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      notify.success(res.data?.message || "Loan approved");
      fetchPendingLoans();
      setSelectedLoan(null);
      setCheckNumber("");
    } catch (err) {
      console.error("❌ Approve failed:", err);
      notify.success(err.response?.data?.message || "Approve failed");
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
      const endpoint = `http://localhost:8000/api/loans/loan/${loanId}/reject`;
      const res = await axios.post(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
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
                    className="p-3 bg-white border border-gray-100 text-[#7e9e6c] rounded-xl hover:bg-[#7e9e6c] hover:text-white hover:border-[#7e9e6c] transition-all shadow-sm active:scale-90"
                    title="Review Application"
                  >
                    <FiEye size={18} />
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
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-[820px] max-h-[85vh] overflow-y-auto shadow-2xl relative p-6">
            <button
              onClick={() => {
                setSelectedLoan(null);
                setCheckNumber("");
              }}
              className="absolute top-3 right-5 text-gray-500 hover:text-black text-3xl"
            >
              &times;
            </button>

            <h2 className="text-2xl font-bold text-center text-[#7e9e6c] mb-4">Loan Application Details</h2>

            <div className="space-y-3 text-gray-700">
              <p><strong>Member:</strong> {selectedLoan.memberName}</p>
              <p><strong>Address:</strong> {selectedLoan.address}</p>
              <p><strong>Purpose:</strong> {selectedLoan.purpose}</p>
              <p><strong>Loan Amount:</strong> {formatCurrency(selectedLoan.loanAmount)}</p>
              <p><strong>Duration:</strong> {selectedLoan.duration} months</p>
              <p><strong>Start Month:</strong> {selectedLoan.startMonth}</p>
              <p><strong>End Month:</strong> {selectedLoan.endMonth}</p>

              <hr className="my-3" />

              <h3 className="text-xl font-bold text-[#56794a] mb-2">Amortization Schedule</h3>

              <div className="overflow-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#f4f9f4] text-[#56794a] border-b">
                      <th className="py-2 px-2 text-left">Month</th>
                      <th className="py-2 px-2 text-right">Interest</th>
                      <th className="py-2 px-2 text-right">Balance</th>
                      <th className="py-2 px-2 text-right">Amortization</th>
                      <th className="py-2 px-2 text-center">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((row) => (
                      <tr key={row.month} className="border-b ">
                        <td className="py-1 px-2">{row.month}</td>
                        <td className="py-1 px-2 text-right">{formatCurrency(row.interestPayment)}</td>
                        <td className="py-1 px-2 text-right">{formatCurrency(row.remainingBalance)}</td>
                        <td className="py-1 px-2 text-right">{formatCurrency(row.totalPayment)}</td>
                        <td className="py-1 px-2 text-center">{row.dueDate ? new Date(row.dueDate).toLocaleDateString("en-PH") : "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Check number input (required before approve) */}
              {isSuperAdmin && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Check Number (required to approve)</label>
                  <input
                    type="text"
                    value={checkNumber}
                    onChange={(e) => setCheckNumber(e.target.value)}
                    placeholder="Enter check number"
                    className="w-full border px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                </div>
              )}

              {isSuperAdmin ? (
                <div className="flex justify-center mt-6 space-x-4">
                  <button
                    onClick={() => handleApprove(selectedLoan.id)}
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => handleReject(selectedLoan.id)}
                    className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <p className="text-center text-red-600 font-semibold mt-4">Only SuperAdmins can approve or reject loans.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
