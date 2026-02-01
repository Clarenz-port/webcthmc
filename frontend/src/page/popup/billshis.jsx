import React from "react";
import { FiFileText, FiX, FiCalendar, FiTag, FiCreditCard, FiDollarSign } from "react-icons/fi";

export default function BillsHistory({
  onBack,
  rows = null, // pass bills via props (array)
  loading = false, // pass loading state if available
}) {
 
  const data = Array.isArray(rows) ? rows : sampleRecords;

  // helper to normalize a single bill record to expected shape
  const normalize = (b) => {
    if (!b) return null;
    const date =
      b.date ||
      b.paidAt ||
      b.createdAt ||
      b.created_at ||
      (typeof b === "string" ? b : null);
    const receipt = b.receipt || b.receiptNo || b.receipt_no || b.reference || b.ref || "";
    const billName = b.billName || b.name || b.bill || b.description || b.title || "Bill";
    const amount = Number(b.amount ?? b.total ?? b.paymentAmount ?? b.payment_amount ?? 0) || 0;
    const paymentMethod = b.paymentMethod || b.method || b.mode || b.channel || "Unknown";
    return { date, receipt, billName, amount, paymentMethod };
  };

  const normalizedData = data.map(normalize).filter(Boolean);

  const formatDate = (d) => {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return String(d);
      return dt.toLocaleDateString("en-PH");
    } catch {
      return String(d);
    }
  };

  const formatPeso = (n) =>
    Number(n || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 0 });

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50 p-4">
  <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-gray-100">
    
    {/* MODAL HEADER */}
    <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-[#d6ead8] text-[#7e9e6c] rounded-xl shadow-sm">
          <FiFileText size={22} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Bills History</h3>
        </div>
      </div><div className="h-1 w-20 bg-[#7e9e6c] rounded-full"></div>
    </div>

    {/* CONTENT AREA */}
    <div className="flex-1 overflow-auto p-6 bg-white">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#d6ead8] border-t-[#7e9e6c] rounded-full animate-spin mb-4" />
          <p className="text-sm text-gray-500 font-medium animate-pulse">Fetching records...</p>
        </div>
      ) : normalizedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mb-4 border border-gray-100">
            <FiFileText size={32} />
          </div>
          <h4 className="text-gray-800 font-semibold text-lg">No records found</h4>
          <p className="text-sm text-gray-400 max-w-[260px] mt-1">
            There are no bill payment records available for this member.
          </p>
        </div>
      ) : (
        <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-4 py-4 text-left font-bold text-gray-500 uppercase tracking-tighter">
                  <div className="flex items-center gap-2"><FiCalendar/> Date</div>
                </th>
                <th className="px-4 py-4 text-left font-bold text-gray-500 uppercase tracking-tighter">
                  <div className="flex items-center gap-2"><FiTag /> Bill Name</div>
                </th>
                <th className="px-4 py-4 text-left font-bold text-gray-500 uppercase tracking-tighter">
                  <div className="flex items-center gap-2"><FiCreditCard  /> Method</div>
                </th>
                <th className="px-4 py-4 text-left font-bold text-gray-500 uppercase tracking-tighter">
                   <div className="flex items-center gap-2"> Amount</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {normalizedData.map((record, index) => (
                <tr 
                  key={index} 
                  className="group hover:bg-[#d6ead8]/15 transition-colors"
                >
                  <td className="px-4 py-4 text-gray-600 font-medium whitespace-nowrap">
                    {formatDate(record.date)}
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-gray-800 font-bold">
                      {record.billName}
                    </span>
                  </td>
                  <td className="px-4 py-">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-[11px] font-extrabold uppercase tracking-tight group-hover:shadow-sm ">
                      {record.paymentMethod}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[#7e9e6c] font-black">
                    {formatPeso(record.amount)}                   
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {/* MODAL FOOTER */}
    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
      <div >
      </div>
      <button
        onClick={onBack}
        className="bg-[#b8d8ba] text-white px-6 py-2 rounded-lg hover:bg-[#8fa182] hover:shadow-lg transition-all active:scale-95"
      >
        Close
      </button>
    </div>

  </div>
</div>
  );
}
