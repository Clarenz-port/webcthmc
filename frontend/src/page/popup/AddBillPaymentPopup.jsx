import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { notify } from "../../utils/toast";
import { FaFileInvoice, FaMoneyBillWave, FaWallet, FaCalendarAlt, FaTrashAlt, FaTimes, FaSave, FaCheckCircle } from 'react-icons/fa';

export default function AddBillPaymentPopup({ isOpen, onClose, memberId, onSaved, bill = null, onDeleted }) {
  const overlayRef = useRef(null);
  const firstFieldRef = useRef(null);

  const [billName, setBillName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]); // yyyy-mm-dd
  const [method, setMethod] = useState("cash");

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEditing = !!(bill && (bill.id || bill._id || bill.billId));

  // Populate form when opening or when bill changes
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstFieldRef.current?.focus(), 50);
      setErrors({});
      if (isEditing) {
        // prefer ISO date only (yyyy-mm-dd)
        const billDate = bill.date ? new Date(bill.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
        setBillName(bill.billName ?? bill.name ?? "");
        setAmount(bill.amount != null ? String(bill.amount) : "");
        setDate(billDate);
        setMethod(bill.paymentMethod ?? bill.method ?? "cash");
      } else {
        // reset for new create
        setBillName("");
        setAmount("");
        setDate(new Date().toISOString().split("T")[0]);
        setMethod("cash");
      }
    }
  }, [isOpen, bill]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sanitizeAmountInput = (value) => {
    let cleaned = value.replace(/[^\d.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) cleaned = parts[0] + "." + parts.slice(1).join("");
    return cleaned;
  };

  const formatCurrency = (val) => {
    const n = Number(val || 0);
    return n.toLocaleString("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 });
  };

  const validate = () => {
    const e = {};
    if (!billName.trim()) e.billName = "Bill name is required.";
    const numericAmount = Number(amount || 0);
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      e.amount = "Enter a valid amount (greater than 0).";
    }
    if (!date) e.date = "Date is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      const payload = {
        memberId: memberId ?? bill?.memberId ?? undefined,
        billName: billName.trim(),
        amount: Number(amount || 0),
        date,
        paymentMethod: method,
      };

      let res;
      if (isEditing) {
        const id = bill.id ?? bill._id ?? bill.billId;
        res = await axios.put(`/api/bills/${encodeURIComponent(id)}`, payload, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      } else {
        res = await axios.post("/api/bills/add", payload, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      }

      notify.success(isEditing ? "Bill payment updated!" : "Bill payment recorded!");
      onSaved && onSaved(res.data);
      onClose && onClose();
    } catch (err) {
      console.error("Error saving bill payment:", err);
      const msg = err?.response?.data?.message || err.message || "Failed to save bill payment";
      notify.success(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing) return;
    if (!window.confirm("Delete this bill payment? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const id = bill.id ?? bill._id ?? bill.billId;
      const res = await axios.delete(`/api/bills/${encodeURIComponent(id)}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      notify.success("Bill payment deleted.");
      onDeleted && onDeleted(res.data);
      onClose && onClose();
    } catch (err) {
      console.error("Error deleting bill:", err);
      notify.success(err?.response?.data?.message || "Failed to delete bill payment");
    } finally {
      setDeleting(false);
    }
  };

  return (
   <div
  ref={overlayRef}
  className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4"
  onMouseDown={(e) => {
    if (e.target === overlayRef.current) onClose?.();
  }}
  aria-modal="true"
  role="dialog"
  aria-labelledby="bill-popup-title"
>
  <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
    
    {/* HEADER SECTION */}
    <div className="bg-[#f8faf7] px-8 py-6 border-b border-[#dce9dd] flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[#7e9e6c]/10 text-[#246033] rounded-2xl flex items-center justify-center">
          <FaFileInvoice size={24} />
        </div>
        <div>
          <h2 id="bill-popup-title" className="text-xl font-black text-[#246033] tracking-tight">
            {isEditing ? "Edit Payment" : "Record Payment"}
          </h2>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
            {isEditing ? "Modify Transaction" : "New Bill Entry"}
          </p>
        </div>
      </div>
    </div>

    <div className="p-8">
      <div className="space-y-5">
        
        {/* BILL NAME */}
        <div className="group">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 ml-1">
            <FaFileInvoice className="text-[#7e9e6c]" /> Bill Name <span className="text-red-500">*</span>
          </label>
          <input
            ref={firstFieldRef}
            type="text"
            value={billName}
            onChange={(e) => setBillName(e.target.value)}
            placeholder="e.g., Electricity, Water, Rent"
            className={`w-full bg-gray-50 border-2 rounded-2xl p-3.5 outline-none transition-all ${
              errors.billName 
                ? "border-red-200 bg-red-50 focus:border-red-400" 
                : "border-transparent focus:border-[#7e9e6c] focus:bg-white focus:shadow-lg focus:shadow-[#7e9e6c]/10"
            }`}
            aria-invalid={!!errors.billName}
          />
          {errors.billName && <div className="text-red-500 text-xs font-bold mt-2 ml-2 flex items-center gap-1">⚠️ {errors.billName}</div>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* AMOUNT */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 ml-1">
              <FaMoneyBillWave className="text-[#7e9e6c]" /> Amount (₱)
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(sanitizeAmountInput(e.target.value))}
                placeholder="0.00"
                className={`w-full bg-gray-50 border-2 rounded-2xl p-3.5 text-right font-black text-lg outline-none transition-all ${
                  errors.amount 
                    ? "border-red-200 bg-red-50 focus:border-red-400" 
                    : "border-transparent focus:border-[#7e9e6c] focus:bg-white"
                }`}
              />
            </div>
            {errors.amount ? (
              <div className="text-red-500 text-xs font-bold mt-2 ml-2">⚠️ {errors.amount}</div>
            ) : (
              <div className="text-[10px] font-black text-[#7e9e6c] uppercase mt-2 ml-2 tracking-widest">
                {amount ? formatCurrency(Number(amount)) : "Required Field"}
              </div>
            )}
          </div>

          {/* PAYMENT METHOD */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 ml-1">
              <FaWallet className="text-[#7e9e6c]" /> Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full bg-gray-50 border-2 border-transparent rounded-2xl p-3.5 font-bold text-gray-700 outline-none focus:border-[#7e9e6c] focus:bg-white appearance-none cursor-pointer transition-all"
            >
              <option value="cash"> Cash</option>
              <option value="gcash"> GCash</option>
            </select>
          </div>
        </div>

        {/* DATE */}
        <div className="pb-2">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 ml-1">
            <FaCalendarAlt className="text-[#7e9e6c]" /> Transaction Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-gray-50 border-2 border-transparent rounded-2xl p-3.5 font-bold text-gray-700 outline-none focus:border-[#7e9e6c] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
        <div>
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 text-red-400 hover:text-red-600 font-bold text-sm transition-colors disabled:opacity-50"
            >
              <FaTrashAlt />
              {deleting ? "Deleting..." : "Delete Entry"}
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving || deleting}
            className="px-6 py-3 bg-white text-gray-500 font-bold rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || deleting}
            className="flex items-center gap-2 px-8 py-3 bg-[#7e9e6c] text-white font-bold rounded-2xl shadow-lg shadow-[#7e9e6c]/30 hover:bg-[#6a8b5a] hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-60"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <FaSave />
            )}
            {isEditing ? "Update Bill" : "Confirm Payment"}
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
  );
}
