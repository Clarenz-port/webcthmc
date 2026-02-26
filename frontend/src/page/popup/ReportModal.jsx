import React, { useState, useEffect } from "react";
import { notify } from "../../utils/toast";
import API from '../../apis/axios.js';
import { FaFileAlt, FaCalendarAlt, FaDownload, FaTimes, FaChartLine, FaLayerGroup } from 'react-icons/fa';

export default function ReportModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [reportType, setReportType] = useState("balance");
  const [period, setPeriod] = useState("monthly");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState("");

  const downloadReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const body = { reportType, period, year, month, mode: "summary" };
      const res = await API.post("/api/reports/generate", body, {
  headers: { Authorization: `Bearer ${token}` },
  responseType: "blob",
});

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `report-${Date.now()}.pdf`;
      link.click();
    } catch (err) {
      notify.success("Failed to generate report");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Removed ledger-specific effect
  
  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4">
  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
    
    {/* HEADER */}
    <div className="bg-[#7e9e6c] p-6 text-white flex justify-between items-center">
      <div className="flex items-center gap-3">
        <FaFileAlt className="text-2xl" />
        <h2 className="text-xl font-bold tracking-tight">Generate Report</h2>
      </div>
    </div>

    <div className="p-8">
      {/* REPORT TYPE */}
      <div className="mb-5">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
          <FaChartLine className="text-[#7e9e6c]" />
          Report Type
        </label>
        <select 
          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-700 outline-none focus:ring-2 focus:ring-[#7e9e6c]/20 focus:border-[#7e9e6c] transition-all cursor-pointer"
          onChange={e => setReportType(e.target.value)}
        >
          <option value="balance">Balance Sheet</option>
          <option value="income">Income Statement</option>
          <option value="cashflow">Cash Flow</option>
        </select>
      </div>

      {/* PERIOD */}
      <div className="mb-5">
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
          <FaCalendarAlt className="text-[#7e9e6c]" />
          Reporting Period
        </label>
        <select 
          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-700 outline-none focus:ring-2 focus:ring-[#7e9e6c]/20 focus:border-[#7e9e6c] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          onChange={e => setPeriod(e.target.value)}
        >
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      {/* CONDITIONAL DATE SELECTORS */}
      {period !== "all" && (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-5 space-y-3 animate-in slide-in-from-top-2">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Select Year</label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(e.target.value)}
              className="w-full border border-gray-200 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-[#7e9e6c]/20"
              placeholder="e.g. 2024"
            />
          </div>

          {period === "monthly" && (
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Select Month</label>
              <select
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
                className="w-full border border-gray-200 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-[#7e9e6c]/20"
              >
                <option value="">Choose Month...</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const monthName = new Date(0, i).toLocaleString('en', { month: 'long' });
                  return (
                    <option key={i + 1} value={i + 1}>
                      {monthName} ({i + 1})
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>
      )}

      {/* MODE SELECTOR REMOVED: Always summary mode */}

      {/* FOOTER ACTIONS */}
      <div className="flex flex-col gap-3">
        <button
          onClick={downloadReport}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#7e9e6c] text-white py-4 rounded-xl font-bold shadow-lg shadow-[#7e9e6c]/20 hover:bg-[#6a8b5a] active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <FaDownload />
              Download Report
            </>
          )}
        </button>
        
        <button 
          onClick={onClose} 
          className="w-full py-3 text-gray-400 font-semibold hover:text-gray-600 transition-colors"
        >
          Close Window
        </button>
      </div>
    </div>
  </div>
</div>
  );
}
