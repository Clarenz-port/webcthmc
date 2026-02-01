// Approvedloan.jsx
import React, { useEffect, useState } from "react";
import { 
  FiArrowLeft, 
  FiCheckCircle, 
  FiCalendar, 
  FiUser, 
  FiDollarSign, 
  FiClock, 
  FiEye,
  FiFileText,
  FiActivity
} from "react-icons/fi";
import axios from "axios";

export default function Approvedloan({ onBack }) {
  const [loanRecords, setLoanRecords] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper: format currency (PHP)
  const formatCurrency = (num) =>
    typeof num === "number"
      ? num.toLocaleString("en-PH", { style: "currency", currency: "PHP" })
      : num
      ? Number(num).toLocaleString("en-PH", { style: "currency", currency: "PHP" })
      : "₱0.00";

  useEffect(() => {
    const fetchApprovedLoans = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = (localStorage.getItem("token") || "").trim();

        // Primary: try an explicit endpoint for approved loans (create it in backend if you want)
        try {
          const res = await axios.get("http://localhost:8000/api/loans/approved-loans", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (Array.isArray(res.data)) {
            setLoanRecords(res.data);
            return;
          }
        } catch (err) {
          // ignore and fallback to fetching all or pending endpoint
          // console.warn("approved-loans endpoint failed:", err?.response?.status);
        }

        // Fallback: fetch all loans and filter locally (adjust endpoint if you have an admin list)
        const resAll = await axios.get("http://localhost:8000/api/loans/members", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allLoans = Array.isArray(resAll.data) ? resAll.data : resAll.data.loans || [];
        const approved = allLoans.filter((l) =>
  ["approved"].includes(String(l.status).toLowerCase())
);
        setLoanRecords(approved);
      } catch (err) {
        console.error("❌ Error fetching approved loans:", err);
        setError("Failed to load approved loans.");
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedLoans();
  }, []);

  // compute amortization schedule similar to your provided algorithm
  const computeSchedule = async (loan) => {
    const principal = parseFloat(loan.loanAmount) || 0;
    const months = parseInt(loan.duration, 10) || 0;
    const monthlyRate = 0.02;

    // Fetch payments for this loan (optional; we use to determine paid status per month)
    let payments = [];
    try {
      const token = (localStorage.getItem("token") || "").trim();
      const res = await axios.get(`http://localhost:8000/api/loans/${loan.id}/payments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      payments = Array.isArray(res.data) ? res.data.map((p) => parseFloat(p.amountPaid || p.amount || 0)) : [];
    } catch (err) {
      // ignore failures, we'll just compute schedule without paid info
      console.warn("Failed to fetch payments for schedule:", err?.message || err);
    }

    const cumulativePaid = payments.reduce((a, b) => a + b, 0);
    const scheduleData = [];
    let remainingBalance = principal;
    const approvalDate = loan.approvalDate ? new Date(loan.approvalDate) : new Date(loan.createdAt || Date.now());
    const monthlyPrincipal = months > 0 ? principal / months : principal;

    let paidSoFar = 0;
    for (let i = 1; i <= Math.max(1, months); i++) {
      const interestPayment = remainingBalance * monthlyRate;
      // keep equal principal payments (simple amortization approximation used in your sample)
      const principalPayment = monthlyPrincipal;
      let totalPayment = principalPayment + interestPayment;

      // last month adjust rounding/remaining
      if (i === months) {
        totalPayment = remainingBalance + interestPayment;
      }

      const status = cumulativePaid >= paidSoFar + totalPayment ? "Paid" : "Unpaid";

      scheduleData.push({
        month: i,
        interestPayment: Number(interestPayment.toFixed(2)),
        totalPayment: Number(totalPayment.toFixed(2)),
        remainingBalance: Number(remainingBalance.toFixed(2)),
        dueDate: new Date(
          approvalDate.getFullYear(),
          approvalDate.getMonth() + i,
          approvalDate.getDate()
        ),
        status,
      });

      remainingBalance -= principalPayment;
      paidSoFar += totalPayment;
    }

    setSchedule(scheduleData);
  };

    const readCheckNumber = (loan) =>
    loan?.checkNumber ?? loan?.check_number ?? loan?.checkNo ?? loan?.check_no ?? loan?.check ?? "—";

      // generic numeric reader - returns 0 if not found / not numeric
  const getNumber = (loan, ...keys) => {
    if (!loan) return 0;
    for (const key of keys) {
      const val = loan[key];
      if (val !== undefined && val !== null && val !== "") {
        const n = parseFloat(val);
        if (!isNaN(n)) return n;
      }
    }
    return 0;
  };

  const readServiceCharge = (loan) =>
    getNumber(loan, "serviceCharge", "service_charge", "serviceFee", "service_fee", "service_charge_amount");

  const readFilingFee = (loan) =>
    getNumber(loan, "filingFee", "fillingFee", "filing_fee", "filling_fee", "filingFeeAmount");

  const readCapitalBuildup = (loan) =>
    getNumber(loan, "capitalBuildup", "capital_buildup", "capital", "capital_build_up", "capitalBuildUp");

  const readPenalties = (loan) =>
    getNumber(loan, "penalties", "penalty", "penaltyAmount", "penalty_amount", "lateFee", "late_fee");
    
  return (
    <div>
      <div >
  
  {/* HEADER SECTION */}
  <div>
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex mb-2 items-center gap-5">
        <button
          onClick={onBack}
          className="p-3 bg-white border border-gray-100 text-gray-500 hover:text-[#7e9e6c] hover:border-[#7e9e6c] rounded-xl transition-all shadow-sm active:scale-95 group"
          title="Back to Dashboard"
        >
          <FiArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Approved Loans</h2>
        </div>
      </div>
    </div>
  </div>

  {/* CONTENT AREA */}
  <div>
    {loading ? (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 border-4 border-gray-100 border-t-[#7e9e6c] rounded-full animate-spin" />
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Retrieving Approved Records...</p>
      </div>
    ) : error ? (
      <div className="flex flex-col items-center justify-center py-24 text-red-500 bg-red-50 rounded-[2.5rem] border border-red-100">
        <FiFileText size={48} className="mb-4 opacity-20" />
        <p className="font-bold tracking-tight">{error}</p>
      </div>
    ) : loanRecords.filter(record => record.status === "Approved").length === 0 ? (
      <div className="flex flex-col items-center bg-white rounded-t-[2rem] justify-center py-24 text-gray-300">
        <FiFileText size={64} className="mb-4 opacity-10" />
        <p className="font-bold uppercase tracking-widest text-xs italic text-gray-400">No approved loan applications found</p>
      </div>
    ) : (
      <div className="bg-gray-50 rounded-t-[2rem] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-gray-400">
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-left"><div className="flex items-center gap-2"><FiCalendar /> Approval Date</div></th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-left"><div className="flex items-center gap-2"><FiUser /> Member</div></th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-left"><div className="flex items-center gap-2"><FiDollarSign /> Principal</div></th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-left"><div className="flex items-center gap-2"><FiClock /> Term</div></th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-left">Status</th>
              <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loanRecords
              .filter(record => record.status === "Approved")
              .map((record, index) => (
                <tr 
                  key={record.id || index}
                  className="group transition-all duration-300"
                >
                  {/* Date Column */}
                  <td className="px-6 py-5 bg-white ">
                    <span className="text-xs font-bold text-gray-500">
                      {record.approvalDate ? new Date(record.approvalDate).toLocaleDateString("en-PH", { month: 'short', day: 'numeric', year: 'numeric' }) : "—"}
                    </span>
                  </td>

                  {/* Member Column */}
                  <td className="px-6 py-5 bg-white">
                    <p className="text-sm font-black text-gray-800 uppercase tracking-tight">
                      {record.memberName || record.name || record.firstName || "N/A"}
                    </p>
                  </td>

                  {/* Amount Column */}
                  <td className="px-6 py-5 bg-white">
                    <span className="text-sm font-black text-[#7e9e6c] font-mono">
                      {formatCurrency(record.loanAmount)}
                    </span>
                  </td>

                  {/* Repayment Column */}
                  <td className="px-6 py-5 bg-white">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                      <span className="px-2 py-1 bg-white border border-gray-100 rounded-lg shadow-sm">
                        {record.duration ? `${record.duration} mos` : "N/A"}
                      </span>
                    </div>
                  </td>

                  {/* Status Column */}
                  <td className="px-6 py-5 bg-white">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-[#d6ead8] text-[#7e9e6c] rounded-full w-fit">
                      <FiCheckCircle size={12} />
                      <span className="text-[10px] font-black uppercase tracking-tighter">
                        {record.status}
                      </span>
                    </div>
                  </td>

                  {/* View Action Column */}
                  <td className="px-6 py-5 bg-white text-center">
                    <button
                      onClick={() => {
                        setSelectedLoan(record);
                        computeSchedule(record);
                      }}
                      className="p-3 bg-white border border-gray-100 text-[#7e9e6c] rounded-xl hover:bg-[#7e9e6c] hover:text-white hover:border-[#7e9e6c] transition-all shadow-sm active:scale-90"
                      title="View Loan Schedule"
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
  
  </div>
</div>

      {/* Loan Details Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 flex bg-black/45 justify-center items-center z-50 px-4 transition-opacity duration-300">
  {/* Modal Container */}
  <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
    
    {/* Header Section (Sticky) */}
    <div className="flex justify-between items-center px-8 py-5 border-b border-gray-100 bg-gray-50/80 sticky top-0 z-10">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Loan Details</h2>
        <p className="text-sm text-gray-500 mt-1">Review loan terms and amortization schedule</p>
      </div>
      <button 
        onClick={() => setSelectedLoan(null)} 
        className="p-2 bg-white border border-gray-200 rounded-full text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all duration-200"
      >
        {/* Modern Close Icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    {/* Scrollable Content */}
    <div className="overflow-y-auto p-8 custom-scrollbar">
      
      {/* 1. KEY DETAILS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        
        {/* Main Stat Card */}
        <div className="bg-green-50 rounded-xl p-5 border border-green-100 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-green-600 mb-1">Total Loan Amount</p>
          <p className="text-3xl font-bold text-green-800">{formatCurrency(selectedLoan.loanAmount)}</p>
        </div>

        {/* Info Group 1 */}
        <div className="col-span-1 md:col-span-3 bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-wrap gap-y-4 gap-x-8 items-center">
            <div>
              <p className="text-xs text-gray-500 uppercase">Purpose</p>
              <p className="font-medium text-gray-800">{selectedLoan.purpose || "N/A"}</p>
            </div>
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Check Number</p>
              <p className="font-medium text-gray-800">{readCheckNumber(selectedLoan) || "—"}</p>
            </div>
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Service Fee</p>
              <p className="font-medium text-gray-800">₱{selectedLoan.serviceCharge}</p>
            </div>
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Filing Fee</p>
              <p className="font-medium text-gray-800">₱{selectedLoan.filingFee}</p>
            </div>
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Build up</p>
              <p className="font-medium text-gray-800">₱{selectedLoan.capitalBuildUp}</p>
            </div>
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Timeline</p>
              <p className="font-medium text-gray-800 text-sm">
                {selectedLoan.startMonth || "N/A"} <span className="text-gray-400">→</span> {selectedLoan.endMonth || "N/A"}
              </p>
            </div>
        </div>
      </div>

      {/* 2. AMORTIZATION TABLE */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Amortization Schedule
        </h3>

        <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs uppercase tracking-wide">
                <th className="py-3 px-4 text-left font-semibold">Month</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-500">Interest</th>
                <th className="py-3 px-4 text-right font-semibold text-red-400">Penalties</th>
                <th className="py-3 px-4 text-right font-semibold text-gray-800">Balance</th>
                <th className="py-3 px-4 text-right font-bold text-green-700 bg-green-50/50">Amortization</th>
                <th className="py-3 px-4 text-center font-semibold">Due Date</th>
                <th className="py-3 px-4 text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {schedule.map((row) => (
                <tr key={row.month} className="hover:bg-green-50/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-900">{row.month}</td>
                  <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(row.interestPayment)}</td>
                  <td className="py-3 px-4 text-right text-red-500">{formatCurrency(readPenalties(selectedLoan))}</td>
                  <td className="py-3 px-4 text-right text-gray-700 font-medium">{formatCurrency(row.remainingBalance)}</td>
                  <td className="py-3 px-4 text-right font-bold text-green-700 bg-green-50/30">{formatCurrency(row.totalPayment)}</td>
                  <td className="py-3 px-4 text-center text-gray-500 text-xs">
                    {row.dueDate ? new Date(row.dueDate).toLocaleDateString("en-PH") : "N/A"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.status === "Paid" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                         Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                        {row.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  </div>
</div>
      )}
    </div>
  );
}
