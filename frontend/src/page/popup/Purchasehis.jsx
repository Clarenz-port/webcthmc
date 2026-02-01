import React, { useState } from "react";
import { FiShoppingBag, FiEye, FiX, FiCalendar, FiClock, FiPackage, FiCheckCircle, FiInfo } from "react-icons/fi";

export default function PurchaseHistory({ onBack, rows = [], loading = false }) {
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const data = Array.isArray(rows) ? rows : [];

  const formatDate = (d) => {
    if (!d) return "-";
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString("en-PH");
  };

  const fmtMoney = (val) =>
    Number(val || 0).toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    });

  const itemsSummary = (items) => {
    if (!items) return "-";

    if (Array.isArray(items)) {
      return items
        .map((it) =>
          it && (it.name || it.item)
            ? `${it.name || it.item} x${it.qty ?? 1}`
            : String(it)
        )
        .join(", ");
    }

    if (typeof items === "string") {
      try {
        const parsed = JSON.parse(items);
        if (Array.isArray(parsed)) {
          return parsed
            .map((it) =>
              it.name ? `${it.name} x${it.qty ?? 1}` : String(it)
            )
            .join(", ");
        }
      } catch {}
      return items;
    }

    if (typeof items === "object") {
      const vals = Object.values(items).filter(Boolean);
      if (vals.length === 0) return "-";
      return vals
        .map((it) =>
          it && it.name ? `${it.name} x${it.qty ?? 1}` : String(it)
        )
        .join(", ");
    }

    return "-";
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50 p-4">
  <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100">
    
    {/* HEADER */}
    <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-[#d6ead8] text-[#7e9e6c] rounded-xl">
          <FiShoppingBag size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Purchase History</h2>
        </div>
      </div><div className="h-1 w-20 bg-[#7e9e6c] rounded-full"></div>
    </div>

    {/* MAIN CONTENT AREA */}
    <div className="flex-1 overflow-auto p-6">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#d6ead8] border-t-[#7e9e6c] rounded-full animate-spin mb-4" />
          <p className="text-sm text-gray-500">Loading your purchases...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mb-4">
            <FiPackage size={32} />
          </div>
          <h4 className="text-gray-800 font-semibold">No records found</h4>
          <p className="text-sm text-gray-400 max-w-[240px] mt-1">
            It looks like there aren't any purchase records for this account.
          </p>
        </div>
      ) : (
        <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-4 font-bold text-gray-500 uppercase tracking-tighter">Date</th>
                <th className="text-left px-4 py-4 font-bold text-gray-500 uppercase tracking-tighter">Items Summary</th>
                <th className="text-right px-4 py-4 font-bold text-gray-500 uppercase tracking-tighter">Total</th>
                <th className="text-right px-4 py-4 font-bold text-gray-500 uppercase tracking-tighter">Due Date</th>
                <th className="text-center px-4 py-4 font-bold text-gray-500 uppercase tracking-tighter">Status</th>
                <th className="text-center px-4 py-4 font-bold text-gray-500 uppercase tracking-tighter">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((p, i) => {
                const pid = p.id || p._id || p.purchaseId || i;
                const statusStr = String(p.status ?? p.paymentStatus ?? "unknown").toLowerCase();
                
                return (
                  <tr key={pid} className="group hover:bg-[#d6ead8]/10 transition-colors">
                    <td className="px-4 py-4 text-gray-600 font-medium whitespace-nowrap">
                      {formatDate(p.createdAt || p.created_at || p.date)}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-gray-800 font-semibold line-clamp-1 truncate max-w-[150px]">
                        {itemsSummary(p.items)}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-[#7e9e6c]">
                      {fmtMoney(p.total ?? p.totalAmount ?? p.amount ?? p.price ?? 0)}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-500 italic">
                      {p.dueDate ? formatDate(p.dueDate) : "—"}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        statusStr === 'paid' ? 'bg-green-100 text-green-700' :
                        statusStr === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {statusStr}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => setSelectedPurchase(p)}
                        className="p-2 text-gray-400 hover:text-[#7e9e6c] hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-gray-100 transition-all"
                        title="View Details"
                      >
                        <FiEye size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {/* FOOTER */}
    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
      <button
        onClick={onBack}
        className="bg-[#b8d8ba] text-white px-6 py-2 rounded-lg hover:bg-[#8fa182] hover:shadow-lg transition-all active:scale-95"
      >
        Close
      </button>
    </div>

    {/* VIEW MODAL (DETAILS) */}
    {selectedPurchase && (
      <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-[70] p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] overflow-hidden border border-gray-200">
          
          <div className="p-6 bg-[#7e9e6c] text-white">
            <div className="flex justify-between items-start mb-4">
              <FiCheckCircle size={32} className="opacity-80" />
              <button onClick={() => setSelectedPurchase(null)} className="hover:rotate-90 transition-transform">
                <FiX size={24} />
              </button>
            </div>
            <h3 className="text-2xl font-black">Purchase Details</h3>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <table className="w-full text-sm mb-6">
              <thead>
                <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                  <th className="text-left pb-2">Item Description</th>
                  <th className="text-right pb-2">Qty</th>
                  <th className="text-right pb-2">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(selectedPurchase.items ?? []).map((it, index) => (
                  <tr key={index}>
                    <td className="py-3 text-gray-700 font-medium">{it.name || it.item}</td>
                    <td className="py-3 text-right text-gray-500">x{it.qty ?? 1}</td>
                    <td className="py-3 text-right font-bold text-gray-900">
                      {fmtMoney((it.qty ?? 1) * (it.unitPrice ?? 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-gray-500 text-xs">
                <span>Surcharge</span>
                <span>{fmtMoney(selectedPurchase.surcharge)}</span>
              </div>
              <div className="flex justify-between text-gray-500 text-xs">
                <span>Subtotal</span>
                <span>{fmtMoney(selectedPurchase.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-900 font-black text-lg border-t border-gray-200 pt-2">
                <span>Total Amount</span>
                <span className="text-[#7e9e6c]">{fmtMoney(selectedPurchase.total)}</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <FiCalendar className="text-[#7e9e6c]" />
                <span>{formatDate(selectedPurchase.createdAt || selectedPurchase.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <FiClock className="text-orange-500" />
                <span>Due: {selectedPurchase.dueDate ? formatDate(selectedPurchase.dueDate) : "N/A"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
</div>
  );
}
