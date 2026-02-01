
import axios from "axios";
import { notify } from "../utils/toast";
import React, { useState, useRef, useEffect } from "react";
import { FaBell, FaCog,  FaUserEdit, FaSignOutAlt, FaInfoCircle, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import EditProfilePopup from "../page/popup/editprofile.jsx";

export default function MemberNavbar() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showNotifPopup, setShowNotifPopup] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [member, setMember] = useState(null); // fetched current member
  const [siteLogo, setSiteLogo] = useState(null);
  const [siteName, setSiteName] = useState('CTHMC');
  const [selectedNotice, setSelectedNotice] = useState(null);
  const settingsRef = useRef();
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [readIds, setReadIds] = useState([]); // local per-user read tracking
  const [unreadCount, setUnreadCount] = useState(0);

  // utility to scope read state per username
  const username = localStorage.getItem("username") || "guest";
  const readStorageKey = `readNotices:${username}`;
  const getReadIds = () => JSON.parse(localStorage.getItem(readStorageKey) || "[]");
  const saveReadIds = (ids) => localStorage.setItem(readStorageKey, JSON.stringify(ids));

  const markAsRead = (id) => {
    const ids = getReadIds();
    if (!ids.includes(id)) {
      const next = [...ids, id];
      saveReadIds(next);
      setReadIds(next);
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    }
  };

  const markAllAsRead = () => {
    const ids = notices.map((n) => n.id);
    saveReadIds(ids);
    setReadIds(ids);
    setUnreadCount(0);
  };

