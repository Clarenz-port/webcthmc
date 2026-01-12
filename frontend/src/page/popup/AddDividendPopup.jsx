import React, { useEffect, useState } from "react";
import { notify } from "../../utils/toast";
import axios from "axios";

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
      <div className="absolute inset-0 bg-black/50" onClick={() => !saving && onClose()} />
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6 z-60">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-[#7e9e6c]">Add Dividend</h3>
          <button onClick={() => !saving && onClose()} className="text-xl text-gray-600" aria-label="Close">
            &times;
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm block text-gray-700">Member</label>
            <div className="mt-1 p-3 bg-gray-50 rounded">{memberName || "Member"}</div>
          </div>

          <div>
            <label className="text-sm block text-gray-700">Dividend amount (whole PHP)</label>
            <input
              type="text"
              inputMode="numeric"
              value={amountRaw}
              onChange={handleChange}
              onPaste={handlePaste}
              className="w-full mt-1 p-2 border rounded"
              placeholder="Enter whole peso amount (e.g. 1500)"
              disabled={saving}
            />
            <div className="text-xs text-gray-500 mt-1">Whole pesos only. Don't include ₱, commas, or decimals.</div>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => onClose()} disabled={saving} className="bg-white shadow-md border border-[#e6b6a6] font-semibold hover:bg-[#f8f2f1] text-[#c55f4f] px-4 py-2 rounded border bg-white hover:bg-gray-50">Cancel</button>
            <button onClick={submit} disabled={saving} className="px-4 py-2 bg-[#7e9e6c] text-white rounded disabled:opacity-60">
              {saving ? "Saving..." : "Save Dividend"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
