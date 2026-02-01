import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCog } from "react-icons/fa";

export default function Adminnavbar({ onManageNotice }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [role, setRole] = useState("");
  const [siteLogo, setSiteLogo] = useState(null);
  const [siteName, setSiteName] = useState('CTHMC');
  const navigate = useNavigate();

  // Get user role from localStorage
  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    if (savedRole) setRole(savedRole.toLowerCase().trim());
  }, []);

  // Load site logo/name and listen for configuration changes
  useEffect(() => {
    const load = () => {
      const logo = localStorage.getItem('siteLogo');
      const sname = localStorage.getItem('siteName') || 'CTHMC';
      setSiteLogo(logo);
      setSiteName(sname);
    };

    load();
    window.addEventListener('siteConfigChanged', load);
    return () => window.removeEventListener('siteConfigChanged', load);
  }, []);

  // Handle logout properly
  const handleLogout = () => {
    // clear stored login data
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");

    // prevent going back to dashboard after logout
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = function () {
      navigate("/login", { replace: true });
    };

    // redirect to login
    navigate("/login", { replace: true });
  };

  return (
    <>
      <header className="bg-gradient-to-r from-emerald-900 to-emerald-800 px-6 py-0 flex justify-between items-center shadow-lg shadow-emerald-900/20 fixed top-0 left-0 right-0 z-50 h-20">
  
  {/* LEFT SECTION: LOGO + TITLE */}
  {/* Added 'ml-20' here to keep it pushed right (assuming you have a sidebar) */}
  <div className="flex items-center gap-4 ml-20 transition-all cursor-default">
    
    {/* 🟢 CIRCLE LOGO SLOT */}
    <div className="w-12 h-12 rounded-full bg-white border-emerald-400/30 shadow-md flex items-center justify-center overflow-hidden relative">
      {siteLogo ? (
        <img src={siteLogo} alt={siteName || 'Logo'} className="w-full h-full object-cover" />
      ) : (
        <img src="https://via.placeholder.com/150" alt="Logo" className="w-full h-full object-cover" />
      )}
    </div>

    {/* SYSTEM TITLE */}
    <div className="flex flex-col justify-center">
      <h2 className="text-2xl font-black text-white tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-emerald-200 drop-shadow-sm leading-none">
        {siteName || 'CTHMC'}
      </h2>

    </div>
  </div>

  {/* RIGHT SIDE (Empty for now, but ready for content) */}
  <div></div>

</header>
    </>
  );
}