useEffect(() => {
  const fetchNotices = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get("http://localhost:8000/api/notices", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = res.data || [];
      setNotices(data);

      // Load per-user read state from localStorage and compute unread count
      const ids = getReadIds();
      setReadIds(ids);
      const unread = data.filter((n) => !ids.includes(n.id)).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Failed to fetch notices:", err);
    }
  };

  fetchNotices();
}, []);

  // Load site logo/name and react to changes from Configuration page
  useEffect(() => {
    const loadConfig = () => {
      const logo = localStorage.getItem('siteLogo');
      const sname = localStorage.getItem('siteName') || 'CTHMC';
      setSiteLogo(logo);
      setSiteName(sname);
    };

    loadConfig();
    window.addEventListener('siteConfigChanged', loadConfig);
    return () => window.removeEventListener('siteConfigChanged', loadConfig);
  }, []);

  // Prevent going back after logout
  useEffect(() => {
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = function () {
      window.history.go(1);
    };
  }, []);

  // Load current member profile (used to populate the EditProfilePopup)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return; // not logged in — other code handles redirect
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("http://localhost:8000/api/members/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!mounted) return;
        if (!res.ok) {
          // If unauthorized or failed, don't crash — optionally navigate to login
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("token");
            navigate("/login", { replace: true });
          }
          return;
        }
        const data = await res.json();
        if (mounted) setMember(data);
      } catch (err) {
        console.error("Failed to load profile in navbar:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    navigate("/login", { replace: true });
  };

  const handleViewClick = (type) => notify.success(`Viewing ${type} details...`);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ensure that when a modal notice opens we mark it read (safe-guard)
  useEffect(() => {
    if (selectedNotice) {
      markAsRead(selectedNotice.id);
    }
  }, [selectedNotice]);

  return (
    <>
      <header className="bg-gradient-to-r from-emerald-900 via-emerald-900 to-emerald-800 px-8 flex justify-between items-center fixed top-0 left-0 right-0 z-50 h-20 shadow-xl shadow-emerald-900/20 backdrop-blur-sm">
  
  {/* LEFT SIDE: LOGO + TITLE */}
  <div className="flex items-center gap-4">
    
    {/* 🟢 LOGO SLOT 🟢 */}
    <div className="w-13 h-13 ml-20 rounded-full bg-white shadow-lg border-emerald-100/20 flex items-center justify-center overflow-hidden shrink-0 relative">
      {siteLogo ? (
        <img src={siteLogo} alt={siteName || 'Logo'} className="w-full h-full object-cover" />
      ) : (
        <img src="https://via.placeholder.com/150" alt="Logo" className="w-full h-full object-cover" />
      )}
    </div>

    {/* TITLE */}
    <div className="flex flex-col">
      <h1 className="text-2xl font-black text-white tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-emerald-200 drop-shadow-sm leading-none">
        {siteName || 'CTHMC'}
      </h1>
    </div>
  </div>

  {/* RIGHT SIDE: ICONS */}
  <div className="flex items-center gap-4 relative">
    
    {/* 🔔 NOTIFICATION SECTION */}
    <div className="relative">
      <div className="relative group">
        <button 
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-white/10 active:scale-95 outline-none focus:ring-2 focus:ring-emerald-400/50"
          onClick={() => {
            setShowNotifPopup((prev) => !prev);
            setIsSettingsOpen(false);
          }}
        >
          <FaBell className="text-emerald-100 text-xl group-hover:text-white transition-colors" />
        </button>
        
        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-emerald-900"></span>
          </span>
        )}
      </div>

      {/* Notification Popup */}
      {showNotifPopup && (
        <div className="absolute right-0 mt-4 w-96 bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden z-40 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
          
          {/* HEADER */}
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-800 text-sm">Notifications</h3>
              {unreadCount > 0 && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount} New</span>}
            </div>
            <button 
              onClick={markAllAsRead} 
              className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 hover:underline transition-all"
            >
              Mark all read
            </button>
          </div>

          {/* LIST */}
          <div className="max-h-[380px] overflow-y-auto custom-scrollbar bg-white">
            {notices.length === 0 ? (
              <div className="py-12 px-6 text-center flex flex-col items-center justify-center gap-3">
                <div className="bg-gray-50 p-4 rounded-full text-gray-300">
                  <FaBell className="text-2xl" />
                </div>
                <p className="text-sm font-medium text-gray-400">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notices.map((notice) => (
                  <div
                    key={notice.id}
                    onClick={() => {
                      setSelectedNotice(notice);
                      setShowNotifPopup(false);
                      markAsRead(notice.id);
                    }}
                    className={`group p-4 transition-all cursor-pointer hover:bg-gray-50 relative flex gap-3 ${!readIds.includes(notice.id) ? 'bg-emerald-50/30' : ''}`}
                  >
                    {/* Status Indicator */}
                    <div className="mt-1.5">
                       <div className={`w-2 h-2 rounded-full ${readIds.includes(notice.id) ? "bg-gray-200" : "bg-emerald-500 shadow-sm shadow-emerald-200"}`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-0.5">
                        <h4 className={`text-sm font-semibold leading-snug ${readIds.includes(notice.id) ? "text-gray-600" : "text-gray-900"}`}>
                          {notice.title}
                        </h4>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2 mt-0.5">
                          {new Date(notice.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-1 pr-4">
                        Click to read full details...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 🟢 MODAL FOR SPECIFIC NOTIFICATION 🟢 */}
      {/* ========================================== */}
      {selectedNotice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          {/* Backdrop Overlay */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedNotice(null)}
          ></div>

          {/* Modal Content */}
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ring-white/20">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 p-8 flex justify-between items-start">
              <div className="pr-6">
                <span className="inline-block px-2 py-1 bg-white/10 text-emerald-100 text-[10px] font-bold rounded mb-3 backdrop-blur-md border border-white/10 uppercase tracking-wider">
                  Notification
                </span>
                <h3 className="text-white text-2xl font-bold tracking-tight leading-snug">
                  {selectedNotice.title}
                </h3>
                <p className="text-emerald-200/70 text-xs mt-2 font-medium flex items-center gap-1">
                  Received on {new Date(selectedNotice.createdAt).toLocaleString()}
                </p>
              </div>
              <button 
                onClick={() => setSelectedNotice(null)}
                className="text-white/50 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="prose prose-sm prose-emerald max-w-none">
                <p className="text-gray-600 leading-relaxed text-[15px] whitespace-pre-wrap">
                  {selectedNotice.message}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-5 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedNotice(null)}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all shadow-sm active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* ⚙️ SETTINGS SECTION */}
    <div className="relative" ref={settingsRef}>
      <button 
        className={`w-10 h-10 mr-15 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-white/10 active:scale-95 outline-none ${isSettingsOpen ? 'bg-white/10 rotate-90' : ''}`}
        onClick={() => {
          setIsSettingsOpen(!isSettingsOpen);
          setShowNotifPopup(false);
        }}
      >
        <FaCog className="text-emerald-100 text-xl" />
      </button>

      {isSettingsOpen && (
        <div className="absolute right-14 mt-4 w-56 bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
          <div className="p-1.5">
            <div
              onClick={() => {
                setIsEditProfileOpen(true);
                setIsSettingsOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl cursor-pointer transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all text-gray-400 group-hover:text-emerald-600">
                 <FaUserEdit />
              </div>
              <span>Edit Profile</span>
            </div>

            <div className="h-px bg-gray-50 mx-2 my-1"></div>

            <div
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl cursor-pointer transition-colors group"
            >
               <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all text-red-400 group-hover:text-red-500">
                 <FaSignOutAlt />
              </div>
              <span>Logout</span>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
</header>

      {/* Edit Profile Popup wired to current member */}
      <EditProfilePopup
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        member={member}
        onSave={(updatedMember) => {
          // update local member copy so the popup stays in sync next time
          setMember((prev) => ({ ...prev, ...updatedMember }));
          // close popup
          setIsEditProfileOpen(false);
        }}
      />
    </>
  );
}
