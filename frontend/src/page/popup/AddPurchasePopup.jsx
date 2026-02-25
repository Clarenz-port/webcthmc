import React, { useEffect, useState, useRef } from "react";
import { notify } from "../../utils/toast";
import API from '../../apis/axios.js';
import { FaPlus, FaTrash, FaShoppingCart, FaWallet, FaReceipt, FaCalendarCheck, FaTimes } from 'react-icons/fa';

export default function AddPurchasePopup({ isOpen, onClose, memberId, memberName = null, onSaved }) {
  const [lines, setLines] = useState([{ name: "", qty: "", unitPrice: "", costOfSale: "", income: "" }]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [saving, setSaving] = useState(false);
  const firstInputRef = useRef(null);

    const lineTotal = (l) => {
      const q = toQty(l.qty);
      const p = toPrice(l.unitPrice);
      return Number((q * p).toFixed(2));
    };

  useEffect(() => {
    if (!isOpen) {
      setLines([{ name: "", qty: "", unitPrice: "" }]);
      setPaymentMethod("cash");
      setSaving(false);
    } else {
      setTimeout(() => firstInputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const updateLine = (idx, field, value) => {
  setLines((prev) =>
    prev.map((l, i) =>
      i === idx
        ? {
            ...l,
            [field]: value,
            income:
              field === "unitPrice" || field === "costOfSale"
                ? String(Number(field === "unitPrice" ? value : l.unitPrice) - Number(field === "costOfSale" ? value : l.costOfSale))
                : (field === "income" ? value : String(Number(l.unitPrice) - Number(l.costOfSale))),
          }
        : l
    )
  );
};



  const addLine = () => setLines((prev) => [...prev, { name: "", qty: "", unitPrice: "", costOfSale: "", income: "" }]);
  const removeLine = (idx) =>
    setLines((prev) => (prev.length === 1 ? [{ name: "", qty: "", unitPrice: "", costOfSale: "", income: "" }] : prev.filter((_, i) => i !== idx)));

const lineIncome = (l) => {
  const unitPrice = Number(l.unitPrice) || 0;
  const costOfSale = Number(l.costOfSale) || 0;
  return unitPrice - costOfSale;
};
// Helper for total income per line
const lineTotalIncome = (l) => {
  const qty = Number(l.qty) || 0;
  return lineIncome(l) * qty;
};
// Total income for all lines
const totalIncome = lines.reduce((sum, l) => sum + lineTotalIncome(l), 0);

  const fmtMoney = (val) =>
    Number(val || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 });

  const toQty = (s) => {
    const n = Number(String(s).replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  };
  const toPrice = (s) => {
    const n = Number(String(s).replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  // lineTotal already defined above, remove duplicate

const subtotal = lines.reduce((s, l) => s + lineTotal(l), 0);
const total = Number(subtotal.toFixed(2));

  const validateBeforeSubmit = () => {
    if (!memberId) {
      notify.success("Member not specified.");
      return false;
    }
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (!String(l.name || "").trim()) {
        notify.success(`Please enter item name for row ${i + 1}.`);
        return false;
      }
      if (l.qty && toQty(l.qty) < 1) {
        notify.success(`Quantity must be >= 1 for row ${i + 1}.`);
        return false;
      }
      if (l.unitPrice && toPrice(l.unitPrice) < 0) {
        notify.success(`Unit price must be >= 0 for row ${i + 1}.`);
        return false;
      }
    }
    return true;
  };

  const computeDueDateISO = (from = new Date()) => {
    const d = new Date(from.getTime());
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
  };

  const formatFriendlyDate = (isoDate) => {
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return isoDate;
    }
  };

  const handleSubmit = async () => {
    if (!validateBeforeSubmit()) return;
    try {
      const token = localStorage.getItem("token");
      const items = lines.map((l) => {
        const qty = Number(l.qty) || 0;
        const unitPrice = Number(l.unitPrice) || 0;
        const costOfSale = Number(l.costOfSale) || 0;
        const lineTotal = qty * unitPrice;
        const lineCost = qty * costOfSale;
        const income = unitPrice - costOfSale;
        const incomeTotal = income * qty;
        return {
          name: l.name,
          qty,
          unitPrice,
          costOfSale,
          lineTotal,
          lineCost,
          income,
          incomeTotal,
        };
      });

      const subtotalComputed = items.reduce((s, it) => s + it.lineTotal, 0);
      const totalComputed = Number(subtotalComputed.toFixed(2));
      const totalIncome = items.reduce((s, it) => s + it.incomeTotal, 0);
      const totalCost = items.reduce((s, it) => s + it.lineCost, 0);

      const body = {
        userId: memberId,
        memberName: memberName || null,
        items,
        paymentMethod,
        subtotal: Number(subtotalComputed.toFixed(2)),
        total: totalComputed,
        income: Number(totalIncome.toFixed(2)),
        cost: Number(totalCost.toFixed(2)),
      };

      const res = await API.post("/api/purchases/add", body, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      notify.success("Purchase recorded");
      onSaved && onSaved(res.data.purchase ?? res.data);
      onClose && onClose();
    } catch (err) {
      console.error(err);
      notify.error(err.response?.data?.message || "Failed to record purchase");
    } finally {
      setSaving(false);
    }
  };

  const onPriceKeyDown = (e, idx) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (idx === lines.length - 1) {
        addLine();
        setTimeout(() => document.querySelector(`#item-name-${lines.length}`)?.focus(), 60);
      } else {
        document.querySelector(`#item-name-${idx + 1}`)?.focus();
      }
    }
  };

  const previewDueDateISO = paymentMethod === "1month to pay" ? computeDueDateISO(new Date()) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
  <div 
    className="absolute inset-0" 
    onClick={() => !saving && onClose()} 
  />
  
  <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 z-60">
    
    {/* HEADER */}
    <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-[#f8faf7]">
      <div className="flex items-center gap-4">
        <div>
          <h3 className="text-2xl font-black text-gray-800 tracking-tight">Record Purchase</h3>
        </div>
      </div>
    </div>

    {/* CONTENT AREA */}
    <div className="p-8 overflow-y-auto flex-1">
      {/* COLUMN HEADERS */}
      <div className="grid grid-cols-16 gap-4 px-2 mb-4">
        <div className="col-span-5 text-[11px] font-black text-gray-400 uppercase tracking-wider">Item Description</div>
        <div className="col-span-2 text-right text-[11px] font-black text-gray-400 uppercase tracking-wider">Qty</div>
        <div className="col-span-2 text-right text-[11px] font-black text-gray-400 uppercase tracking-wider">Unit Price</div>
        <div className="col-span-2 text-right text-[11px] font-black text-gray-400 uppercase tracking-wider">Cost of Sale</div>
        <div className="col-span-2 text-right text-[11px] font-black text-gray-400 uppercase tracking-wider">Income</div>
        <div className="col-span-2 text-right text-[11px] font-black text-gray-400 uppercase tracking-wider">Total</div>
        <div className="col-span-1"></div>
      </div>

      {/* INPUT LINES */}
      <div className="space-y-3">
       {lines.map((line, idx) => (
  <div key={idx} className="grid grid-cols-16 gap-3 items-center group animate-in slide-in-from-left-2 duration-200">
    <div className="col-span-5">
      <input
        id={`item-name-${idx}`}
        ref={idx === 0 ? firstInputRef : undefined}
        value={line.name}
        onChange={(e) => updateLine(idx, "name", e.target.value)}
        placeholder="Item name..."
        className="w-full bg-gray-50 border-2 border-transparent rounded-xl p-3 text-sm font-semibold outline-none focus:bg-white focus:border-[#7e9e6c] focus:shadow-sm transition-all"
      />
    </div>
    <div className="col-span-2">
      <input
        type="text"
        value={line.qty}
        onChange={(e) => updateLine(idx, "qty", e.target.value)}
        placeholder="1"
        className="w-full bg-gray-50 border-2 border-transparent rounded-xl p-3 text-right text-sm font-bold outline-none focus:bg-white focus:border-[#7e9e6c] transition-all"
        inputMode="numeric"
      />
    </div>
    <div className="col-span-2">
      <input
        type="text"
        value={line.unitPrice}
        onChange={(e) => updateLine(idx, "unitPrice", e.target.value)}
        placeholder="0.00"
        className="w-full bg-gray-50 border-2 border-transparent rounded-xl p-3 text-right text-sm font-bold outline-none focus:bg-white focus:border-[#7e9e6c] transition-all"
        inputMode="decimal"
      />
    </div>
    <div className="col-span-2">
      <input
        type="text"
        value={line.costOfSale}
        onChange={(e) => updateLine(idx, "costOfSale", e.target.value)}
        placeholder="0.00"
        className="w-full bg-gray-50 border-2 border-transparent rounded-xl p-3 text-right text-sm font-bold outline-none focus:bg-white focus:border-[#7e9e6c] transition-all"
        inputMode="decimal"
      />
    </div>
    <div className="col-span-2">
      <input
        type="text"
        value={lineTotalIncome(line)}
        readOnly
        placeholder="Income × Qty"
        className="w-full bg-gray-50 border-2 border-transparent rounded-xl p-3 text-right text-sm font-bold outline-none focus:bg-white focus:border-[#7e9e6c] transition-all"
      />
    </div>
    <div className="col-span-2">
      <input
        type="text"
        value={lineTotal(line)}
        readOnly
        placeholder="Total"
        className="w-full bg-gray-50 border-2 border-transparent rounded-xl p-3 text-right text-sm font-bold outline-none focus:bg-white focus:border-[#7e9e6c] transition-all"
      />
    </div>
    <div className="col-span-1 flex justify-center">
      <button
        type="button"
        onClick={() => removeLine(idx)}
        className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
      >
        <FaTrash size={14} />
      </button>
    </div>
  </div>
))}
      </div>

      {/* ADD LINE BUTTON */}
      <button 
        onClick={addLine} 
        className="mt-6 flex items-center gap-2 px-6 py-3 bg-white border-2 border-dashed border-gray-200 text-gray-500 rounded-2xl font-bold text-sm hover:border-[#7e9e6c] hover:text-[#7e9e6c] hover:bg-[#f8faf7] transition-all"
      >
        <FaPlus size={12} /> Add New Line
      </button>

      {/* FOOTER SUMMARY SECTION */}
      <div className="mt-8 pt-8 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* SETTINGS */}
        <div className="space-y-4">
        <div>
          <label className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">
            <FaWallet className="text-[#7e9e6c]" /> Payment Method
          </label>
          <div className="relative">
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-gray-50 border-2 border-transparent rounded-2xl p-4 font-bold text-gray-700 outline-none focus:border-[#7e9e6c] focus:bg-white appearance-none cursor-pointer transition-all"
            >
              <option value="cash">Cash</option>
              <option value="gcash">GCash</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
          </div>
        </div>
      </div>

        {/* TOTAL BOX */}
        <div className="bg-[#7e9e6c] rounded-3xl p-6 text-white shadow-xl shadow-[#7e9e6c]/20 flex flex-col justify-center items-end relative overflow-hidden">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-1">Total Income</p>
        <h3 className="text-2xl font-black mb-4">{fmtMoney(totalIncome)}</h3>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-1">Grand Total</p>
        <h2 className="text-4xl font-black">{fmtMoney(total)}</h2>
      </div>
      
      </div>

    </div>

    {/* ACTIONS */}
    <div className="px-8 py-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
      <button
        onClick={onClose}
        disabled={saving}
        className="px-8 py-3 bg-white text-gray-500 font-bold rounded-2xl hover:text-red-500 transition-all disabled:opacity-50"
      >
        Discard
      </button>
      <button
        onClick={handleSubmit}
        disabled={saving}
        className="px-10 py-3 bg-[#7e9e6c] text-white font-bold rounded-2xl shadow-lg shadow-[#7e9e6c]/20 hover:bg-[#6a8b5a] hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-60"
      >
        {saving ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Saving...</span>
          </div>
        ) : (
          "Save Purchase"
        )}
      </button>
    </div>
  </div>
</div>
  );
}
