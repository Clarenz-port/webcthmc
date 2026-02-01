import React from "react";
import { FiGift, FiX, FiClock, FiFileText, FiCalendar, FiHash } from "react-icons/fi";

export default function AddDividendHistoryPopup({ isOpen, onClose, rows = [], loading = false }) {
  if (!isOpen) return null;

  const sorted = Array.isArray(rows) ? [...rows].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)) : [];
  const total = sorted.reduce((acc, r) => acc + (Number(r.amount ?? r.dividend ?? 0) || 0), 0);

  const fmt = (v) => Number(v || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 });

  return (
<div className="fixed inset-0 bg-black/45 flex justify-center items-center z-50 p-4 ">
  {/* Modal Container */}
  <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
    
    {/* Header Section */}
    <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-[#d6ead8] text-[#7e9e6c] rounded-xl">
          {/* Ensure you have FiGift or FiPieChart imported */}
          <FiGift size={22} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Dividend History</h3>
        </div>
      </div>
      <div className="h-1 w-20 bg-[#7e9e6c] rounded-full hidden sm:block"></div>
    </div>

    {/* Content Area */}
    <div className="flex-1 overflow-auto p-6 bg-white">
      {loading ? (
        // LOADING STATE
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#d6ead8] border-t-[#7e9e6c] rounded-full animate-spin mb-4" />
          <p className="text-sm text-gray-500 animate-pulse">Retrieving records...</p>
        </div>
      ) : sorted.length === 0 ? (
        // EMPTY STATE
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mb-4">
            <FiClock size={32} />
          </div>
          <h4 className="text-gray-800 font-semibold">No dividends found</h4>
          <p className="text-sm text-gray-400 max-w-[240px] mt-1">
            There are no dividend disbursements recorded for this account yet.
          </p>
        </div>
      ) : (
        // DATA TABLE
        <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                              <th className="px-4 py-3.5 font-bold text-gray-500 w-16">
                                <div className="flex items-center gap-1.5"><FiHash size={14}/></div>
                              </th>
                              <th className="px-4 py-3.5 font-bold text-gray-500">
                                <div className="flex items-center gap-1.5"><FiCalendar size={14}/> Date</div>
                              </th>
                              <th className="px-6 py-3.5 font-bold text-gray-500 text-right">
                                <div className="flex items-center  justify-end gap-1.5"> Amount</div>
                              </th>
                            </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((r, idx) => (
                <tr 
                  key={r.id ?? r._id ?? `${r.memberId}-${r.date || r.createdAt}-${Math.random()}`} 
                  className="group hover:bg-[#d6ead8]/10 transition-colors"
                >
                  <td className="px-4 py-4 text-gray-400 font-medium">
                    {String(idx + 1).padStart(2, '0')}
                  </td>
                  {/* Date Column */}
                  <td className="px-5 py-4 text-gray-700 font-semibold whitespace-nowrap">
                    {r.date 
                      ? new Date(r.date).toLocaleDateString("en-PH") 
                      : r.createdAt 
                        ? new Date(r.createdAt).toLocaleDateString("en-PH") 
                        : "-"
                    }
                  </td>
                
                  {/* Amount Column */}
                  <td className="px-5 py-4 text-right">
                    <span className="text-[#7e9e6c] font-bold text-base bg-[#d6ead8]/20 px-2 py-1 rounded-md">
                      {fmt(r.amount ?? r.dividend ?? 0)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {/* Footer Section */}
    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
      <span>
      </span>
      <button
        onClick={onClose}
        className="bg-[#b8d8ba] text-white px-6 py-2 rounded-lg hover:bg-[#8fa182] hover:shadow-lg transition-all active:scale-95"
      >
        Close
      </button>
    </div>
  </div>
  
  {/* Backdrop Click to Close */}
  <div className="absolute inset-0 -z-10" onClick={() => onClose && onClose()} />
</div>
  );
}
