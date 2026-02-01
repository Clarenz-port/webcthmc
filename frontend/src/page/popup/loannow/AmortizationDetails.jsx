import React from "react";

export default function AmortizationDetails({
  amortization,
  interest,
  serviceCharge,
  filingFee,
  capitalBuildUp,
  netAmount,
  formatCurrency,
  onShowSchedule,
}) {
  return (
    <div className="mt-6 border border-[#b8d8ba] rounded-2xl p-6 bg-[#f9fcf9]">
      <h3 className="text-xl font-bold text-[#7e9e6c] mb-4 text-center">
        Amortization Details
      </h3>

      <div className="space-y-3 text-gray-700">
        <div className="flex justify-between items-center">
          <span className="font-medium flex items-center gap-2">
            Amortization (Monthly)
            <button
              type="button"
              onClick={onShowSchedule}
              className="text-[#7e9e6c] hover:text-[#56794a] font-bold text-lg"
            >
              ⓘ
            </button>
          </span>
          <input
            type="text"
            value={formatCurrency(amortization)}
            readOnly
            className="border border-[#b8d8ba] rounded-md w-40 px-2 py-1 text-right bg-gray-100"
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="font-medium">2% Loan Interest</span>
          <input
            type="text"
            value={formatCurrency(interest)}
            readOnly
            className="border border-[#b8d8ba] rounded-md w-40 px-2 py-1 text-right bg-gray-100"
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="font-medium">2% Service Charge</span>
          <input
            type="text"
            value={formatCurrency(serviceCharge)}
            readOnly
            className="border border-[#b8d8ba] rounded-md w-40 px-2 py-1 text-right bg-gray-100"
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="font-medium">1% Filing Fee</span>
          <input
            type="text"
            value={formatCurrency(filingFee)}
            readOnly
            className="border border-[#b8d8ba] rounded-md w-40 px-2 py-1 text-right bg-gray-100"
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="font-medium">2% Capital Build-Up</span>
          <input
            type="text"
            value={formatCurrency(capitalBuildUp)}
            readOnly
            className="border border-[#b8d8ba] rounded-md w-40 px-2 py-1 text-right bg-gray-100"
          />
        </div>

        <div className="flex justify-between items-center border-t border-gray-300 pt-2 mt-2">
          <span className="font-bold text-[#7e9e6c]">Net Amount</span>
          <input
            type="text"
            value={formatCurrency(netAmount)}
            readOnly
            className="border border-[#b8d8ba] rounded-md w-40 px-2 py-1 text-right font-semibold text-[#7e9e6c] bg-gray-100"
          />
        </div>
      </div>
    </div>
  );
}