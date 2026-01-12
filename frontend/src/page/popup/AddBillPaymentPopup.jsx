import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { notify } from "../../utils/toast";

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
      <div className="bg-white w-full max-w-lg mt-16 mb-16 rounded-xl shadow-lg p-6">
        <div className="flex border-b border-[#dce9dd] items-start justify-between mb-4">
          <div>
            <h2 id="bill-popup-title" className="text-2xl font-bold text-[#246033]">
              {isEditing ? "Edit Bill Payment" : "Record Bill Payment"}
            </h2>
            <p className="text-sm text-gray-500 mb-2 mt-1">{isEditing ? "Update the payment details." : "Record a payment for this member."}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <label className="text-sm font-semibold">Bill Name <span className="text-red-500">*</span></label>
          <input
            ref={firstFieldRef}
            type="text"
            value={billName}
            onChange={(e) => setBillName(e.target.value)}
            placeholder="Electricity / Water / Loan Payment / Other"
            className={`w-full border shadow-md border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#7e9e6c] ${
              errors.billName ? "border-red-400 focus:ring-red-200" : "focus:ring-[#7e9e6c]"
            }`}
            aria-invalid={!!errors.billName}
          />
          {errors.billName && <div className="text-red-500 text-sm">{errors.billName}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold">Amount (₱) <span className="text-red-500">*</span></label>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(sanitizeAmountInput(e.target.value))}
                placeholder="0.00"
                className={`w-full border shadow-md border-gray-300 rounded-md p-2 text-right focus:outline-none focus:ring-2 focus:ring-[#7e9e6c] ${
                  errors.amount ? "border-red-400 focus:ring-red-200" : "focus:ring-[#7e9e6c]"
                }`}
                aria-invalid={!!errors.amount}
              />
              {errors.amount ? (
                <div className="text-red-500 text-sm mt-1">{errors.amount}</div>
              ) : (
                <div className="text-xs text-gray-500 mt-1">{amount ? formatCurrency(Number(amount)) : "Enter an amount"}</div>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold">Payment method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full border shadow-md border-gray-300 rounded-md p-2 text-right focus:outline-none focus:ring-2 focus:ring-[#7e9e6c]"
              >
                <option value="cash">Cash</option>
                <option value="gcash">GCash</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 items-start">
            <div>
              <label className="text-sm font-semibold">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border shadow-md border-gray-300 rounded-md p-2 text-right focus:outline-none focus:ring-2 focus:ring-[#7e9e6c]"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-[#dce9dd] flex items-center justify-end gap-3">
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className=" bg-white shadow-md border border-red-300 font-semibold hover:bg-[#fff5f5] text-red-600 px-4 py-2 mt-3 rounded"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            disabled={saving || deleting}
            className=" bg-white shadow-md border border-[#e6b6a6] font-semibold hover:bg-[#f8f2f1] text-[#c55f4f] px-4 py-2 mt-3 rounded"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || deleting}
            className="px-4 py-2 shadow-md mt-3 bg-[#7e9e6c] text-white rounded hover:bg-[#6a8b5a] disabled:opacity-60"
          >
            {saving ? (isEditing ? "Saving..." : "Saving...") : isEditing ? "Save Changes" : "Save Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
