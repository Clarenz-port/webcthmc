import React, { useEffect, useState } from "react";
import notify from '../../utils/toast.js';
import { FaUser, FaPhone, FaEnvelope, FaBirthdayCake, FaEdit, FaCamera, FaTimes, FaLock, FaCheckCircle, FaMapMarkerAlt } from 'react-icons/fa';
import API from '../../apis/axios.js';

export default function EditProfilePopup({ isOpen, onClose, member, onSave }) {
  const [isEditing, setIsEditing] = useState({
    name: false,
    phone: false,
    email: false,
    birthdate: false,
    username: false,
    address: false,
  });

  const [profile, setProfile] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // PASSWORD PANEL
  const [showPasswordPanel, setShowPasswordPanel] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  const [saving, setSaving] = useState(false);


  // Helper to get initials
  const getInitials = (firstName, lastName) => {
    return `${(firstName?.[0] || '').toUpperCase()}${(lastName?.[0] || '').toUpperCase()}`;
  };

  // Defensive: handle member loading and show loading state
  useEffect(() => {
    if (!isOpen) return;

    if (!member) {
      setLoading(true);
      setProfile({});
      return;
    }
    setLoading(false);
    const id = member.id ?? member._id ?? null;
    setProfile({
      id,
      firstName: member.firstName ?? "",
      middleName: member.middleName ?? "",
      lastName: member.lastName ?? "",
      phoneNumber: member.phoneNumber ?? member.phone ?? "",
      email: member.email ?? "",
      birthdate: member.birthdate ?? "",
      username: member.username ?? "",
      address: member.address ?? "",
    });

    setPwError("");
    setPwSuccess("");
    setShowPasswordPanel(false);
    setOldPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setError("");

    window.history.pushState({ isModalOpen: true }, null, window.location.href);
  }, [isOpen, member]);

  // Handle browser back button to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleBackButton = () => onClose();
    window.addEventListener("popstate", handleBackButton);
    return () => window.removeEventListener("popstate", handleBackButton);
  }, [isOpen, onClose]);



  if (!isOpen) return null;

  // Show loading spinner if member is not loaded yet
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[400px] flex flex-col items-center justify-center p-10">
          <div className="w-8 h-8 border-4 border-[#7e9e6c]/30 border-t-[#7e9e6c] rounded-full animate-spin mb-4" />
          <span className="text-gray-700 font-semibold">Loading profile...</span>
        </div>
      </div>
    );
  }

  const handleChange = (e, field) =>
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));

  const handleEditToggle = (field) =>
    setIsEditing((prev) => ({ ...prev, [field]: !prev[field] }));



  // Core save handler: uploads avatar (if any) then updates profile (and password if requested)
  const handleSave = async () => {
    setError("");
    setPwError("");
    setPwSuccess("");
    if (!profile.firstName || !profile.lastName || !profile.username) {
      notify.error("First name, last name and username are required.");
      setError("First name, last name and username are required.");
      return;
    }
    if (profile.email && !profile.email.includes("@")) {
      notify.error("Email must contain an '@' symbol.");
      setError("Email must contain an '@' symbol.");
      return;
    }
    const id = profile.id;
    if (!id) {
      notify.error("Member id not available.");
      setError("Member id not available.");
      return;
    }
    setSaving(true);
    const token = (localStorage.getItem("token") || "").trim();
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const wantsPasswordChange =
        showPasswordPanel && (oldPassword || newPassword || confirmNewPassword);
      if (wantsPasswordChange) {
        if (!oldPassword || !newPassword || !confirmNewPassword) {
          setPwError("All password fields are required to change password.");
          setSaving(false);
          return;
        }
        if (newPassword !== confirmNewPassword) {
          setPwError("New password and confirm password do not match.");
          setSaving(false);
          return;
        }
        if (newPassword.length < 6) {
          setPwError("New password must be at least 6 characters.");
          setSaving(false);
          return;
        }
      }
      const payload = {
        firstName: profile.firstName,
        middleName: profile.middleName || null,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber || null,
        email: profile.email || null,
        birthdate: profile.birthdate
          ? profile.birthdate.includes("T")
            ? profile.birthdate.split("T")[0]
            : profile.birthdate
          : null,
        username: profile.username,
        address: profile.address || null,
        ...(wantsPasswordChange ? { oldPassword, password: newPassword } : {}),
      };

      const res = await API.put(`/api/members/${id}`, payload, {
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
      });
      const updated = res.data?.member ?? res.data ?? { id, ...payload };

      if (typeof onSave === "function") onSave(updated);
      notify.success("Profile saved successfully!");
      setProfile((prev) => ({ ...prev, ...updated }));
      setIsEditing({ name: false, phone: false, email: false, birthdate: false, username: false, address: false });
      setPwSuccess(wantsPasswordChange ? "Password changed + profile updated." : "");
      setPwError("");
      setError("");
      setShowPasswordPanel(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Failed to save changes. Check server logs.";
      setError(msg);
      notify.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[550px] max-h-[90vh] overflow-hidden relative animate-in fade-in zoom-in duration-300">
        {/* HEADER */}
        <div className="bg-[#f8faf8] border-b border-gray-100 px-8 py-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#2f5134]">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>
        {/* SCROLLABLE CONTENT */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-8">
          {/* PROFILE INITIALS AVATAR SECTION */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-32 h-32 rounded-full bg-[#e5e7eb] flex items-center justify-center text-4xl font-bold text-[#7e9e6c]">
              {getInitials(profile.firstName, profile.lastName)}
            </div>
          </div>
          {/* FORM FIELDS */}
          <div className="space-y-5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Personal Details</label>
            {/* NAME FIELD */}
            <div className="group bg-gray-50 rounded-xl p-4 border border-transparent focus-within:border-[#b8d8ba] focus-within:bg-white transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <FaUser className="text-[#7e9e6c]" />
                  {isEditing.name ? (
                    <div className="flex gap-2 w-full">
                      <input className="bg-white border border-gray-200 p-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-[#b8d8ba] outline-none"
                        placeholder="First"
                        value={profile.firstName}
                        onChange={(e) => handleChange(e, "firstName")}
                      />
                      <input className="bg-white border border-gray-200 p-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-[#b8d8ba] outline-none"
                        placeholder="Middle"
                        value={profile.middleName}
                        onChange={(e) => handleChange(e, "middleName")}
                      />
                      <input className="bg-white border border-gray-200 p-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-[#b8d8ba] outline-none"
                        placeholder="Last"
                        value={profile.lastName}
                        onChange={(e) => handleChange(e, "lastName")}
                      />
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Full Name</p>
                      <p className="text-gray-700 font-semibold">{profile.firstName} {profile.middleName} {profile.lastName}</p>
                    </div>
                  )}
                </div>
                <button onClick={() => handleEditToggle("name")} className="ml-4 p-2 text-gray-400 hover:text-[#7e9e6c] hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-gray-100">
                  <FaEdit />
                </button>
              </div>
            </div>
            {/* PHONE FIELD */}
            <div className="group bg-gray-50 rounded-xl p-4 border border-transparent focus-within:border-[#b8d8ba] focus-within:bg-white transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <FaPhone className="text-[#7e9e6c]" />
                  {isEditing.phone ? (
                    <input
                      className="bg-white border border-gray-200 p-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-[#b8d8ba] outline-none"
                      value={profile.phoneNumber}
                      onChange={(e) => {
                        // Only allow digits
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        if (val.length <= 11) {
                          handleChange({ target: { value: val } }, "phoneNumber");
                        }
                      }}
                      maxLength={11}
                      minLength={11}
                      pattern="\\d{11}"
                      title="Phone number must be exactly 11 digits"
                      required
                    />
                  ) : (
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Phone Number</p>
                      <p className="text-gray-700 font-semibold">{profile.phoneNumber || "Not provided"}</p>
                    </div>
                  )}
                </div>
                <button onClick={() => handleEditToggle("phone")} className="ml-4 p-2 text-gray-400 hover:text-[#7e9e6c] hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-gray-100">
                  <FaEdit />
                </button>
              </div>
            </div>
            {/* ADDRESS FIELD */}
            <div className="group bg-gray-50 rounded-xl p-4 border border-transparent focus-within:border-[#b8d8ba] focus-within:bg-white transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <FaMapMarkerAlt className="text-[#7e9e6c]" />
                  {isEditing.address ? (
                    <input
                      className="bg-white border border-gray-200 p-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-[#b8d8ba] outline-none"
                      value={profile.address}
                      onChange={(e) => handleChange(e, "address")}
                    />
                  ) : (
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Address</p>
                      <p className="text-gray-700 font-semibold">{profile.address || "Not provided"}</p>
                    </div>
                  )}
                </div>
                <button onClick={() => handleEditToggle("address")} className="ml-4 p-2 text-gray-400 hover:text-[#7e9e6c] hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-gray-100">
                  <FaEdit />
                </button>
              </div>
            </div>
            {/* EMAIL FIELD */}
            <div className="group bg-gray-50 rounded-xl p-4 border border-transparent focus-within:border-[#b8d8ba] focus-within:bg-white transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <FaEnvelope className="text-[#7e9e6c]" />
                  {isEditing.email ? (
                    <input
                      type="email"
                      className="bg-white border border-gray-200 p-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-[#b8d8ba] outline-none"
                      value={profile.email}
                      onChange={(e) => handleChange(e, "email")}
                      pattern="[^@\s]+@[^@\s]+"
                      title="Email must contain an @"
                      required
                    />
                  ) : (
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Email Address</p>
                      <p className="text-gray-700 font-semibold">{profile.email}</p>
                    </div>
                  )}
                </div>
                <button onClick={() => handleEditToggle("email")} className="ml-4 p-2 text-gray-400 hover:text-[#7e9e6c] hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-gray-100">
                  <FaEdit />
                </button>
              </div>
            </div>
            {/* BIRTHDATE FIELD */}
            <div className="group bg-gray-50 rounded-xl p-4 border border-transparent focus-within:border-[#b8d8ba] focus-within:bg-white transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <FaBirthdayCake className="text-[#7e9e6c]" />
                  {isEditing.birthdate ? (
                    <input
                      type="date"
                      className="bg-white border border-gray-200 p-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-[#b8d8ba] outline-none"
                      value={profile.birthdate ? profile.birthdate.split("T")[0] : ""}
                      onChange={(e) => handleChange(e, "birthdate")}
                      max={new Date().toISOString().split('T')[0]}
                      onKeyDown={e => {
                        // Allow Tab, Arrow keys, Home, End, Delete, Backspace
                        const allowed = [
                          'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                          'Home', 'End', 'Delete', 'Backspace'
                        ];
                        if (!allowed.includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                  ) : (
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Birthdate</p>
                      <p className="text-gray-700 font-semibold">
                        {profile.birthdate ? new Date(profile.birthdate).toLocaleDateString() : "Set your birthday"}
                      </p>
                    </div>
                  )}
                </div>
                <button onClick={() => handleEditToggle("birthdate")} className="ml-4 p-2 text-gray-400 hover:text-[#7e9e6c] hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-gray-100">
                  <FaEdit />
                </button>
              </div>
            </div>
            {/* ACCOUNT SECTION */}
            <div className="pt-6">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Account Settings</label>
              <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-transparent focus-within:border-[#b8d8ba] focus-within:bg-white transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <FaUser className="text-[#7e9e6c]" />
                    {isEditing.username ? (
                      <input
                        className="bg-white border border-gray-200 p-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-[#b8d8ba] outline-none"
                        value={profile.username}
                        onChange={(e) => handleChange(e, "username")}
                        minLength={7}
                        title="Username must be at least 7 characters"
                      />
                    ) : (
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Username</p>
                        <p className="text-gray-700 font-semibold">@{profile.username}</p>
                      </div>
                    )}
                  </div>
                  <button onClick={() => handleEditToggle("username")} className="ml-4 p-2 text-gray-400 hover:text-[#7e9e6c] hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-gray-100">
                    <FaEdit />
                  </button>
                </div>
              </div>
              <button
                className="w-full mt-4 flex items-center justify-center gap-2 text-[#7e9e6c] bg-[#7e9e6c]/10 py-3 rounded-xl font-bold hover:bg-[#7e9e6c] hover:text-white transition-all"
                onClick={() => {
                  setShowPasswordPanel((s) => !s);
                  setPwError("");
                  setPwSuccess("");
                }}
              >
                <FaLock size={14} />
                {showPasswordPanel ? "Hide Password Settings" : "Change Password"}
              </button>
            </div>
            {/* PASSWORD PANEL */}
            {showPasswordPanel && (
              <div className="mt-4 p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-3 animate-in slide-in-from-top-2">
                <input
                  type={showPasswords ? "text" : "password"}
                  placeholder="Old Password"
                  className="bg-white border border-gray-200 w-full p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#b8d8ba]"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
                <input
                  type={showPasswords ? "text" : "password"}
                  placeholder="New Password"
                  className="bg-white border border-gray-200 w-full p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#b8d8ba]"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={7}
                  maxLength={14}
                  title="Password must be 7-14 characters"
                />
                <input
                  type={showPasswords ? "text" : "password"}
                  placeholder="Confirm New Password"
                  className="bg-white border border-gray-200 w-full p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#b8d8ba]"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  minLength={7}
                  maxLength={14}
                  title="Password must be 7-14 characters"
                />
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded text-[#7e9e6c] focus:ring-[#7e9e6c]"
                    checked={showPasswords}
                    onChange={() => setShowPasswords(!showPasswords)}
                  />
                  Show Passwords
                </label>
                {pwError && <p className="text-red-500 text-xs font-medium bg-red-50 p-2 rounded-lg">{pwError}</p>}
                {pwSuccess && <p className="text-green-600 text-xs font-medium bg-green-50 p-2 rounded-lg">{pwSuccess}</p>}
              </div>
            )}
          </div>
          {/* ERROR MESSAGE */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-red-500 text-sm text-center font-medium">{error}</p>
            </div>
          )}
          {/* FOOTER ACTION */}
          <div className="mt-10 pb-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#7e9e6c] disabled:opacity-60 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-[#7e9e6c]/30 hover:bg-[#6a8e5a] hover:translate-y-[-2px] active:translate-y-[0px] transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving Changes...
                </span>
              ) : (
                <>
                  <FaCheckCircle />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}