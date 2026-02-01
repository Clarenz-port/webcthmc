import React, { useEffect, useState } from "react";
import { notify } from "../../utils/toast";
import axios from "axios";
import { FaUser, FaMoneyBillWave, FaTimes, FaSave, FaInfoCircle, FaHandHoldingUsd } from 'react-icons/fa';

export default function AddDividendPopup({ isOpen, onClose, memberId, memberName, onSaved }) {
  const [amountRaw, setAmountRaw] = useState(""); // digits only, no decimals
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setAmountRaw("");
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // sanitize input: allow only digits (no decimal point)
  const handleChange = (e) => {
    let v = String(e.target.value || "");
    // remove currency sign, commas, spaces, dots, and any non-digit
    v = v.replace(/[₱,\s.]/g, "").replace(/[^0-9]/g, "");
    // remove leading zeros except keep single "0"
    v = v.replace(/^0+(?=.)/, "");
    if (v === "") v = "";
    setAmountRaw(v);
    setError(null);
  };

  const handlePaste = (e) => {
    const pasted = (e.clipboardData || window.clipboardData).getData("text") || "";
    // remove everything except digits
    const cleaned = pasted.replace(/[₱,\s.]/g, "").replace(/[^0-9]/g, "");
    e.preventDefault();
    setAmountRaw(cleaned);
  };

  const submit = async () => {
    setError(null);

    if (!amountRaw) {
      setError("Please enter a positive dividend amount (whole pesos only).");
      return;
    }

    const n = parseInt(amountRaw, 10);
    if (Number.isNaN(n) || n <= 0) {
      setError("Please enter a positive dividend amount (whole pesos only).");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        memberId,
        amount: n, // integer
        date: new Date().toISOString(),
      };

      const res = await axios.post("/api/dividends/add", payload, {
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });

      const msg = res.data?.message ?? "Dividend recorded";
      notify.success(msg);
      if (typeof onSaved === "function") onSaved(payload, res.data);
      onClose();
    } catch (err) {
      console.error("Add dividend failed:", err?.response?.data || err);
      const message = err?.response?.data?.message || err.message || "Failed to save dividend";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  {/* Modern Backdrop with Blur */}
  <div 
    className="absolute inset-0 bg-black/45 transition-opacity" 
    onClick={() => !saving && onClose()} 
  />

  <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 z-60">
    
    {/* HEADER SECTION */}
    <div className="bg-[#f8faf7] px-8 py-6 border-b border-[#7e9e6c]/10 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#7e9e6c] text-white rounded-xl flex items-center justify-center shadow-lg shadow-[#7e9e6c]/30">
          <FaHandHoldingUsd size={20} />
        </div>
        <div>
          <h3 className="text-xl font-black text-gray-800 tracking-tight">Add Dividend</h3>
          <p className="text-[10px] text-[#7e9e6c] font-bold uppercase tracking-widest">Transaction Entry</p>
        </div>
      </div>
    </div>

    <div className="p-8">
      <div className="space-y-6">
        
        {/* MEMBER INFO CARD */}
        <div>
          <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2 block ml-1">
            Beneficiary Member
          </label>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm border border-gray-50">
              <FaUser size={16} />
            </div>
            <span className="font-bold text-gray-800 text-lg">
              {memberName || "Select Member"}
            </span>
          </div>
        </div>

        {/* AMOUNT INPUT SECTION */}
        <div>
          <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2 block ml-1">
            Dividend Amount
          </label>
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-gray-300 group-focus-within:text-[#7e9e6c] transition-colors">
              ₱
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={amountRaw}
              onChange={handleChange}
              onPaste={handlePaste}
              disabled={saving}
              placeholder="0"
              className="w-full pl-12 pr-6 py-5 bg-white border-2 border-gray-100 rounded-2xl text-2xl font-black text-gray-800 outline-none focus:border-[#7e9e6c] focus:ring-4 focus:ring-[#7e9e6c]/5 transition-all"
            />
          </div>
          
          {/* INFO HINT */}
          <div className="mt-3 flex items-start gap-2 px-2">
            <FaInfoCircle className="text-[#7e9e6c] mt-0.5 shrink-0" size={14} />
            <p className="text-[11px] font-medium text-gray-500 leading-tight">
              Enter <span className="font-bold text-gray-700">whole pesos</span> only. The system will automatically reject commas, decimals, or symbols.
            </p>
          </div>
        </div>

        {/* ERROR DISPLAY */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 animate-pulse">
            <span className="text-xs font-bold font-mono">ERROR: {error}</span>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex flex-col gap-3 pt-4">
          <button 
            onClick={submit} 
            disabled={saving} 
            className="w-full flex items-center justify-center gap-2 py-4 bg-[#7e9e6c] text-white rounded-2xl font-bold text-lg shadow-lg shadow-[#7e9e6c]/20 hover:bg-[#6a8b5a] hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-60 disabled:pointer-events-none"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FaSave />
            )}
            {saving ? "Processing..." : "Confirm & Save"}
          </button>

          <button 
            onClick={() => onClose()} 
            disabled={saving} 
            className="w-full py-3 bg-white text-gray-400 font-bold rounded-xl hover:text-red-500 transition-colors disabled:opacity-30"
          >
            Cancel Transaction
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
  );
}
