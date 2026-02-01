import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaHome,
  FaBullhorn,
  FaHandHoldingUsd,
  FaChartPie,
  FaSignOutAlt,
  FaUserShield, FaCog, FaExclamationTriangle 
} from "react-icons/fa";



export default function Sidebar({ onNavigate = () => {} }) {
  const [role, setRole] = useState("");
  const [showConfirm, setShowConfirm] = useState(false); // ← NEW
  const navigate = useNavigate();

  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    if (storedRole) setRole(storedRole.toLowerCase().trim());
  }, []);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    navigate("/login", { replace: true });
  };

  // CLICKABLE MENU ITEM
  const navItem = (label, value, Icon = null) => (
    <div
      className="flex items-center gap-4 px-3 py-3 rounded hover:bg-[#d6ead8] text-lg cursor-pointer font-extrabold"
      onClick={() => onNavigate(value)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) =>
        (e.key === "Enter" || e.key === " ") && onNavigate(value)
      }
    >
      {Icon}
      <span>{label}</span>
    </div>
  );

 const headerItem = (label, icon) => (
  <div className="mt-6 mb-2 flex items-center gap-2 px-3 text-xs font-bold uppercase tracking-wider ">
    {icon && <span className="text-sm">{icon}</span>}
    <span>{label}</span>
  </div>
);
  const subItem = (label, value,) => (
    <div
      className="relative flex cursor-pointer items-center rounded-lg py-2.5 pl-12 pr-4 text-[14px] font-medium transition-colors duration-200 text-gray-700 hover:bg-[#d6ead8] hover:text-gray-900"
      onClick={() => onNavigate(value)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) =>
        (e.key === "Enter" || e.key === " ") && onNavigate(value)
      }
    >
      <span className={`absolute left-[26px] h-1.5 w-1.5 rounded-full bg-gray-500`}></span>
      {label}
    </div>
  );

  return (
    <>
      {/* ================= SIDEBAR ================= */}
      <aside
        className="fixed left-0 top-24 w-67 h-[calc(100vh-6rem)] bg-white border-r border-gray-200 p-4 overflow-auto z-20 flex flex-col justify-between"
        aria-label="Sidebar"
      >
        <div>
          <div className="mb-6 px-2">
            <p className="text-2xl font-semibold text-gray-700">Welcome,</p>
            <p className="text-2xl font-extrabold text-gray-700">
              {role === "superadmin" ? "Super Admin" : "Admin"}
            </p>
          </div>

          <hr className="my-3" />

          <nav className="mb-4">
            {navItem("Dashboard", "dashboard", <FaHome />)}

            {headerItem("Financial Records", <FaHandHoldingUsd />)}
            <div className="ml-2 mt-1 font-semibold space-y-1 text-[15px]">
              {subItem("Pending Loans", "pendingLoans")}
              {subItem("Approved Loans", "approvedLoan")}
              {subItem("Due Dates", "totalloan")}
              {subItem("Shares", "shares")}
            </div>

            {headerItem("Users", <FaUsers />)}
            <div className="ml-2 mt-1 font-semibold space-y-1 text-[15px]">
              {subItem("Member", "users:members")}
              {role === "superadmin" && subItem("Admin", "users:admins")}
              {subItem("Activity Logs", "users:activity")}
            </div>

            {headerItem("Settings", <FaCog />)}
            <div className="ml-2 mt-1 font-semibold space-y-1 text-[15px]">

              {subItem("Manage Notice", "notice")}
              {subItem("Configuration", "configuration")}
            </div>
          </nav>

          <hr className="my-3" />
        </div>

        {/* LOGOUT BUTTON — triggers modal */}
        <div className="px-2 mb-4">
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full flex items-center justify-center gap-3 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-4 py-3.5 rounded-xl font-bold transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </aside>

      {/* ================= CONFIRMATION MODAL ================= */}
      {showConfirm && (
  <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 animate-in fade-in duration-200">
    <div className="bg-white rounded-3xl p-8 w-[380px] shadow-2xl text-center transform scale-100 animate-in zoom-in-95 duration-200 border border-gray-100">
      
      {/* Icon Bubble */}
      <div className="mx-auto w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
        <FaExclamationTriangle size={28} />
      </div>

      <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Log Out?</h2>
      <p className="text-gray-500 mb-8 leading-relaxed">
        Are you sure you want to log out? <br/>You will need to sign in again.
      </p>

      <div className="flex gap-3">
        <button
          onClick={() => setShowConfirm(false)}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-xl font-bold transition-colors"
        >
          Cancel
        </button>

        <button
          onClick={handleLogout}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all hover:scale-105"
        >
          Yes, Logout
        </button>
      </div>
    </div>
  </div>
)}
    </>
  );
}
