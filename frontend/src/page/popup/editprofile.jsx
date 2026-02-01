import React, { useEffect, useState, useRef } from "react";
import { FaUser, FaPhone, FaEnvelope, FaBirthdayCake, FaEdit, FaCamera, FaTimes, FaLock, FaCheckCircle } from 'react-icons/fa';
import axios from "axios";

/**
 * EditProfilePopup (with Remove Picture)
 *
 * - Adds "Remove Picture" button that deletes avatar on server (DELETE) or clears avatarUrl via PUT fallback.
 * - Uses inline SVG placeholder to avoid external network dependency.
 *
 * Adjust API base / endpoints if your backend differs.
 */
export default function EditProfilePopup({ isOpen, onClose, member, onSave }) {
  const [isEditing, setIsEditing] = useState({
    name: false,
    phone: false,
    email: false,
    birthdate: false,
    username: false,
  });

  const [profile, setProfile] = useState({});
  const [error, setError] = useState("");

  // PASSWORD PANEL
  const [showPasswordPanel, setShowPasswordPanel] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  const [saving, setSaving] = useState(false);

  // IMAGE UPLOAD
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'>
    <rect fill='%23e5e7eb' width='100%' height='100%' rx='16' ry='16'/>
    <text x='50%' y='50%' font-size='18' text-anchor='middle' fill='%237e9e6c' dy='.35em'>Avatar</text>
  </svg>`;
  const DEFAULT_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  const [imagePreviewUrl, setImagePreviewUrl] = useState(DEFAULT_PLACEHOLDER); // preview (object URL or remote URL)
  const [imageFile, setImageFile] = useState(null); // selected File instance
  const fileInputRef = useRef(null);

  // Initialize local state when modal opens or when member prop changes
  useEffect(() => {
    if (isOpen && member) {
      const id = member.id ?? member._id ?? null;
      const avatar = member.avatarUrl ?? member.avatar ?? null;
      const preview = avatar
        ? (avatar.startsWith("http") ? avatar : `http://localhost:8000${avatar}`)
        : DEFAULT_PLACEHOLDER;

      setProfile({
        id,
        firstName: member.firstName ?? "",
        middleName: member.middleName ?? "",
        lastName: member.lastName ?? "",
        phoneNumber: member.phoneNumber ?? member.phone ?? "",
        email: member.email ?? "",
        birthdate: member.birthdate ?? "",
        username: member.username ?? "",
        avatarUrl: avatar ?? null,
      });

      setImagePreviewUrl(preview);
      setImageFile(null);

      // reset password / errors
      setPwError("");
      setPwSuccess("");
      setShowPasswordPanel(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setError("");
    }
  }, [isOpen, member]);

  // Cleanup object URL on unmount/when preview changes
  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(imagePreviewUrl);
        } catch (e) {
          // ignore
        }
      }
    };
  }, [imagePreviewUrl]);

  if (!isOpen) return null;

  const handleChange = (e, field) =>
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));

  const handleEditToggle = (field) =>
    setIsEditing((prev) => ({ ...prev, [field]: !prev[field] }));

  // Image selection handler
  const handleImageSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // validation
    if (!f.type.startsWith("image/")) {
      setError("Selected file must be an image.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }
    setError("");

    // revoke previous object URL if it was one
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(imagePreviewUrl);
      } catch (e) {}
    }

    const url = URL.createObjectURL(f);
    setImageFile(f);
    setImagePreviewUrl(url);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Remove picture handler
  const handleRemovePicture = async () => {
    // quick confirmation
    if (!confirm("Remove profile picture? This will delete the avatar from your account.")) return;

    setError("");
    setSaving(true);
    const id = profile.id;
    if (!id) {
      setError("Member id not available.");
      setSaving(false);
      return;
    }
    const token = (localStorage.getItem("token") || "").trim();
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      // Try DELETE endpoint first (preferred)
      try {
        const delRes = await axios.delete(`http://localhost:8000/api/members/${id}/avatar`, {
          headers: { ...authHeader },
        });
        // server should return updated member or avatarUrl
        const updatedMember = delRes.data?.member ?? delRes.data ?? null;
        // Update UI
        setProfile((prev) => ({ ...prev, avatarUrl: null }));
        setImageFile(null);
        setImagePreviewUrl(DEFAULT_PLACEHOLDER);
        if (typeof onSave === "function") onSave(updatedMember ?? { ...profile, avatarUrl: null });
        setError("");
        setPwError("");
        setPwSuccess("");
        setSaving(false);
        return;
      } catch (errDel) {
        // If DELETE 404s or not implemented, fallback to PUT clearing avatarUrl
        console.warn("DELETE avatar endpoint failed, falling back to PUT to clear avatarUrl.", errDel?.response?.status);
      }

      // Fallback: clear avatarUrl via JSON PUT
      try {
        const payload = { avatarUrl: null };
        const putRes = await axios.put(`http://localhost:8000/api/members/${id}`, payload, {
          headers: { "Content-Type": "application/json", ...authHeader },
        });
        const updated = putRes.data?.member ?? putRes.data ?? { ...profile, avatarUrl: null };

        setProfile((prev) => ({ ...prev, avatarUrl: null }));
        setImageFile(null);
        setImagePreviewUrl(DEFAULT_PLACEHOLDER);
        if (typeof onSave === "function") onSave(updated);
      } catch (errPut) {
        console.error("Fallback PUT to clear avatarUrl failed:", errPut);
        const serverMsg =
          errPut.response?.data?.message ||
          errPut.response?.data?.error ||
          (errPut.response?.data ? JSON.stringify(errPut.response.data) : null);
        setError(serverMsg || "Failed to remove avatar on server.");
      }
    } catch (err) {
      console.error("Unexpected error removing avatar:", err);
      setError("Failed to remove avatar. Check console.");
    } finally {
      setSaving(false);
    }
  };

  // Core save handler: uploads avatar (if any) then updates profile (and password if requested)
  const handleSave = async () => {
    setError("");
    setPwError("");
    setPwSuccess("");

    if (!profile.firstName || !profile.lastName || !profile.username) {
      setError("First name, last name and username are required.");
      return;
    }

    const id = profile.id;
    if (!id) {
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

      // Prepare JSON payload (used when not sending multipart file)
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
        ...(wantsPasswordChange ? { oldPassword, password: newPassword } : {}),
      };

      console.info("Updating member payload:", payload);

      // Step 1: If image file selected, try dedicated avatar upload endpoint first
      let uploadedAvatarUrl = null;
      if (imageFile) {
        try {
          const form = new FormData();
          form.append("avatar", imageFile);
          // Optional: include id or other fields if your endpoint needs it
          const avatarRes = await axios.post(
            `http://localhost:8000/api/members/${id}/avatar`,
            form,
            {
              headers: {
                "Content-Type": "multipart/form-data",
                ...authHeader,
              },
            }
          );
          uploadedAvatarUrl = avatarRes.data?.avatarUrl ?? avatarRes.data?.url ?? null;
          console.info("Avatar upload response:", avatarRes.data);
        } catch (errAvatar) {
          console.warn("Avatar endpoint failed, will try multipart PUT fallback.", errAvatar?.response?.status);
          // Fallback: try multipart PUT to the main member endpoint (include fields + file)
          try {
            const form = new FormData();
            Object.entries(payload).forEach(([k, v]) => {
              if (v !== null && v !== undefined) form.append(k, v);
            });
            form.append("avatar", imageFile);
            const putRes = await axios.put(
              `http://localhost:8000/api/members/${id}`,
              form,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                  ...authHeader,
                },
              }
            );
            // If this PUT succeeded and returns member or avatar url:
            uploadedAvatarUrl = putRes.data?.member?.avatarUrl ?? putRes.data?.avatarUrl ?? null;
            const updatedMember = putRes.data?.member ?? putRes.data ?? { id, ...payload, avatarUrl: uploadedAvatarUrl };

            // Update UI and inform parent
            const fullAvatar = uploadedAvatarUrl && !uploadedAvatarUrl.startsWith("http")
              ? (uploadedAvatarUrl.startsWith("/") ? `http://localhost:8000${uploadedAvatarUrl}` : `http://localhost:8000/${uploadedAvatarUrl}`)
              : uploadedAvatarUrl;

            if (fullAvatar) {
              setProfile((prev) => ({ ...prev, avatarUrl: fullAvatar }));
              setImagePreviewUrl(fullAvatar);
            }

            if (typeof onSave === "function") onSave(updatedMember);

            setIsEditing({ name: false, phone: false, email: false, birthdate: false, username: false });
            setPwSuccess(wantsPasswordChange ? "Password changed + profile updated." : "");
            setPwError("");
            setError("");
            setShowPasswordPanel(false);
            setOldPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
            setImageFile(null);
            setSaving(false);
            return; // done, fallback PUT already updated server/state
          } catch (errPutFallback) {
            console.warn("Multipart PUT fallback failed:", errPutFallback);
            // continue to try JSON PUT (without file) so at least profile updates
          }
        }
      }

      // If uploadedAvatarUrl present, attach to payload so JSON PUT will set it server-side
      if (uploadedAvatarUrl) {
        payload.avatarUrl = uploadedAvatarUrl;
      }

      // Final: send JSON PUT to update profile (without file)
      const res = await axios.put(`http://localhost:8000/api/members/${id}`, payload, {
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
      });

      console.info("Update response:", res.data);

      // derive updated member and avatar url
      const updated = res.data?.member ?? res.data ?? { id, ...payload };
      let returnedAvatar = updated.avatarUrl ?? updated.avatar ?? payload.avatarUrl ?? null;

      // If server gave a relative path, make it absolute (adjust base URL if needed)
      if (returnedAvatar && !returnedAvatar.startsWith("http")) {
        // adjust base url if your server uses a different host in production
        returnedAvatar = returnedAvatar.startsWith("/")
          ? `http://localhost:8000${returnedAvatar}`
          : `http://localhost:8000/${returnedAvatar}`;
      }

      if (returnedAvatar) {
        updated.avatarUrl = returnedAvatar;
        setProfile((prev) => ({ ...prev, avatarUrl: returnedAvatar }));
        setImagePreviewUrl(returnedAvatar);
      }

      if (typeof onSave === "function") onSave(updated);

      setProfile((prev) => ({ ...prev, ...updated }));
      setIsEditing({ name: false, phone: false, email: false, birthdate: false, username: false });
      setPwSuccess(wantsPasswordChange ? "Password changed + profile updated." : "");
      setPwError("");
      setError("");
      setShowPasswordPanel(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setImageFile(null);
    } catch (err) {
      console.error("Save failed (full error):", err);
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.response?.data ? JSON.stringify(err.response.data) : null);
      setError(serverMsg || err.message || "Failed to save changes. Check server logs.");
    } finally {
      setSaving(false);
    }
  };

  return (
  <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50 p-4">
  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[550px] max-h-[90vh] overflow-hidden relative animate-in fade-in zoom-in duration-300">
    
    {/* HEADER */}
    <div className="bg-[#f8faf8] border-b border-gray-100 px-8 py-6 flex justify-between items-center">
      <h2 className="text-2xl font-bold text-gray-800">Edit Profile</h2>
      <button
        onClick={onClose}
        className="p-2 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <FaTimes size={20} />
      </button>
    </div>

    {/* SCROLLABLE CONTENT */}
    <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-8">
      
      {/* PROFILE PICTURE SECTION */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative group cursor-pointer" onClick={openFileDialog}>
          <img
            src={imagePreviewUrl}
            className="w-32 h-32 rounded-[100px] border-4 border-white shadow-lg object-cover transition-transform group-hover:scale-[1.02]"
            alt="Profile"
          />
          <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <FaCamera className="text-white text-2xl" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-[#7e9e6c] p-2 rounded-lg shadow-md text-white">
            <FaEdit size={14} />
          </div>
        </div>
        
        <div className="mt-4 flex gap-4">
          <button
            type="button"
            onClick={openFileDialog}
            className="text-sm font-medium text-[#7e9e6c] hover:text-[#6a8e5a]"
          >
            Update Photo
          </button>

          {(profile.avatarUrl || imageFile) && (
            <button
              type="button"
              onClick={handleRemovePicture}
              disabled={saving}
              className="text-sm font-medium text-red-500 hover:text-red-600 disabled:opacity-50"
            >
              {saving ? "Removing..." : "Remove"}
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />
        <p className="text-[11px] text-gray-400 mt-2 uppercase tracking-wider font-semibold">Max 5MB • JPG or PNG</p>
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
                  onChange={(e) => handleChange(e, "phoneNumber")}
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

        {/* ⭐⭐⭐ ACCOUNT SECTION ⭐⭐⭐ */}
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
            />
            <input
              type={showPasswords ? "text" : "password"}
              placeholder="Confirm New Password"
              className="bg-white border border-gray-200 w-full p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#b8d8ba]"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
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
