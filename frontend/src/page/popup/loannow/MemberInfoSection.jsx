import React from "react";
import { FiUser, FiMapPin} from "react-icons/fi";

export default function MemberInfoSection({ memberName, address }) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
              <FiUser /> Member Name
            </label>
            <input
              type="text"
              value={memberName}
              readOnly
              className="w-full border border-gray-100 rounded-xl px-4 py-3 bg-gray-50 text-gray-600 font-semibold focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
              <FiMapPin /> Address
            </label>
            <input
              type="text"
              value={address}
              readOnly
              className="w-full border border-gray-100 rounded-xl px-4 py-3 bg-gray-50 text-gray-600 font-semibold focus:outline-none"
            />
          </div>
        </div>
    </>
  );
}