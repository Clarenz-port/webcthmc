import React from "react";
import { FiBriefcase, FiChevronDown} from "react-icons/fi";

export default function PurposeSection({ purpose, setPurpose }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
        <FiBriefcase /> Loan Purpose
      </label>
      <div className="relative">
        <select
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          required
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 font-medium focus:ring-2 focus:ring-[#7e9e6c] focus:border-transparent transition-all outline-none appearance-none pr-10"
        >
          <option value="">Select purpose</option>
          <option value="Business">Business Investment</option>
          <option value="Education">Educational Support</option>
          <option value="Personal">Personal / Emergency</option>
        </select>
        <span className="pointer-events-none absolute right-4 top-1/2 transform -translate-y-1/2 text-[#7e9e6c] text-xl">
          <FiChevronDown />
        </span>
      </div>
    </div>
  );
}