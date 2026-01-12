
import axios from "axios";
import { notify } from "../utils/toast";
import React, { useState, useRef, useEffect } from "react";
import { FaBell, FaCog } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import EditProfilePopup from "../page/popup/editprofile.jsx";

export default function MemberNavbar() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showNotifPopup, setShowNotifPopup] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [member, setMember] = useState(null); // fetched current member
  const settingsRef = useRef();
  const navigate = useNavigate();
const [notices, setNotices] = useState([]);
const [unreadCount, setUnreadCount] = useState(0);

useEffect(() => {
  const fetchNotices = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get("http://localhost:8000/api/notices", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotices(res.data);
      setUnreadCount(res.data.length);
    } catch (err) {
      console.error("Failed to fetch notices:", err);
    }
  };

  fetchNotices();
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

  return (
    <>
      <header className="bg-emerald-800 p-9 flex justify-between items-center fixed top-0 left-0 right-0 z-50 h-22">
        <h1 className="text-3xl font-bold text-white">Profile</h1>

       <div className="flex items-center space-x-6 relative">
  <div className="relative">
    <FaBell
      className="text-white text-3xl cursor-pointer"
      onClick={() => {
        setShowNotifPopup((prev) => !prev);
        setIsSettingsOpen(false);
        setUnreadCount(0);
      }}
    />

    {unreadCount > 0 && (
      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
        {unreadCount}
      </span>
    )}

    {/* 🔔 Notification Popup */}
    {showNotifPopup && (
      <div className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-xl border z-50">
        <div className="px-4 py-3 border-b font-semibold text-gray-700">
          Notices
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notices.length === 0 ? (
            <p className="p-4 text-gray-500 text-sm">No notices yet.</p>
          ) : (
            notices.map((notice) => (
              <div
                key={notice.id}
                className="p-4 border-b hover:bg-gray-50"
              >
                <h4 className="font-bold text-emerald-700">
                  {notice.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {notice.message}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(notice.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    )}
  </div>


          <div className="relative" ref={settingsRef}>
            <FaCog
              className="text-white text-3xl cursor-pointer"
              onClick={() => {
                setIsSettingsOpen(!isSettingsOpen);
                setShowNotifPopup(false);
              }}
            />

            {isSettingsOpen && (
              <div className="absolute -right-2 mt-3 w-54 bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="absolute -top-2 right-3">
                  <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-white"></div>
                </div>

                <p
                  onClick={() => {
                    // ensure we have latest member before opening popup
                    setIsEditProfileOpen(true);
                    setIsSettingsOpen(false);
                  }}
                  className="block w-full font-semibold text-lg px-8 py-4 text-gray-700 hover:rounded-t-lg hover:bg-gray-100 cursor-pointer"
                >
                  Edit Profile
                </p>

                <p
                  onClick={handleLogout}
                  className="block w-full font-semibold text-lg px-8 py-4 text-gray-700 hover:rounded-b-lg hover:bg-gray-100 cursor-pointer"
                >
                  Logout
                </p>
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
