// Approvedloan.jsx
import React, { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
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
  ["approved", "paid"].includes(String(l.status).toLowerCase())
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
    <div className="flex-1 bg-white rounded-lg shadow-lg p-3 relative">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 text-[#5a7350] hover:text-[#7e9e6c] transition text-2xl"
        title="Back"
      >
        <FaArrowLeft />
      </button>

      <div className="max-w-auto p-6">
        <h2 className="text-4xl font-bold text-center text-[#5a7350] mb-4">Approved Loans</h2>

        {loading ? (
          <p className="text-center text-gray-600 mt-6">Loading approved loans...</p>
        ) : error ? (
          <p className="text-center text-red-600 mt-6">{error}</p>
        ) : loanRecords.length === 0 ? (
          <p className="text-center border-t border-gray-300 pt-4 text-gray-600 mt-6">No approved loans found.</p>
        ) : (
          <div className="border-t border-gray-300 pt-4">
            <table className="w-full shadow-lg rounded-lg border border-gray-300 rounded-lg overflow-hidden text-sm">
              <thead className="bg-[#7e9e6c] text-white">
                <tr>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Member</th>
                  <th className="py-3 px-4 text-left">Loan Amount</th>
                  <th className="py-3 px-4 text-left">Repayment</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-center">View</th>
                </tr>
              </thead>
              <tbody>
                {loanRecords.map((record, index) => (
                  <tr
                    key={record.id || index}
                    className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} `}
                  >
                    <td className="py-3 px-4 border-t border-gray-200">
                      {record.approvalDate ? new Date(record.approvalDate).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="py-3 px-4 border-t border-gray-200">
                      {record.memberName || record.name || record.firstName || "N/A"}
                    </td>
                    <td className="py-3 px-4 border-t border-gray-200">{formatCurrency(record.loanAmount)}</td>
                    <td className="py-3 px-4 border-t border-gray-200">{record.duration ? `${record.duration} months` : "N/A"}</td>
                  <td
                    className={`py-3 px-4 border-t border-gray-200 font-semibold ${
                      record.status === "Paid"
                        ? "text-blue-600"
                        : record.status === "Approved"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {record.status}
                  </td>
                    <td className="py-3 px-4 border-t border-gray-200 text-center">
                      <button
                        onClick={() => {
                          setSelectedLoan(record);
                          computeSchedule(record);
                        }}
                        className="bg-[#7e9e6c] text-white px-3 py-1 rounded hover:bg-[#6a8b5a]"
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
      </div>

      {/* Loan Details Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl w-[700px] max-h-[85vh] overflow-y-auto shadow-2xl relative p-8">
            <button
              onClick={() => {
                setSelectedLoan(null);
                setSchedule([]);
              }}
              className="absolute top-3 right-5 text-gray-500 hover:text-black text-3xl"
            >
              &times;
            </button>

            <h2 className="text-2xl font-bold text-center text-[#7e9e6c] mb-4">Loan Details</h2>

            <div className="space-y-3 text-gray-700">
              <p><strong>Member:</strong> {selectedLoan.memberName || selectedLoan.name || "N/A"}</p>
              <p><strong>Purpose:</strong> {selectedLoan.purpose || "N/A"}</p>
              <p><strong>Loan Amount:</strong> {formatCurrency(selectedLoan.loanAmount)}</p>
              <p><strong>Duration:</strong> {selectedLoan.duration ? `${selectedLoan.duration} months` : "N/A"}</p>
              <p><strong>Start Month:</strong> {selectedLoan.startMonth || "N/A"}</p>
              <p><strong>End Month:</strong> {selectedLoan.endMonth || "N/A"}</p>
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
                    <tr key={row.month} className="border-b ">
                      <td className="py-1 px-2">{row.month}</td>
                      <td className="py-1 px-2 text-right">{formatCurrency(row.interestPayment)}</td>
                      <td className="py-2 px-2 text-right font-medium">{formatCurrency(readServiceCharge(selectedLoan))}</td>
                      <td className="py-2 px-2 text-right font-medium">{formatCurrency(readFilingFee(selectedLoan))}</td>
                      <td className="py-2 px-2 text-right font-medium">{formatCurrency(readCapitalBuildup(selectedLoan))}</td>
                      <td className="py-2 px-2 text-right font-medium">{formatCurrency(readPenalties(selectedLoan))}</td>
                      <td className="py-1 px-2 text-right">{formatCurrency(row.remainingBalance)}</td>
                      <td className="py-1 px-2 text-right">{formatCurrency(row.totalPayment)}</td>
                      <td className="py-1 px-2 text-center">
                        {row.dueDate ? new Date(row.dueDate).toLocaleDateString("en-PH") : "N/A"}
                      </td>
                      <td className="py-1 px-2 text-center">
                        {row.status === "Paid" ? (
                          <span className="text-blue-600 font-semibold">{row.status}</span>
                        ) : (
                          <span className="text-red-600">{row.status}</span>
                        )}
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
