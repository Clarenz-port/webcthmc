// src/page/popup/PendingLoanApplications.jsx
import React, { useEffect, useState } from "react";
import { notify } from "../../utils/toast";
import { FaArrowLeft } from "react-icons/fa";
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
    <div className="flex-1 bg-white rounded-lg shadow-lg p-3 relative">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-4 left-4 text-[#5a7350] hover:text-[#7e9e6c] transition text-2xl"
        title="Back"
      >
        <FaArrowLeft />
      </button>

      <div className="max-w-auto p-6">
        <h2 className="text-4xl font-bold text-center text-[#5a7350] mb-4">
          Pending Loan Applications
        </h2>

        {loading ? (
          <p className="text-center text-gray-600 mt-6">Loading pending loans...</p>
        ) : error ? (
          <p className="text-center text-red-600 mt-6">{error}</p>
        ) : pendingLoans.length === 0 ? (
          <p className="text-center text-gray-600 mt-6 border-t border-gray-300 pt-4">No pending loan applications.</p>
        ) : (
          <div className="border-t border-gray-300 pt-4">
            <table className="w-full shadow-lg rounded-lg border border-gray-300 overflow-hidden">
              <thead className="bg-[#7e9e6c] text-white">
                <tr>
                  <th className="py-3 px-4 text-left">Member Name</th>
                  <th className="py-3 px-4 text-left">Purpose</th>
                  <th className="py-3 px-4 text-left">Amount</th>
                  <th className="py-3 px-4 text-left">Duration</th>
                  <th className="py-3 px-4 text-left">Date Applied</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingLoans.map((loan, index) => (
                  <tr
                    key={loan.id || index}
                    className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} `}
                  >
                    <td className="py-3 px-4 border-t border-gray-200">{loan.memberName || "N/A"}</td>
                    <td className="py-3 px-4 border-t border-gray-200">{loan.purpose || "N/A"}</td>
                    <td className="py-3 px-4 border-t border-gray-200">{formatCurrency(loan.loanAmount)}</td>
                    <td className="py-3 px-4 border-t border-gray-200">{loan.duration} months</td>
                    <td className="py-3 px-4 border-t border-gray-200">
                      {loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="py-3 px-4 border-t border-gray-200 text-center">
                      <button
                        onClick={() => {
                          setSelectedLoan(loan);
                          setCheckNumber(""); // reset input when opening
                          computeSchedule(loan);
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
