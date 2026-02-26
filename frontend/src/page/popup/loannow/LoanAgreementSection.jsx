import React from "react";

export default function LoanAgreementSection({
  loanAmount,
  setLoanAmount,
  duration,
  setDuration,
  startMonth,
  endMonth,
  setEndMonth, // still provided but not used directly by user
  months,
}) {
  return (
    <div className="bg-[#f4f9f4] mt-6 border border-[#b8d8ba] rounded-2xl p-6 text-gray-700 text-justify">
      <p className="leading-relaxed">
        I hereby promise to pay{" "}
        <span className="font-semibold text-[#7e9e6c]">
          Carmona Townhomes Homeowners Multi-purpose Cooperative
        </span>{" "}
        the sum of{" "}
        <input
          type="text"
          value={loanAmount}
          onChange={(e) => {
            const value = e.target.value;
            // allow only digits (you can change to allow decimals if needed)
            if (/^\d*$/.test(value)) setLoanAmount(value);
          }}
          placeholder="loan amount"
          className="border-b border-gray-400 focus:border-[#7e9e6c] outline-none px-2 text-center w-46"
          required
        />{" "}
        pesos for{" "}
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="border-b border-gray-400 focus:border-[#7e9e6c] outline-none px-1"
          required
        >
          <option value="">--</option>
          <option value="3">3</option>
          <option value="6">6</option>
          <option value="9">9</option>
          <option value="12">12</option>
        </select>{" "}
        month(s) starting next month{" "}
        <input
          type="text"
          value={startMonth}
          readOnly
          className="border-b border-gray-400 bg-transparent text-center outline-none px-1 cursor-not-allowed"
        />{" "}
        to{" "}
        <input
          type="text"
          value={endMonth}
          readOnly
          className="border-b border-gray-400 bg-transparent text-center outline-none px-1 cursor-not-allowed"
        />
        .
      </p>
      <p className="mt-4 text-xs text-gray-500 italic text-center">
        Note: The starting and ending month may be changed depending on when the admin approves the loan.
      </p>
    </div>
  );
}
