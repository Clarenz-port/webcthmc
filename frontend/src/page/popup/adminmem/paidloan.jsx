import React, { useState, useEffect } from "react";
import { notify } from "../../../utils/toast";
import axios from "axios";
import { FaUser, FaWallet, FaCalendarCheck, FaHourglassEnd, FaCheckCircle, FaTimesCircle, FaReceipt } from "react-icons/fa";

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
    <div className="fixed inset-0 bg-black/45 flex justify-center items-center z-50 p-4">
  <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[420px] overflow-hidden animate-in fade-in zoom-in duration-200">
    
    {/* HEADER SECTION */}
    <div className="bg-[#f8faf7] px-8 py-6 border-b border-[#7e9e6c]/10 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-[#7e9e6c]/10 text-[#5a7350] rounded-full mb-3">
        <FaReceipt size={24} />
      </div>
      <h2 className="text-2xl font-black text-[#5a7350] tracking-tight">
        Payment Summary
      </h2>
      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Loan Transaction Record</p>
    </div>

    <div className="p-8">
      {/* MEMBER INFO CARD */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-6">
        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#7e9e6c]">
          <FaUser size={18} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase">Account Name</p>
          <p className="text-lg font-bold text-gray-800">
            {member.firstName} {member.lastName}
          </p>
        </div>
      </div>

      {/* DATA FIELDS */}
      <div className="space-y-4">
        {/* Paid Amount */}
        <div className="relative">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-2 ml-1">
            <FaWallet className="text-[#7e9e6c]" /> Paid Amount
          </label>
          <div className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-gray-400 font-bold text-lg">₱</span>
            <span className="text-xl font-black text-gray-800 tracking-tight">
              {Number(paidAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Payment Date */}
        <div className="relative">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-2 ml-1">
            <FaCalendarCheck className="text-[#7e9e6c]" /> Payment Date
          </label>
          <div className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
            <span className="text-sm font-bold text-gray-700">
              {formatManilaForDisplay(paymentDate)}
            </span>
          </div>
        </div>

        {/* Next Due Date */}
        <div className="relative">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-2 ml-1">
            <FaHourglassEnd className="text-[#7e9e6c]" /> Next Due Date
          </label>
          <div className="w-full bg-[#fdfcfb] border border-orange-100 rounded-xl px-4 py-3 flex justify-between items-center">
            <span className="text-sm font-bold text-orange-700">
              {formatManilaForDisplay(dueDate)}
            </span>
            <span className="text-[10px] font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full uppercase">Scheduled</span>
          </div>
        </div>
      </div>

      {/* FOOTER BUTTONS */}
      <div className="flex flex-col gap-3 mt-8">
        <button
          onClick={handleConfirm}
          className="w-full flex items-center justify-center gap-2 bg-[#7e9e6c] text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-[#7e9e6c]/20 hover:bg-[#6a865a] hover:-translate-y-0.5 transition-all active:scale-95"
        >
          <FaCheckCircle />
          Confirm & Record
        </button>
        
        <button
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 bg-white text-[#c55f4f] py-3 rounded-xl font-bold border border-transparent hover:border-[#e6b6a6] hover:bg-red-50 transition-all"
        >
          <FaTimesCircle />
          Discard Entry
        </button>
      </div>
    </div>

    {/* SUBTLE SECURITY FOOTER */}
    <div className="bg-gray-50 px-8 py-3 flex justify-center border-t border-gray-100">
      <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
        Secured Financial Transaction Entry
      </p>
    </div>
  </div>
</div>
  );
}
