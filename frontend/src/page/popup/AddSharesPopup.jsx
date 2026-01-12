import React, { useEffect, useRef, useState } from "react";
import { notify } from "../../utils/toast";

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
        // close when clicking on overlay (but not when clicking inside panel)
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-[#b8d8ba] overflow-hidden">
        {/* header */}
        <div className="flex items-start justify-between p-4 border-b border-[#dce9dd]">
          <h3 className="text-2xl font-bold text-[#2f5134]">Add Shares</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-2xl leading-none text-gray-600 hover:text-gray-800"
          >
            ×
          </button>
        </div>

        {/* member info */}
        <div className="p-4">
          <div className="bg-white rounded-md shadow-lg p-3 border border-[#e6efe6]">
            <div className="text-sm text-gray-600 mt-1">
              <div><strong>Name:</strong> {memberName || "—"}</div>
              <div><strong>Date:</strong> {formattedDate(date)}</div>
            </div>
          </div>
        </div>

        {/* amounts */}
        <div className="px-6 pb-2">
          <h4 className="text-center text-lg font-semibold text-[#446a48] mb-3">Add Shares Amount</h4>

        {/* NEW: manual input placed between grid and actions */}
        <div className="px-6 pb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Custom / Cumulative Amount (₱)</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="1"
              className="no-spinner w-full border shadow-md border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#7e9e6c]"
              placeholder="Enter or use preset buttons to add..."
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
            <button
              type="button"
              onClick={() => setSelectedAmount(0)}
              title="Clear"
              className="px-3 shadow-md rounded-md bg-white border border-gray-200 hover:bg-gray-50 text-gray-700"
            >
              Clear
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Tip: click preset buttons to add amounts cumulatively.</p>
        </div>

          <div className="grid grid-cols-3 gap-3">
            {amounts.map((amt) => {
              const isPressed = pressedAmt === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handlePresetClick(amt)}
                  className={
                    `py-2 px-3 rounded-md shadow-sm border transition font-semibold text-sm text-gray-800 bg-white border-gray-200 hover:bg-gray-50 
                    ${isPressed ? "ring-2 ring-[#7e9e6c] scale-95" : ""}`
                  }
                >
                  {amt.toLocaleString("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 })}
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment method selector */}
        <div className="px-6 pb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full border shadow-md border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#7e9e6c]"
            aria-label="Select payment method"
          >
            <option value="GCash">GCash</option>
            <option value="Cash">Cash</option>
          </select>
        </div>

        {/* actions */}
        <div className="flex gap-4 justify-center items-center p-4 border-t border-[#dce9dd] bg-white">
          <button
            onClick={handleConfirm}
            className="bg-[#7e9e6c] shadow-md text-white px-6 py-2 rounded-xl font-semibold hover:bg-[#6a8b5a] transition"
          >
            Confirm
          </button>
          <button
            onClick={onClose}
            className="bg-white shadow-md border border-[#e6b6a6] text-[#c55f4f] px-6 py-2 rounded-xl font-semibold hover:bg-[#f8f2f1] transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
