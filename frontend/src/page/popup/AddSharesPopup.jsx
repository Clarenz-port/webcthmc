import React, { useEffect, useRef, useState } from "react";
import { notify } from "../../utils/toast";
import { FaUser, FaCalendarAlt, FaPlusCircle, FaMoneyBillWave, FaWallet, FaTimes, FaCheckCircle, FaTrashAlt } from 'react-icons/fa';

export default function AddSharesPopup({
  isOpen,
  onClose,
  onConfirm,
  memberName = "",
  date = new Date(),
}) {
  const overlayRef = useRef(null);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [pressedAmt, setPressedAmt] = useState(null); // for brief visual feedback
  const [paymentMethod, setPaymentMethod] = useState("GCash"); // default to GCash

  const amounts = [
    1000, 2000, 5000,
    10000, 20000, 50000,
    100000, 200000, 500000
  ];

  useEffect(() => {
    if (!isOpen) {
      setSelectedAmount(null);
      setPaymentMethod("GCash");
    }
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && selectedAmount && selectedAmount > 0) handleConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedAmount, onClose, paymentMethod]);

  if (!isOpen) return null;

  const formattedDate = (d) => {
    const dt = typeof d === "string" ? new Date(d) : d;
    return dt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const handleConfirm = () => {
    const amt = Number(selectedAmount) || 0;
    if (!amt || amt <= 0) return notify.success("Please enter or select an amount greater than zero.");
    // Call onConfirm with both amount and payment method
    onConfirm && onConfirm(amt, paymentMethod);
    onClose && onClose();
  };

  const handlePresetClick = (amt) => {
    setSelectedAmount((prev) => {
      const current = Number(prev) || 0;
      return current + amt;
    });

    // visual feedback: set pressedAmt briefly
    setPressedAmt(amt);
    window.setTimeout(() => setPressedAmt(null), 220);
  };

  return (
    <div
  ref={overlayRef}
  className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
  onMouseDown={(e) => {
    if (e.target === overlayRef.current) onClose();
  }}
>
  <div className="w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
    
    {/* HEADER */}
    <div className="bg-[#f8faf7] px-6 py-5 border-b border-[#dce9dd] flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#7e9e6c] text-white rounded-xl flex items-center justify-center shadow-lg shadow-[#7e9e6c]/20">
          <FaPlusCircle size={20} />
        </div>
        <div>
          <h3 className="text-lg font-black text-[#2f5134] tracking-tight">Add Shares</h3>
          <p className="text-[10px] text-[#7e9e6c] font-bold uppercase tracking-widest">Equity Contribution</p>
        </div>
      </div>
    </div>

    <div className="p-6">
      {/* MEMBER IDENTITY CARD */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
          <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase mb-1">
            <FaUser className="text-[#7e9e6c]" /> Member
          </label>
          <p className="text-sm font-bold text-gray-800 truncate">{memberName || "—"}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
          <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase mb-1">
            <FaCalendarAlt className="text-[#7e9e6c]" /> Entry Date
          </label>
          <p className="text-sm font-bold text-gray-800">{formattedDate(date)}</p>
        </div>
      </div>

      {/* MANUAL AMOUNT INPUT */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1 tracking-wide">
          Custom / Cumulative Total
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1 group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 group-focus-within:text-[#7e9e6c] transition-colors">₱</span>
            <input
              type="number"
              min="0"
              step="1"
              className="no-spinner w-full pl-8 pr-4 py-3 bg-white border-2 border-gray-100 rounded-2xl font-black text-lg text-gray-800 outline-none focus:border-[#7e9e6c] focus:ring-4 focus:ring-[#7e9e6c]/5 transition-all"
              placeholder="0.00"
              value={selectedAmount ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") {
                  setSelectedAmount(null);
                  return;
                }
                const n = Number(v);
                if (!Number.isNaN(n) && n >= 0) setSelectedAmount(n);
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => setSelectedAmount(0)}
            className="px-4 bg-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"
            title="Clear Amount"
          >
            <FaTrashAlt />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 ml-1 italic flex items-center gap-1">
          <FaPlusCircle className="text-[#7e9e6c]" size={10} /> Tip: Click presets below to add amounts cumulatively.
        </p>
      </div>

      {/* PRESET BUTTONS */}
      <div className="mb-6">
        <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-3 ml-1 tracking-wide">
          <FaMoneyBillWave className="text-[#7e9e6c]" /> Quick Add Presets
        </label>
        <div className="grid grid-cols-3 gap-2">
          {amounts.map((amt) => {
            const isPressed = pressedAmt === amt;
            return (
              <button
                key={amt}
                type="button"
                onClick={() => handlePresetClick(amt)}
                className={`py-3 px-2 rounded-xl border-2 transition-all font-bold text-md flex flex-col items-center gap-1
                  ${isPressed 
                    ? "bg-[#7e9e6c] border-[#7e9e6c] text-white scale-95 shadow-inner" 
                    : "bg-white border-gray-50 text-gray-700 hover:border-[#7e9e6c]/30 hover:bg-[#7e9e6c]/5 shadow-sm"
                  }`}
              >
                <span className="text-[10px] opacity-60 font-medium">Add</span>
                {amt.toLocaleString("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 })}
              </button>
            );
          })}
        </div>
      </div>

      {/* PAYMENT METHOD */}
      <div className="mb-8">
        <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-2 ml-1 tracking-wide">
          <FaWallet className="text-[#7e9e6c]" /> Payment Method
        </label>
        <div className="relative">
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full bg-gray-50 border-2 border-transparent rounded-2xl p-3.5 font-bold text-gray-700 outline-none focus:border-[#7e9e6c] focus:bg-white appearance-none cursor-pointer transition-all"
          >
            <option value="GCash">GCash</option>
            <option value="Cash">Cash</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
             ▼ 
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex flex-col gap-3 pt-2">
        <button
          onClick={handleConfirm}
          className="w-full flex items-center justify-center gap-2 bg-[#7e9e6c] text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-[#7e9e6c]/20 hover:bg-[#6a8b5a] hover:-translate-y-0.5 active:scale-95 transition-all"
        >
          <FaCheckCircle />
          Confirm Shares
        </button>
        <button
          onClick={onClose}
          className="w-full py-2 text-gray-400 font-bold hover:text-red-500 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</div>
  );
}
