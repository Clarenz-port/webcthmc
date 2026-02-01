import React from "react";
import { FiX, FiTrendingUp, FiCalendar, FiCreditCard, FiDollarSign } from "react-icons/fi";

function fmtMoney(val) {
  const n = Number(val) || 0;
  return n.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(d) {
  if (!d) return "—";
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt)) return String(d);
  return dt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function Sharehistory({ isOpen, onClose, rows = [], loading = false }) {
  if (!isOpen) return null;

  // normalize rows to array
  const items = Array.isArray(rows) ? rows : [];

  return (
    <div className="fixed inset-0 bg-black/45 flex justify-center items-center z-50 p-4">
  <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100">
    
    {/* Modal Header */}
    <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#d6ead8] rounded-lg text-[#7e9e6c]">
          <FiTrendingUp size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Shares History</h3>
        </div>
        
      </div><div className="h-1 w-20 bg-[#7e9e6c] rounded-full"></div>
    </div>

    {/* Content Area */}
    <div className="flex-1 overflow-auto p-6 bg-white">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <div className="w-8 h-8 border-4 border-[#7e9e6c] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-500">Loading transaction history...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mb-4">
                    <FiDollarSign size={32} />
                  </div>
                  <h4 className="text-gray-800 font-semibold">No records found</h4>
                  <p className="text-sm text-gray-400 max-w-[240px] mt-1">
                    There are no dividend disbursements recorded for this account yet.
                  </p>
                </div>
      ) : (
        <div className="relative border border-gray-100 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FiCalendar/> Date
                  </div>
                </th>
                <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FiCreditCard/> Method
                  </div>
                </th>
                <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((r, idx) => {
                // Same backend logic preserved
                const rawDate = r.date ?? r.createdAt ?? r.created_at ?? r.transaction_date;
                const paymentMethod = r.paymentMethod ?? r.method ?? r.mode ?? r.channel ?? "—";
                const amt = r.shareamount ?? r.shareAmount ?? r.amount ?? r.value ?? 0;

                return (
                  <tr 
                    key={r.id ?? idx} 
                    className="group hover:bg-[#d6ead8]/10 transition-colors"
                  >
                    <td className="px-4 py-4 text-sm text-gray-600 font-medium">
                      {fmtDate(rawDate)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-gray-100">
                        {String(paymentMethod)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-right font-bold text-[#7e9e6c]">
                      {fmtMoney(amt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {/* Modal Footer */}
    <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
      <button
        onClick={onClose}
        className="bg-[#b8d8ba] text-white px-6 py-2 rounded-lg hover:bg-[#8fa182] hover:shadow-lg transition-all active:scale-95"
      >
        Close
      </button>
    </div>
  </div>
</div>
  );
}
