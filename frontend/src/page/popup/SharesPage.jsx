import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  FiArrowLeft, 
  FiTrendingUp, 
  FiCalendar, 
  FiUser, 
  FiCreditCard, 
  FiDollarSign, 
  FiLayers,
  FiInbox
} from "react-icons/fi";

export default function SharesPage({ onBack, members = [] }) {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Formatters
  const fmtMoney = (v) => {
    const n = Number(v || 0);
    return n.toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    });
  };

  const fmtDate = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return dt.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Find member name
  const findMemberName = (row) => {
    const id =
      row.userId ??
      row.memberId ??
      row.user_id ??
      row.member_id ??
      row.user?.id ??
      null;

    if (id) {
      const m = members.find(
        (mm) =>
          String(mm.id) === String(id) || String(mm.userId) === String(id)
      );
      if (m)
        return `${m.firstName || ""} ${m.lastName || ""}`.trim() ||
          m.name ||
          "Member";
    }

    return (
      row.memberName ||
      row.name ||
      row.member ||
      row.userName ||
      "Member"
    );
  };

  // Fetch shares
  useEffect(() => {
    let cancelled = false;

    const fetchShares = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token") || "";
        const endpoints = [
          "/api/shares",
          "/api/shares/all",
          "http://localhost:8000/api/shares",
        ];

        let res = null;

        for (const ep of endpoints) {
          try {
            res = await axios.get(ep, {
              headers: token
                ? { Authorization: `Bearer ${token}` }
                : undefined,
            });
            if (res?.status >= 200 && res?.status < 300) break;
          } catch (e) {}
        }

        const rows = res?.data ?? [];
        if (!cancelled)
          setShares(Array.isArray(rows) ? rows : rows.rows ?? []);
      } catch (err) {
        if (!cancelled) setError("Failed to load shares.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchShares();
    return () => (cancelled = true);
  }, [members]);

  // Compute TOTAL SHARES AMOUNT
  const totalSharesAmount = shares.reduce((sum, r) => {
    const amt =
      r.shareamount ??
      r.shareAmount ??
      r.amount ??
      r.value ??
      0;
    return sum + Number(amt || 0);
  }, 0);

  return (
    <div>
  
  {/* HEADER & SUMMARY HERO */}
  <div>
    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
      
      {/* Back & Title */}
      <div className="flex items-center gap-5 self-start">
        <button
          onClick={onBack}
          className="p-3 bg-white border border-gray-100 text-gray-500 hover:text-[#7e9e6c] hover:border-[#7e9e6c] rounded-xl transition-all shadow-sm active:scale-95 group"
          title="Go Back"
        >
          <FiArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Shares</h2>
          
        </div>
      </div>

      {/* Total Shares Balance Card */}
      <div className="w-full md:w-auto">
        <div className=" rounded-[1.5rem]">
          <div className="bg-[#f5f9ef] px-6 py-2 rounded-[1.3rem] flex items-center gap-4">
            <div className="p-2 bg-[#d6ead8] text-[#7e9e6c] rounded-xl">
              <FiTrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Total Shares</p>
              <h3 className="text-xl font-black text-gray-800 font-mono">
                {loading ? "---" : fmtMoney(totalSharesAmount)}
              </h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* CONTENT AREA */}
  <div>
    {error ? (
      <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-bold">
        <FiInbox /> {error}
      </div>
    ) : loading ? (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-[#d6ead8] border-t-[#7e9e6c] rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-black animate-pulse uppercase tracking-widest">Synchronizing Ledger...</p>
      </div>
    ) : shares.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-20 text-gray-300">
        <FiLayers size={64} className="mb-4 opacity-20" />
        <p className="font-bold uppercase tracking-widest text-xs">No share transactions found</p>
      </div>
    ) : (
      <div className="bg-gray-50 rounded-t-[2rem] mt-3 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[#7e9e6c]">
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]"><div className="flex items-center gap-2"><FiCalendar /> Date</div></th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]"><div className="flex items-center gap-2"><FiUser /> Member</div></th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em]"><div className="flex items-center gap-2"><FiDollarSign /> Amount</div></th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] border-r-0 rounded-r-2xl"><div className="flex items-center gap-2"><FiCreditCard /> Method</div></th>
            </tr>
          </thead>

          <tbody>
            {shares.map((r, idx) => {
              // Keeping your existing property fallbacks
              const rawDate = r.date ?? r.createdAt ?? r.created_at ?? r.transaction_date;
              const paymentMethod = r.paymentMethod ?? r.method ?? r.mode ?? r.channel ?? "—";
              const amt = r.shareamount ?? r.shareAmount ?? r.amount ?? r.value ?? 0;
              const memberName = findMemberName(r);

              return (
                <tr 
                  key={r.id ?? idx} 
                >
                  <td className="px-10 py-4 bg-white">
                    <span className="text-xs font-bold text-gray-500">{fmtDate(rawDate)}</span>
                  </td>
                  <td className="px-10 py-4 bg-white group-hover:bg-[#f5f9ef] border-y border-transparent group-hover:border-[#7e9e6c]/20">
                    <span className="text-sm font-black text-gray-700 uppercase tracking-tight">{memberName}</span>
                  </td>
                  <td className="px-10 py-4 bg-white">
                    <span className="text-sm font-black text-[#7e9e6c] font-mono">{fmtMoney(amt)}</span>
                  </td>
                  <td className="px-10 py-4 bg-white">
                    <span className="text-[10px] font-black bg-white px-3 py-1 rounded-lg border border-gray-100 text-gray-400 uppercase tracking-tighter shadow-sm">
                      {String(paymentMethod)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>

  {/* FOOTER METADATA */}
  <div className="bg-gray-50 rounded-b-[2rem] px-8 py-4 flex justify-between items-center border-t border-gray-50">
     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
       Transaction Count: {shares.length}
     </p>
  </div>
</div>
  );
}
