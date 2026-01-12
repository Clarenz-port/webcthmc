import React, { useEffect, useState, useRef } from "react";
import { notify } from "../../utils/toast";
import axios from "axios";

export default function AddPurchasePopup({ isOpen, onClose, memberId, memberName = null, onSaved }) {
  const [lines, setLines] = useState([{ name: "", qty: "", unitPrice: "" }]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [saving, setSaving] = useState(false);
  const firstInputRef = useRef(null);

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
              name: field === "name" ? String(value) : l.name,
              qty: field === "qty" ? String(value) : l.qty,
              unitPrice: field === "unitPrice" ? String(value) : l.unitPrice,
            }
          : l
      )
    );
  };

  const addLine = () => setLines((prev) => [...prev, { name: "", qty: "", unitPrice: "" }]);
  const removeLine = (idx) =>
    setLines((prev) => (prev.length === 1 ? [{ name: "", qty: "", unitPrice: "" }] : prev.filter((_, i) => i !== idx)));

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

  const lineTotal = (l) => {
    const q = toQty(l.qty);
    const p = toPrice(l.unitPrice);
    return Number((q * p).toFixed(2));
  };

  const subtotal = lines.reduce((s, l) => s + lineTotal(l), 0);
  const surchargeRate = paymentMethod === "1month to pay" ? 0.01 : 0;
  const surcharge = Number((subtotal * surchargeRate).toFixed(2));
  const total = Number((subtotal + surcharge).toFixed(2));

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
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const items = lines.map((l) => {
        const name = String(l.name).trim();
        const qty = toQty(l.qty) || 1;
        const unitPrice = toPrice(l.unitPrice) || 0;
        return { name, qty, unitPrice, lineTotal: Number((qty * unitPrice).toFixed(2)) };
      });

      const subtotalComputed = items.reduce((s, it) => s + it.lineTotal, 0);
      const surchargeComputed = paymentMethod === "1month to pay" ? Number((subtotalComputed * 0.01).toFixed(2)) : 0;
      const totalComputed = Number((subtotalComputed + surchargeComputed).toFixed(2));

      const body = {
        userId: memberId,
        memberName: memberName || null,
        items,
        paymentMethod,
        subtotal: Number(subtotalComputed.toFixed(2)),
        surcharge: surchargeComputed,
        total: totalComputed,
      };

      if (paymentMethod === "1month to pay") {
        body.dueDate = computeDueDateISO(new Date());
      }

      // DEBUG log - inspect the exact payload sent
      console.log("DEBUG purchase body ->", JSON.stringify(body, null, 2));

      const res = await axios.post("/api/purchases/add", body, {
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
      notify.success(err.response?.data?.message || "Failed to record purchase");
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
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl text-[#2f5134] font-bold">Record Purchase</h3>
        </div>

        <div className="grid border-t border-[#dce9dd] pt-4 grid-cols-12 gap-8 items-center mb-2 text-sm">
          <div className="col-span-5 font-semibold">Item</div>
          <div className="col-span-2 text-right font-semibold">Qty</div>
          <div className="col-span-2 text-right font-semibold">Unit Price</div>
          <div className="col-span-1 text-right font-semibold">Total</div>
        </div>

        <div className="space-y-3">
          {lines.map((line, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-5">
                <input
                  id={`item-name-${idx}`}
                  ref={idx === 0 ? firstInputRef : undefined}
                  value={line.name}
                  onChange={(e) => updateLine(idx, "name", e.target.value)}
                  placeholder="e.g. Rice (10kg)"
                  className="w-full border shadow-sm border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#7e9e6c]"
                />
              </div>

              <div className="col-span-2">
                <input
                  type="text"
                  value={line.qty}
                  onChange={(e) => updateLine(idx, "qty", e.target.value)}
                  placeholder="1"
                  className="w-full border shadow-sm border-gray-300 rounded-md p-2 text-right focus:outline-none focus:ring-2 focus:ring-[#7e9e6c]"
                  inputMode="numeric"
                  aria-label={`Quantity for item ${idx + 1}`}
                />
              </div>

              <div className="col-span-2">
                <input
                  type="text"
                  value={line.unitPrice}
                  onChange={(e) => updateLine(idx, "unitPrice", e.target.value)}
                  onKeyDown={(e) => onPriceKeyDown(e, idx)}
                  placeholder="0.00"
                  className="w-full border shadow-sm border-gray-300 rounded-md p-2 text-right focus:outline-none focus:ring-2 focus:ring-[#7e9e6c]"
                  inputMode="decimal"
                  aria-label={`Unit price for item ${idx + 1}`}
                />
              </div>

              <div className="col-span-1 text-right">
                <div className="text-sm font-medium">{fmtMoney(lineTotal(line))}</div>
              </div>

              <div className="col-span-2 flex justify-end mt-1">
                <button
                  type="button"
                  onClick={() => removeLine(idx)}
                  className="text-red-500 text-sm px-2 py-1 rounded hover:bg-red-50"
                  aria-label={`Remove item ${idx + 1}`}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button onClick={addLine} className="px-3 py-2 bg-gray-100 rounded-lg shadow-md hover:bg-gray-200 text-sm">
            + Add item
          </button>
        </div>

        <div className="mt-6 border-t border-b border-[#dce9dd] pt-4 grid grid-cols-4 gap-4 items-center">
          <div>
            <label className="block text-sm font-medium mb-1">Payment method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="border mb-4 shadow-md border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-[#7e9e6c]"
            >
              <option value="cash">Cash</option>
              <option value="1month to pay">1 month to pay</option>
            </select>
          </div>
          <div className="col-span-2"></div>

          <div className="flex bg-[#d6ead8] border border-gray-400 rounded-lg mb-4 p-3 flex-col items-end">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-2xl font-bold">{fmtMoney(total)}</div>
          </div>
        </div>

        {paymentMethod === "1month to pay" && (
          <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-lg">Purchase summary (1 month to pay)</h4>
              <div className="text-sm text-gray-600">
                Due date: <span className="font-medium">{formatFriendlyDate(previewDueDateISO)}</span>
              </div>
            </div>

            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2">Item</th>
                    <th className="text-right px-3 py-2">Qty</th>
                    <th className="text-right px-3 py-2">Unit Price</th>
                    <th className="text-right px-3 py-2">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">{l.name || "-"}</td>
                      <td className="px-3 py-2 text-right">{toQty(l.qty) || 1}</td>
                      <td className="px-3 py-2 text-right">{fmtMoney(toPrice(l.unitPrice))}</td>
                      <td className="px-3 py-2 text-right">{fmtMoney(lineTotal(l))}</td>
                    </tr>
                  ))}

                  <tr className="border-t">
                    <td colSpan={3} className="px-3 py-2 text-right font-semibold">
                      Subtotal
                    </td>
                    <td className="px-3 py-2 text-right font-medium">{fmtMoney(subtotal)}</td>
                  </tr>

                  <tr>
                    <td colSpan={3} className="px-3 py-2 text-right">
                      <div className="text-sm text-gray-600">Surcharge (1%)</div>
                    </td>
                    <td className="px-3 py-2 text-right">{fmtMoney(surcharge)}</td>
                  </tr>

                  <tr className="border-t bg-gray-50">
                    <td colSpan={3} className="px-3 py-2 text-right font-semibold">
                      Total (incl. surcharge)
                    </td>
                    <td className="px-3 py-2 text-right font-bold">{fmtMoney(total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className=" bg-white shadow-md border border-[#e6b6a6] font-semibold hover:bg-[#f8f2f1] text-[#c55f4f] px-4 py-2 rounded border bg-white hover:bg-gray-50"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 shadow-md rounded bg-[#7e9e6c] text-white hover:bg-[#6a8b5a]"
          >
            {saving ? "Saving..." : "Save Purchase"}
          </button>
        </div>
      </div>
    </div>
  );
}
