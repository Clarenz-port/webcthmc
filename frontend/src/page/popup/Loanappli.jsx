// src/page/popup/LoanApplication.jsx
import React, { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import axios from "axios";

export default function LoanApplication({ onBack, memberId = null, memberName = null, onLoanUpdated = null }) {
  const [loanRecords, setLoanRecords] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          response = await axios.get(`/api/loans/member/${memberId}`, {
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
          response = await axios.get("/api/loans/members", {
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
    const principal = parseFloat(loan.loanAmount) || 0;
    const months = parseInt(loan.duration) || 0;
    const monthlyRate = 0.02; // 2% monthly

    // Fetch payments for this loan
    let payments = [];
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/loans/${loan.id}/payments`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (Array.isArray(res.data)) payments = res.data;
      else if (Array.isArray(res.data?.payments)) payments = res.data.payments;
    } catch (err) {
      console.warn("Failed to fetch payments:", err);
    }

    const paymentsNums = payments.map((p) => parseFloat(p.amountPaid ?? p.amount ?? 0) || 0);
    const cumulativePaid = paymentsNums.reduce((a, b) => a + b, 0);

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

      const status = cumulativePaid >= paidSoFar + totalPayment ? "Paid" : "Unpaid";

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

    setSchedule(scheduleData);
    setSelectedLoan(loan);
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
    <div>


      <div className="max-w-auto rounded-lg bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-[#7e9e6c]">Loan History</h3>
        </div>

        {loading ? (
          <p className="text-center text-gray-600 mt-6">Loading loan records...</p>
        ) : error ? (
          <p className="text-center text-red-600 mt-6">{error}</p>
        ) : loanRecords.length === 0 ? (
          <p className="text-center text-gray-600 mt-6">No loan records found.</p>
        ) : (
          <div className="overflow-auto shadow-md border-gray-400 border rounded-lg">
            
            <table className="w-full text-sm">
              <thead className="bg-[#d6ead8]">
                <tr>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Loan Amount (₱)</th>
                  <th className="py-3 px-4 text-left">Repayment</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-center">View</th>
                </tr>
              </thead>
              <tbody>
                {loanRecords.map((record, index) => (
                  <tr
                    key={record.id ?? index}
                    className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} `}
                  >
                    <td className="py-3 px-4 border-t border-gray-400">
                      {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="py-3 px-4 border-t border-gray-400">{formatCurrency(record.loanAmount)}</td>
                    <td className="py-3 px-4 border-t border-gray-400">{record.duration ? `${record.duration} months` : "N/A"}</td>
                    <td
                      className={`py-3 px-4 border-t border-gray-400 font-semibold ${
                        (record.status || "").toLowerCase() === "paid"
                          ? "text-blue-600"
                          : (record.status || "").toLowerCase() === "approved"
                          ? "text-green-600"
                          : (record.status || "").toLowerCase() === "pending"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {record.status || "N/A"}
                    </td>
                    <td className="py-3 px-4 border-t border-gray-400 text-center">
                      <button
                        onClick={() => computeSchedule(record)}
                        className="px-3 py-1 shadow-lg border border-gray-400 rounded"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
          </div>
          
        )} 
        {/* Close */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onBack}
            className="bg-[#b8d8ba] text-white px-6 py-2 rounded-lg hover:bg-[#8fa182]"
          >
            Close
          </button>
        </div>
      </div>

      {/* Loan Details Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 px-4">
          <div className="bg-white rounded-2xl w-[900px] max-h-[85vh] overflow-y-auto shadow-2xl relative p-8">
            <button onClick={() => setSelectedLoan(null)} className="absolute top-3 right-5 text-gray-500 hover:text-black text-3xl">
              &times;
            </button>

            <h2 className="text-2xl font-bold text-center text-[#7e9e6c] mb-4">Loan Detailsa</h2>

            <div className="space-y-3 text-gray-700">
              <p><strong>Purpose:</strong> {selectedLoan.purpose || "N/A"}</p>
              <p><strong>Loan Amount:</strong> {formatCurrency(selectedLoan.loanAmount)}</p>
              <p><strong>Duration:</strong> {selectedLoan.duration} months</p>
              <p><strong>Start Month:</strong> {selectedLoan.startMonth || "N/A"}</p>
              <p><strong>End Month:</strong> {selectedLoan.endMonth || "N/A"}</p>

              {/* <-- NEW: show check number if present */}
              <p><strong>Check Number:</strong> {readCheckNumber(selectedLoan)}</p>

              <hr className="my-3" />

              <h3 className="text-xl font-bold text-[#56794a] mb-2">Amortization Schedule</h3>

              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#f4f9f4] text-[#56794a] border-b">
                    <th className="py-2 px-2 text-left">Month</th>
                    <th className="py-2 px-2 text-right">Interest</th>
                    <th className="py-2 px-2 text-right">Service Fee</th>
                    <th className="py-2 px-2 text-right">Filing Fee</th>
                    <th className="py-2 px-2 text-right">Build up</th>
                    <th className="py-2 px-2 text-right">Penalties</th>
                    <th className="py-2 px-2 text-right">Balance</th>
                    <th className="py-2 px-2 text-right">Amortization</th>
                    <th className="py-2 px-2 text-center">Due Date</th>
                    <th className="py-2 px-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((row) => (
                    <tr key={row.month} className="border-b hover:bg-[#f9fcf9]">
                      <td className="py-1 px-2">{row.month}</td>
                      <td className="py-1 px-2 text-right">{formatCurrency(row.interestPayment)}</td>
                      <td className="py-2 px-2 text-right font-medium">{formatCurrency(readServiceCharge(selectedLoan))}</td>
                      <td className="py-2 px-2 text-right font-medium">{formatCurrency(readFilingFee(selectedLoan))}</td>
                      <td className="py-2 px-2 text-right font-medium">{formatCurrency(readCapitalBuildup(selectedLoan))}</td>
                      <td className="py-2 px-2 text-right font-medium">{formatCurrency(readPenalties(selectedLoan))}</td>
                      <td className="py-1 px-2 text-right">{formatCurrency(row.remainingBalance)}</td>
                      <td className="py-1 px-2 text-right">{formatCurrency(row.totalPayment)}</td>
                      <td className="py-1 px-2 text-center">{row.dueDate ? new Date(row.dueDate).toLocaleDateString("en-PH") : "N/A"}</td>
                      <td className="py-1 px-2 text-center">
                        {row.status === "Paid" ? <span className="text-blue-600 font-semibold">{row.status}</span> : <span className="text-red-600">{row.status}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                
              </table>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
