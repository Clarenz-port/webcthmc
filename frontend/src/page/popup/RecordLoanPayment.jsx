import React, { useState, useEffect } from "react";
import { notify } from "../../utils/toast";
import axios from "axios";

export default function RecordLoanPayment({ isOpen, onClose, member, loanId, onPaymentRecorded }) {
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentDate, setPaymentDate] = useState("");

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setPaymentDate(today);
  }, []);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!amountPaid || parseFloat(amountPaid) <= 0) {
      notify.success("Please enter a valid amount");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:8000/api/loans/payment",
        {
          memberId: member.id,
          loanId,
          amountPaid,
          paymentDate,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      notify.success("Payment recorded successfully!");
      setAmountPaid("");
      onPaymentRecorded(res.data); // update parent schedule
      onClose();
    } catch (err) {
      console.error("❌ Error recording payment:", err.response || err);
      notify.success(err.response?.data?.message || "Failed to record payment");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-[400px] relative">
        <h2 className="text-2xl font-bold text-center text-[#5a7350] mb-4">
          Record Loan Payment
        </h2>

        <p className="mb-2">
          <strong>Member:</strong> {member.firstName} {member.lastName}
        </p>

        <label className="block text-gray-700 mb-1">Amount Paid (₱)</label>
        <input
          type="number"
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 mb-3 focus:ring-2 focus:ring-[#7e9e6c]"
          placeholder="Enter paid amount"
        />

        <label className="block text-gray-700 mb-1">Payment Date</label>
        <input
          type="date"
          value={paymentDate}
          readOnly
          className="w-full border border-gray-300 rounded-md p-2 mb-5 bg-gray-100 text-gray-700 cursor-not-allowed"
        />

        <div className="flex justify-between mt-4">
          <button
            onClick={handleConfirm}
            className="bg-[#7e9e6c] text-white px-4 py-2 rounded-lg hover:bg-[#6a865a] transition"
          >
            Confirm
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
