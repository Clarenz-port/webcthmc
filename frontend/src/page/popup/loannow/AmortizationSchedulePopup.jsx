import React from "react";

export default function AmortizationSchedulePopup({ schedule, formatCurrency, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl w-[600px] max-h-[80vh] overflow-y-auto p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-5 text-gray-500 hover:text-black text-3xl"
        >
          &times;
        </button>
        <h3 className="text-2xl font-bold text-center text-[#7e9e6c] mb-4">
          Amortization Schedule
        </h3>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#f4f9f4] text-[#56794a] border-b">
              <th className="py-2 px-2 text-left">Month</th>
              <th className="py-2 px-2 text-right">Interest</th>
              <th className="py-2 px-2 text-right">Balance</th>
              <th className="py-2 px-2 text-right">Armotization</th>
              
            </tr>
          </thead>
          <tbody>
            {schedule.map((row) => (
              <tr key={row.month} className="border-b hover:bg-[#f9fcf9]">
                <td className="py-1 px-2">{row.month}</td>
                <td className="py-1 px-2 text-right">{formatCurrency(row.interestPayment)}</td>
                <td className="py-1 px-2 text-right">{formatCurrency(row.remainingBalance)}</td>
                <td className="py-1 px-2 text-right">{formatCurrency(row.totalPayment)}</td>
                
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}