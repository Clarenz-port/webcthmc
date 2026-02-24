// src/page/popup/LoanApplication.jsx
import React, { useEffect, useState } from "react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FiEye} from "react-icons/fi";
import { FaArrowLeft } from "react-icons/fa";
import API from '../../apis/axios.js';

export default function LoanApplication({ onBack, memberId = null, memberName = null, onLoanUpdated = null }) {
  const [loanRecords, setLoanRecords] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleDownloadPDF = () => {
  if (!selectedLoan) return;

  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text("Loan Application Details", 14, 16);

  // Member Info
  doc.setFontSize(12);
  doc.text(`Member Name: ${selectedLoan.memberName || "N/A"}`, 14, 28);
  doc.text(`Address: ${selectedLoan.address || "N/A"}`, 14, 36);

  // Purpose
  doc.text(`Purpose: ${selectedLoan.purpose || "N/A"}`, 14, 44);
  doc.text(`Amount: ${selectedLoan.loanAmount || "N/A"}`, 14, 52);

  // Agreement
  doc.setFontSize(14);
  doc.text("Agreement:", 14, 62);
  doc.setFontSize(12);
  doc.text(
    `           I hereby promise to pay Carmona Townhomes Homeowners Multi-purpose Cooperative the sum of ${selectedLoan.loanAmount || "N/A"} pesos for ${selectedLoan.duration || "N/A"} month(s) starting next month ${selectedLoan.startMonth || "N/A"} to ${selectedLoan.endMonth || "N/A"}.`,
    14,
    72,
    { maxWidth: 180 }
  );

  // Amortization Details
  doc.setFontSize(14);
  doc.text("Amortization Details:", 14, 95);
  doc.setFontSize(12);
  doc.text(`2% Loan Interest: ${(selectedLoan.interest || 0)}`, 14, 114);
  doc.text(`2% Service Charge: ${(selectedLoan.serviceCharge || 0)}`, 14, 122);
  doc.text(`1% Filing Fee: ${(selectedLoan.filingFee || 0)}`, 14, 130);
  doc.text(`2% Capital Build-Up: ${(selectedLoan.capitalBuildUp || 0)}`, 14, 138);
  doc.text(`Net Amount: ${(selectedLoan.netAmount || 0)}`, 14, 146);

  doc.save("LoanApplication.pdf");
};

  // helper: currency
  const formatCurrency = (num) =>
    num || num === 0
      ? Number(num).toLocaleString("en-PH", { style: "currency", currency: "PHP" })
      : "₱0.00";

  useEffect(() => {
    let mounted = true;
    const fetchLoanHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        let response;

        if (memberId) {
          response = await API.get(`/api/loans/member/${memberId}`, {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            validateStatus: null,
          });

          if (response.status === 204 || response.status === 404) {
            if (!mounted) return;
            setLoanRecords([]);
            setError(null);
            return;
          }

          if (response.status >= 400) {
            throw new Error(`Server returned ${response.status}`);
          }

          const payload = response.data;
          const arr = [];

          if (Array.isArray(payload)) {
            arr.push(...payload);
          } else if (payload?.loan) {
            arr.push(payload.loan);
          } else if (payload?.loans) {
            arr.push(...payload.loans);
          } else if (payload && typeof payload === "object" && Object.keys(payload).length === 0) {
            // empty object -> no records
          } else if (payload && (payload.message || payload.error)) {
            // backend returned a message -> treat as empty
          } else if (payload && (payload.id || payload.loanAmount || payload.createdAt)) {
            arr.push(payload);
          }

          if (!mounted) return;
          const cleaned = arr.filter(Boolean);
          setLoanRecords(cleaned);
          setError(null);
        } else {
          response = await API.get("/api/loans/members", {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            validateStatus: null,
          });

          if (response.status === 204 || response.status === 404) {
            if (!mounted) return;
            setLoanRecords([]);
            setError(null);
            return;
          }

          if (response.status >= 400) throw new Error(`Server returned ${response.status}`);

          const arr = Array.isArray(response.data) ? response.data : response.data?.loans ?? [];
          if (!mounted) return;
          setLoanRecords(arr);
          setError(null);
        }
      } catch (err) {
        console.error("❌ Error fetching loan history:", err);
        if (mounted) {
          setLoanRecords([]);
          setError("Failed to load loan records.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchLoanHistory();
    return () => {
      mounted = false;
    };
  }, [memberId, onLoanUpdated]);

  // compute amortization schedule for a loan
  const computeSchedule = async (loan) => {
  try {
    const token = localStorage.getItem("token");
    const res = await API.get(`/api/loans/${loan.id}/amortization`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    setSchedule(Array.isArray(res.data) ? res.data : []);
    setSelectedLoan(loan);
  } catch (err) {
    setSchedule([]);
    setSelectedLoan(loan);
  }
};

  // allow parent to update loan in this list
  const handleLoanUpdateLocal = (updatedLoan) => {
    setLoanRecords((prev) => prev.map((l) => (l.id === updatedLoan.id ? { ...l, ...updatedLoan } : l)));
    if (typeof onLoanUpdated === "function") onLoanUpdated(updatedLoan);
  };

  // helper to read check number from different possible fields
    // helper to read check number from different possible fields
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

  const computeTotalDue = (loan) => {
    const principal = parseFloat(loan?.loanAmount) || 0;
    return principal + readServiceCharge(loan) + readFilingFee(loan) + readCapitalBuildup(loan) + readPenalties(loan);
  };

  return (
    <div >


      <div className="max-w-6xl mx-auto rounded-xl bg-white shadow-sm border border-gray-100 p-8">
  {/* Header Section */}
  <div className="flex items-center justify-between mb-8">
    <div>
      <h3 className="text-2xl font-extrabold text-[#56794a] tracking-tight">Loan History</h3>
    </div>
    <div className="h-1 w-20 bg-[#7e9e6c] rounded-full"></div>
  </div>
<div>
  {loading ? (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7e9e6c]"></div>
      <p className="text-gray-500 mt-4 font-medium">Fetching your records...</p>
    </div>
  ) : error ? (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
      {error}
    </div>
  ) : loanRecords.length === 0 ? (
    <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
      <p className="text-gray-500 font-medium">No loan records found in your history.</p>
    </div>
  ) : (
    <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Date Applied</th>
            <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
            <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Term</th>
            <th className="py-4 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
            <th className="py-4 px-6 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loanRecords.map((record, index) => {
            const status = (record.status || "").toLowerCase();
            const statusStyles = {
              paid: "bg-blue-50 text-blue-700 border-blue-100",
              approved: "bg-green-50 text-green-700 border-green-100",
              pending: "bg-yellow-50 text-yellow-700 border-yellow-100",
              rejected: "bg-red-50 text-red-700 border-red-100",
            };

            return (
              <tr key={record.id ?? index} className="hover:bg-gray-50/50 transition-colors group">
                <td className="py-4 px-6 text-sm text-gray-700 font-medium">
                  {record.createdAt ? new Date(record.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
                </td>
                <td className="py-4 px-6 text-sm text-[#7e9e6c] font-bold">
                  {formatCurrency(record.loanAmount)}
                </td>
                <td className="py-4 px-6 text-sm text-gray-600">
                  {record.duration ? `${record.duration} Months` : "N/A"}
                </td>
                <td className="py-4 px-6">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusStyles[status] || "bg-gray-50 text-gray-600"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      status === 'approved' ? 'bg-green-500' : status === 'pending' ? 'bg-yellow-500' : status === 'paid' ? 'bg-blue-500' : 'bg-red-500'
                    }`}></span>
                    {(record.status || "N/A").toUpperCase()}
                  </span>
                </td>
                <td className="py-4 px-6 text-center">
             
                  <button
                    onClick={() => computeSchedule(record)}
                    className="p-2 text-gray-400 hover:text-[#7e9e6c] hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-gray-100 transition-all"
                    title="View Details"
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
  )}
</div>
  {/* Footer / Close Action */}
  <div className="mt-8 flex justify-end ">
    <button
      onClick={onBack}
      className="bg-[#b8d8ba] text-white px-6 py-2 rounded-lg hover:bg-[#8fa182] hover:shadow-lg transition-all active:scale-95"
      >
      Close
    </button>
  </div>
</div>

      {/* Loan Details Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 flex bg-black/20 justify-center items-center z-50 px-4 transition-opacity duration-300">
  {/* Modal Container */}
  <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
    
    {/* Header Section (Sticky) */}
    <div className="flex justify-between items-center px-8 py-5 border-b border-gray-100 bg-gray-50/80 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold text-[#56794a]">Loan Details</h2>
       
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
  {schedule.map((row, idx) => (
    <tr key={row.month || idx} className="hover:bg-green-50/30 transition-colors">
      <td className="py-3 px-4 font-medium text-gray-900">{row.month}</td>
      <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(row.interest ?? row.interestPayment)}</td>
      <td className="py-3 px-4 text-right text-red-500">{formatCurrency(row.penalty ?? 0)}</td>
      <td className="py-3 px-4 text-right text-gray-700 font-medium">{formatCurrency(row.balance ?? row.remainingBalance)}</td>
      <td className="py-3 px-4 text-right font-bold text-green-700 bg-green-50/30">{formatCurrency(row.amortization ?? row.totalPayment)}</td>
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
      {/* Download Form Button: Only show if user is member */}
        {(() => {
          const role = localStorage.getItem("role");
          if (role === "member") {
            return (
            <button
  className="mt-3 px-4 py-2 bg-[#7e9e6c] text-white rounded-lg shadow-sm hover:bg-[#46633c] transition-all text-sm font-semibold flex items-center gap-2"
  onClick={handleDownloadPDF}
  title="Download Loan Form"
  disabled={selectedLoan?.status === "Pending"}
  style={selectedLoan?.status === "Pending" ? { opacity: 0.5, cursor: "not-allowed" } : {}}
>
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16h16V4H4zm4 8v4m0 0l4-4m-4 4l-4-4" />
  </svg>
  Download Form
</button>
            );
          }
          return null;
        })()}
      
    </div>
  </div>
</div>
      )}
    </div>
  );
}
