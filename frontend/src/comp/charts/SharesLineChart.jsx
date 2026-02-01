// SharesLineChart.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { FaChartLine, FaCalendarAlt, FaCoins, FaInfoCircle } from "react-icons/fa";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import axios from "axios";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function SharesLineChart({ members = [], dataPoints = null }) {
  const currentYear = new Date().getFullYear();
  const [monthsToShow, setMonthsToShow] = useState(12);
  const [year, setYear] = useState(currentYear);
  const [apiMonthlyTotals, setApiMonthlyTotals] = useState(null);
  const [loadingApi, setLoadingApi] = useState(false);
  const chartRef = useRef(null);

  const labels = MONTH_NAMES.slice(0, monthsToShow);

  useEffect(() => {
    // skip API if dataPoints supplied or members have shareHistory
    const hasShareHistory = Array.isArray(members) && members.some(m => Array.isArray(m.shareHistory) && m.shareHistory.length);
    if (Array.isArray(dataPoints) && dataPoints.length) { setApiMonthlyTotals(null); return; }
    if (hasShareHistory) { setApiMonthlyTotals(null); return; }

    let cancelled = false;
    (async () => {
      setLoadingApi(true);
      try {
        const token = (localStorage.getItem("token") || "").trim();
        const base = "http://localhost:8000";
        const url = `${base}/api/shares/by-year/${year}`;
        const res = await axios.get(url, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });

        let monthly = Array(12).fill(0);
        if (res?.data?.monthly && Array.isArray(res.data.monthly)) {
          monthly = res.data.monthly.map(v => Number(v || 0));
        } else if (Array.isArray(res.data)) {
          res.data.forEach(r => {
            const m = Number(r.month);
            const t = Number(r.total) || 0;
            if (m >= 1 && m <= 12) monthly[m - 1] = Math.round(t);
          });
        } else if (res?.data?.rows && Array.isArray(res.data.rows)) {
          res.data.rows.forEach(r => {
            const m = Number(r.month);
            const t = Number(r.total) || 0;
            if (m >= 1 && m <= 12) monthly[m - 1] = Math.round(t);
          });
        }

        if (!cancelled) setApiMonthlyTotals(monthly);
      } catch (err) {
        console.error("[SharesLineChart] fetch error:", err);
        if (!cancelled) setApiMonthlyTotals(Array(12).fill(0));
      } finally {
        if (!cancelled) setLoadingApi(false);
      }
    })();

    return () => { cancelled = true; };
  }, [members, dataPoints, year]);

  // Build numeric values safely
  const values = useMemo(() => {
    if (Array.isArray(dataPoints) && dataPoints.length) {
      const v = dataPoints.slice(0, monthsToShow).map(d => Number(d.totalShares || 0));
      while (v.length < monthsToShow) v.push(0);
      return v;
    }

    const hasShareHistory = Array.isArray(members) && members.some(m => Array.isArray(m.shareHistory) && m.shareHistory.length);
    if (hasShareHistory) {
      const monthlyTotals = Array(monthsToShow).fill(0);
      members.forEach(m => {
        if (Array.isArray(m.shareHistory)) {
          m.shareHistory.forEach(entry => {
            const eYear = Number(entry.year);
            const eMonth = Number(entry.month);
            const eShares = Number(entry.shares) || 0;
            if (eYear === Number(year) && eMonth >= 1 && eMonth <= monthsToShow) {
              monthlyTotals[eMonth - 1] += eShares;
            }
          });
        } else {
          const total = Number(m.totalShares ?? m.shares ?? 0);
          if (total > 0) {
            const perMonth = total / 12;
            for (let i = 0; i < monthsToShow; i++) monthlyTotals[i] += perMonth;
          }
        }
      });
      return monthlyTotals.map(v => Math.round(v));
    }

    if (Array.isArray(apiMonthlyTotals)) {
      return apiMonthlyTotals.slice(0, monthsToShow).map(v => Math.round(v || 0));
    }

    return Array(monthsToShow).fill(0);
  }, [members, dataPoints, apiMonthlyTotals, monthsToShow, year]);

  const totalShares = values.reduce((a,b) => a + b, 0);
const data = {
  labels,
  datasets: [
    {
      label: "Total Shares",
      data: values,
      borderColor: "#22c55e", // More vibrant green
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, "rgba(34, 197, 94, 0.2)");
        gradient.addColorStop(1, "rgba(34, 197, 94, 0)");
        return gradient;
      },
      fill: true,
      tension: 0.4, // Smoother curve
      pointRadius: 0, // Hidden by default for a cleaner look
      pointHoverRadius: 6,
      pointHoverBackgroundColor: "#22c55e",
      pointHoverBorderColor: "#fff",
      pointHoverBorderWidth: 3,
      borderWidth: 3,
    },
  ],
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#1f2937",
      titleFont: { size: 14, weight: 'bold' },
      bodyFont: { size: 13 },
      padding: 12,
      cornerRadius: 10,
      displayColors: false,
      callbacks: {
        label: ctx => ` ${Number(ctx.parsed.y || 0).toLocaleString()} Shares`
      }
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { 
        color: "#9ca3af",
        font: { size: 11 }
      }
    },
    y: {
      beginAtZero: true,
      grid: { 
        color: "rgba(0,0,0,0.04)",
        drawBorder: false 
      },
      ticks: {
        color: "#9ca3af",
        font: { size: 11 },
        callback: (v) => {
          if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
          if (v >= 1_000) return (v / 1_000).toFixed(1) + "k";
          return v;
        }
      }
    },
  },
};

  // small header controls
  const yearOptions = [];
  for (let y = currentYear + 1; y >= currentYear - 5; y--) yearOptions.push(y);

  return (
  <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 p-6 h-[480px] flex flex-col transition-all hover:shadow-md">
    {/* HEADER SECTION */}
    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-green-50 rounded-2xl text-green-600">
          <FaChartLine size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800 tracking-tight">Total Contribution and Savings</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-1 text-xs font-medium text-gray-400 uppercase tracking-wider">
              <FaCalendarAlt /> Year {year}
            </span>
            <span className="text-gray-300">•</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-start">
        {/* TOTAL SHARES CHIP */}
        <div className="hidden lg:flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
          <FaCoins className="text-yellow-500" />
          <span className="text-sm font-bold text-gray-700">
            {totalShares.toLocaleString()} <span className="text-gray-400 font-normal">Total</span>
          </span>
        </div>

        {/* YEAR SELECTOR */}
        <div className="relative">
          <select 
            value={year} 
            onChange={e => setYear(Number(e.target.value))} 
            className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 pr-10 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all cursor-pointer shadow-sm"
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>
    </div>


      <div className="flex-1 relative min-h-[200px]">
      <Line ref={chartRef} data={data} options={options} />
    </div>

      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
      {loadingApi ? (
        <div className="flex items-center gap-2 text-gray-400 animate-pulse">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <p className="text-xs font-medium">Syncing data for {year}...</p>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-gray-400 text-[11px] font-semibold uppercase tracking-tighter">
          <FaInfoCircle />
          Data reflects verified share records
        </div>
      )}
    </div>
  </div>

    
  );
}
