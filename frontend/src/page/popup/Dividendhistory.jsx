// src/page/popup/Dividendhistory.jsx
import React from "react";
import { FiGift, FiX, FiClock, FiDollarSign, FiCalendar, FiHash } from "react-icons/fi";
import { FaTimes } from "react-icons/fa";
export default function Dividendhistory({ isOpen, onClose, rows = [], loading = false }) {
  if (!isOpen) return null;

  const fmtAmount = (v) => {
    // show integer, no peso sign, no commas, show 0 for falsy
    const n = Number(v) || 0;
    return String(Math.round(n));
  };

  return (
    <div className="fixed inset-0 bg-black/45 flex justify-center items-center z-50 p-4">
  <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-gray-100">
    
    {/* Header Section */}
    <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
      <div className="flex-1 flex items-center gap-3">
        <h3 className="text-2xl font-extrabold text-[#56794a]">Dividend History</h3>
      </div>
      <button
        onClick={onClose}
        className="ml-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        title="Close"
      >
        <FaTimes className="text-xl" />
      </button>
    </div>

    {/* Table/Content Area */}
    <div className="flex-1 overflow-auto p-6">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#d6ead8] border-t-[#7e9e6c] rounded-full animate-spin mb-4" />
          <p className="text-sm text-gray-500 animate-pulse">Retrieving records...</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mb-4">
            <FiClock size={32} />
          </div>
          <h4 className="text-gray-800 font-semibold">No records found</h4>
          <p className="text-sm text-gray-400 max-w-[240px] mt-1">
            There are no dividend disbursements recorded for this account yet.
          </p>
        </div>
      ) : (
        <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-4 py-3.5 font-bold text-gray-500">
                  <div className="flex items-center gap-1.5"><FiCalendar size={14}/> Date</div>
                </th>
                <th className="px-4 py-3.5 font-bold text-gray-500 text-right">
                  <div className="flex items-center justify-end gap-1.5"> Amount</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((r, idx) => (
                <tr 
                  key={r.id ?? idx} 
                  className="group hover:bg-[#d6ead8]/10 transition-colors"
                >
                  <td className="px-4 py-4 text-gray-700 font-semibold">
                    {r.date ? new Date(r.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : "—"}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-[#7e9e6c] font-bold text-base">
                      ₱{fmtAmount(r.amount ?? r.dividend ?? r.value)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
</div>
  );
}
