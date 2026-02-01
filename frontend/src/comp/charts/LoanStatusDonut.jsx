import { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { FaClock, FaCheckCircle, FaExclamationTriangle, FaChartPie } from 'react-icons/fa';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

export default function LoanStatusDonut({ pending = 0, active = 0, duedate = 0 }) {
  const total = pending + active + duedate;
  const totalLoans = pending + active + duedate;
  const pct = v => (total === 0 ? "0%" : `${Math.round((v/total) * 100)}%`);

const data = useMemo(() => ({
  labels: ["Pending", "Active", "Duedate"],
  datasets: [{
    data: [pending, active, duedate],
    backgroundColor: ["#f59e0b", "#10b981", "#ef4444"], // Modern Amber, Emerald, Red
    hoverBackgroundColor: ["#fbbf24", "#34d399", "#f87171"],
    borderColor: "#ffffff",
    borderWidth: 4, // Thicker border for a "segmented" look
    hoverOffset: 10
  }]
}), [pending, active, duedate]);

const options = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "75%", // Thinner doughnut for a more modern look
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1f2937',
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: ctx => ` ${ctx.label}: ${ctx.raw.toLocaleString()} (${pct(ctx.raw)})`
      }
    }
  }
};

return (
  
  <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row gap-10 items-center transition-all hover:shadow-md">
    
    {/* CHART SECTION WITH CENTER TEXT */}
    <div className="relative w-80 h-102 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <FaChartPie size={20} />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 tracking-tight">Loan Status</h3>
      </div>
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <br/>
        <br/>
        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total</span>
        <span className="text-3xl font-black text-gray-800">{totalLoans.toLocaleString()}</span>
      </div>
    </div>

    {/* CONTENT & LEGEND SECTION */}
    <div className="flex-1 w-full">
      
      <div className="grid grid-cols-1 gap-3">
        <LegendRow 
          icon={<FaClock />} 
          color="#f59e0b" 
          bgColor="bg-amber-50"
          label="Pending Applications" 
          value={pending} 
          pct={pct(pending)} 
        />
        <LegendRow 
          icon={<FaCheckCircle />} 
          color="#10b981" 
          bgColor="bg-emerald-50"
          label="Active Loans" 
          value={active} 
          pct={pct(active)} 
        />
        <LegendRow 
          icon={<FaExclamationTriangle />} 
          color="#ef4444" 
          bgColor="bg-red-50"
          label="Overdue / Duedate" 
          value={duedate} 
          pct={pct(duedate)} 
        />
      </div>
    </div>
  </div>
  );
}

function LegendRow({ icon, color, bgColor, label, value, pct }) {
  return (
    <div className="group flex items-center justify-between p-3 rounded-2xl border border-transparent hover:border-gray-100 hover:bg-gray-50 transition-all cursor-default">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center text-lg`} style={{ color: color }}>
          {icon}
        </div>
        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-tight">{label}</div>
          <div className="text-lg font-extrabold text-gray-800 leading-tight">
            {value.toLocaleString()}
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <div className="text-sm font-black text-gray-700 bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm">
          {pct}
        </div>
      </div>
    </div>
  );
}
