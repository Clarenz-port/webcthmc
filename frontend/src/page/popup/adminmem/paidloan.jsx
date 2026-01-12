import React, { useState, useEffect } from "react";
import { notify } from "../../../utils/toast";
import axios from "axios";

export default function PaidLoanPopup({ isOpen, onClose, member, onUpdateLoan }) {
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  const getManilaNow = () => {
    const now = new Date();
    return new Date(now.getTime());
  };

  const formatManilaForDisplay = (isoOrDate) => {
    if (!isoOrDate) return "";
    const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
    try {
      return d.toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return d.toString();
    }
  };

  useEffect(() => {
    if (!isOpen || !member?.loan) return;

    const loan = member.loan;
    const monthlyRate = 0.02;
    const months = parseInt(loan.duration) || 1;
    const principal = parseFloat(loan.loanAmount) || 0;
    const bal1 = parseFloat(loan.remainbalance) || 0;
    const newba = parseFloat(loan.loanball) || 0;
    const remainingPayments = months - (loan.paymentsMade || 0);

    const principalPayment = principal / months;
    const interest =
      remainingPayments === months ? principal * monthlyRate : newba * monthlyRate;

    const amortization = principalPayment + interest;
    const amountToPay =
      remainingPayments === 1 ? parseFloat(loan.remainbalance).toFixed(2) : amortization.toFixed(2);
    setPaidAmount(amountToPay);

    // Use Manila now for paymentDate
    const manilaNow = getManilaNow();
    const manilaIso = manilaNow.toISOString(); // ISO representing the Manila-local instant
    setPaymentDate(manilaIso);

    const nextDue = loan.dueDate;
    setDueDate(nextDue);
  }, [isOpen, member]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!paidAmount || paidAmount <= 0) {
      notify.success("Paid amount must be greater than zero.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // Compute next due based on current stored loan.dueDate (adjust with Manila offset)
      const currentDue = member?.loan?.dueDate ? new Date(member.loan.dueDate) : new Date();
      // If your DB stores UTC and you want Manila, add +8h
      const currentDueManila = new Date(currentDue.getTime() + 8 * 60 * 60 * 1000);
      const nextDue = new Date(currentDueManila);
      nextDue.setMonth(currentDueManila.getMonth() + 1);

      const formattedNextDue = nextDue.toISOString();

      const res = await axios.post(
        "http://localhost:8000/api/loans/payment",
        {
          memberId: member.id,
          loanId: member.loan.id,
          amountPaid: parseFloat(paidAmount),
          paymentDate: paymentDate, // already Manila ISO
          dueDate: formattedNextDue, // Manila ISO
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onUpdateLoan && onUpdateLoan(res.data.loan);
      onClose();
      notify.success(
        `Payment of ₱${paidAmount} recorded successfully! Next due: ${formatManilaForDisplay(
          formattedNextDue
        )}`
      );
    } catch (err) {
      console.error("❌ Error recording payment:", err);
      notify.success(err.response?.data?.message || "Failed to record payment.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/45 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-[400px] relative">
        <div className="border-b mb-4 border-[#dce9dd]">
          <h2 className="text-2xl font-bold text-[#5a7350] mb-4 text-center">
            Record Loan Payment
          </h2>
        </div>
        <p className="text-lg mb-2">
          <strong>Name:</strong> {member.firstName} {member.lastName}
        </p>

        <label className="block text-gray-700 text-lg mt-3 mb-1">Paid Amount (₱)</label>
        <input
          type="number"
          value={paidAmount}
          readOnly
          className="w-full border shadow-md border-gray-300 rounded-md p-2 mb-3 bg-gray-100 text-gray-700 cursor-not-allowed"
        />

        <label className="block text-gray-700 text-lg mb-1">Payment Date</label>
        <input
          type="text"
          value={formatManilaForDisplay(paymentDate)}
          readOnly
          className="w-full border shadow-md border-gray-300 rounded-md p-2 mb-3 bg-gray-100 text-gray-700 cursor-not-allowed"
        />

        <label className="block text-gray-700 text-lg mb-1">Next Due Date</label>
        <input
          type="text"
          value={formatManilaForDisplay(dueDate)}
          readOnly
          className="w-full border shadow-md border-gray-300 rounded-md p-2 mb-5 bg-gray-100 text-gray-700 cursor-not-allowed"
        />

        <div className="border-t border-[#dce9dd]">
          <div className="flex justify-between mt-4">
            <button
              onClick={handleConfirm}
              className="bg-[#7e9e6c] shadow-md text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#6a865a] transition"
            >
              Confirm
            </button>
            <button
              onClick={onClose}
              className="bg-white shadow-md border border-[#e6b6a6] text-[#c55f4f]  px-4 py-2 rounded-lg font-semibold hover:bg-[#f8f2f1] transition"
            >
              Cancel
            </button>
          </div>

        </div>
    
      </div>
    </div>
  );
}
