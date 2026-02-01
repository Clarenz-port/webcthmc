import React from "react";
import { FiBriefcase} from "react-icons/fi";

export default function PurposeSection({ purpose, setPurpose }) {
  return (
   <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
            <FiBriefcase /> Loan Purpose
          </label>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-700 font-medium focus:ring-2 focus:ring-[#7e9e6c] focus:border-transparent transition-all outline-none appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%22%20stroke%3D%22%237e9e6c%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_1rem_center] bg-no-repeat"
          >
            <option value="">Select purpose</option>
            <option value="Business">Business Investment</option>
            <option value="Education">Educational Support</option>
            <option value="Personal">Personal / Emergency</option>
          </select>
        </div>
  );
}