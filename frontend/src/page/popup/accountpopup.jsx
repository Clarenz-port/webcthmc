import React, { useState, useEffect } from "react";
import { notify } from "../../utils/toast";
import { 
  FiArrowLeft, FiPlus, FiEdit2, FiTrash2, FiShield, 
  FiUser, FiPhone, FiLock, FiEye, FiEyeOff, FiX 
} from "react-icons/fi";
import axios from "axios";

export default function AccountOnlyPopup({ onClose = () => {}, inline = false }) {
  const [admins, setAdmins] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);

  const [newAdmin, setNewAdmin] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    username: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = localStorage.getItem("token");

  // Fetch existing admins on mount
  useEffect(() => {
    axios
      .get("http://localhost:8000/api/admin/list", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setAdmins(res.data))
      .catch((err) => console.error(err));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { firstName, middleName, lastName, username, phoneNumber, password, confirmPassword } = newAdmin;

    if (!firstName || !middleName || !lastName || !username || !phoneNumber || (!editingId && !password)) {
      notify.success("⚠️ All fields are required (password required only when creating)");
      return;
    }

    if (!editingId) {
      if (!password || !confirmPassword) {
        notify.success("⚠️ Please provide password and confirm password.");
        return;
      }
      if (password !== confirmPassword) {
        notify.success("⚠️ Passwords do not match.");
        return;
      }
    } else {
      if (password) {
        if (!confirmPassword) {
          notify.success("⚠️ Please confirm the new password.");
          return;
        }
        if (password !== confirmPassword) {
          notify.success("⚠️ Passwords do not match.");
          return;
        }
      }
    }

    try {
      if (editingId) {
        const body = { ...newAdmin };
        delete body.confirmPassword;
        const res = await axios.put(
          `http://localhost:8000/api/admin/${editingId}`,
          body,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setAdmins((prev) =>
          prev.map((a) =>
            (a.id === editingId || a._id === editingId || a.username === editingId)
              ? (res.data?.admin ?? { ...a, ...newAdmin })
              : a
          )
        );
        notify.success(res.data?.message || "Admin updated");
      } else {
        const body = { ...newAdmin };
        delete body.confirmPassword;
        const res = await axios.post("http://localhost:8000/api/admin/add", body, {
          headers: { Authorization: `Bearer ${token}` },
        });

        notify.success(res.data?.message || "Admin added");
        if (res.data?.admin) setAdmins((prev) => [...prev, res.data.admin]);
      }

      setShowAddForm(false);
      setEditingId(null);
      setNewAdmin({
        firstName: "",
        middleName: "",
        lastName: "",
        username: "",
        phoneNumber: "",
        password: "",
        confirmPassword: "",
      });
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      notify.success(err.response?.data?.message || "Error saving admin");
    }
  };

  const handleEditClick = (admin) => {
    setEditingId(admin.id ?? admin._id ?? admin.username);
    setNewAdmin({
      firstName: admin.firstName || "",
      middleName: admin.middleName || "",
      lastName: admin.lastName || "",
      username: admin.username || "",
      phoneNumber: admin.phoneNumber || "",
      password: "",
      confirmPassword: "",
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowAddForm(true);
  };

  const openDeleteConfirm = (admin) => {
    setAdminToDelete(admin);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAdmin = async () => {
    if (!adminToDelete) return;

    const id = adminToDelete.id ?? adminToDelete._id ?? adminToDelete.username;

    try {
      const res = await axios.delete(`http://localhost:8000/api/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAdmins((prev) => prev.filter((a) => (a.id ?? a._id ?? a.username) !== id));
      setShowDeleteConfirm(false);
      setAdminToDelete(null);
    } catch (err) {
      notify.success(err.response?.data?.message || "Error deleting admin");
    }
  };

  // Inline rendering (no overlay, no fixed container)
  return (
    <>
  <div className="flex flex-col h-full relative">
    {/* 1. HEADER & ACTION BUTTON */}
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-4">
        <button
          onClick={onClose}
          title="Back"
          className="p-3 bg-white border border-gray-100 text-gray-500 hover:text-[#7e9e6c] hover:border-[#7e9e6c] rounded-xl transition-all shadow-sm active:scale-95 group"
        >
          <FiArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <h3 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            Super Admin
          </h3>
        </div>
      </div>

      {!showAddForm && (
        <button
          onClick={() => {
            setEditingId(null);
            setNewAdmin({
              firstName: "", lastName: "", username: "", phoneNumber: "",
              password: "", confirmPassword: "",
            });
            setShowPassword(false);
            setShowConfirmPassword(false);
            setShowAddForm(true);
          }}
          className="bg-[#7e9e6c] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-[#6a8b5a] font-bold text-sm shadow-lg shadow-green-100 transition-all active:scale-95"
        >
          <FiPlus size={18} /> New Admin
        </button>
      )}
    </div>

    {/* 2. ADMINS TABLE */}
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="px-6 py-4 text-left font-black text-gray-400 uppercase tracking-widest text-[10px]">Full Name</th>
              <th className="px-6 py-4 text-left font-black text-gray-400 uppercase tracking-widest text-[10px]">Username</th>
              <th className="px-6 py-4 text-left font-black text-gray-400 uppercase tracking-widest text-[10px]">Contact Info</th>
              <th className="px-6 py-4 text-center font-black text-gray-400 uppercase tracking-widest text-[10px]">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {admins.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                  No administrative accounts found in the system.
                </td>
              </tr>
            ) : (
              admins.map((a) => {
                const id = a.id ?? a._id ?? a.username;
                return (
                  <tr key={id} className="hover:bg-[#d6ead8]/10 transition-colors group">
                    <td className="px-6 py-4 font-bold text-gray-700 capitalize">
                      {a.firstName} <span className="text-[10px] text-gray-300 mx-1">•</span> {a.lastName}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg font-mono text-xs">
                        @{a.username}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium">
                      {a.phoneNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(a)}
                          className="p-2 rounded-xl text-gray-500 hover:text-[#7e9e6c] hover:bg-[#d6ead8]/30 transition-all"
                          title="Edit"
                        >
                          <FiEdit2 size={18} />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(a)}
                          className="p-2 rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all"
                          title="Delete"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  {/* 3. NEW DESIGN POPUP MODAL */}
  {showAddForm && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 transition-all">
      {/* Modal Card */}
      <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header Section */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-4">
             {/* Icon Badge */}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${editingId ? 'bg-amber-100 text-amber-600' : 'bg-[#d6ead8] text-[#7e9e6c]'}`}>
               {editingId ? <FiEdit2 size={22} /> : <FiUser size={22} />}
            </div>
            <div>
              <h4 className="font-bold text-xl text-gray-800 tracking-tight">
                {editingId ? "Edit Profile" : "New Administrator"}
              </h4>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                 {editingId ? "Update access permissions details" : "Create a new system access account"}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => { setShowAddForm(false); setEditingId(null); }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-8 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Section: Personal Info */}
            <div className="space-y-4">
              <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest">Personal Information</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 mb-2 ml-1">First Name</label>
                  <div className="relative">
                    <FiUser className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-[#7e9e6c] transition-colors" />
                    <input
                      type="text"
                      className="w-full bg-gray-50 border border-gray-200 p-3 pl-10 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#7e9e6c]/20 focus:border-[#7e9e6c] outline-none transition-all text-sm font-medium"
                      value={newAdmin.firstName}
                      onChange={(e) => setNewAdmin({ ...newAdmin, firstName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 mb-2 ml-1">Middle Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#7e9e6c]/20 focus:border-[#7e9e6c] outline-none transition-all text-sm font-medium"
                      value={newAdmin.middleName}
                      onChange={(e) => setNewAdmin({ ...newAdmin, middleName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 mb-2 ml-1">Last Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#7e9e6c]/20 focus:border-[#7e9e6c] outline-none transition-all text-sm font-medium"
                      value={newAdmin.lastName}
                      onChange={(e) => setNewAdmin({ ...newAdmin, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-100"></div>

            {/* Section: Account & Security */}
            <div className="space-y-4">
              <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest">Account Security</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 mb-2 ml-1">Phone Number</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-[#7e9e6c] transition-colors" />
                    <input
                      type="text"
                      className="w-full bg-gray-50 border border-gray-200 p-3 pl-10 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#7e9e6c]/20 focus:border-[#7e9e6c] outline-none transition-all text-sm font-medium"
                      value={newAdmin.phoneNumber}
                      onChange={(e) => setNewAdmin({ ...newAdmin, phoneNumber: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 mb-2 ml-1">Username</label>
                  <div className="relative">
                    <FiUser className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-[#7e9e6c] transition-colors" />
                    <input
                      type="text"
                      className="w-full bg-gray-50 border border-gray-200 p-3 pl-10 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#7e9e6c]/20 focus:border-[#7e9e6c] outline-none transition-all text-sm font-bold text-gray-700"
                      value={newAdmin.username}
                      onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 mb-2 ml-1">
                     {editingId ? "New Password (Optional)" : "Password"}
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-[#7e9e6c] transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full bg-gray-50 border border-gray-200 p-3 pl-10 pr-12 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#7e9e6c]/20 focus:border-[#7e9e6c] outline-none transition-all text-sm font-medium"
                      value={newAdmin.password}
                      onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-[#7e9e6c]"
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-xs font-semibold text-gray-500 mb-2 ml-1">Confirm Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-3.5 text-gray-400 group-focus-within:text-[#7e9e6c] transition-colors" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="w-full bg-gray-50 border border-gray-200 p-3 pl-10 pr-12 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#7e9e6c]/20 focus:border-[#7e9e6c] outline-none transition-all text-sm font-medium"
                      value={newAdmin.confirmPassword}
                      onChange={(e) => setNewAdmin({ ...newAdmin, confirmPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((s) => !s)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-[#7e9e6c]"
                    >
                      {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
               <button
                type="button"
                className="py-3 px-6 rounded-xl border border-gray-200 text-gray-500 font-bold hover:bg-gray-50 hover:text-gray-700 transition-all text-sm"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#7e9e6c] text-white py-3 px-8 rounded-xl font-bold hover:bg-[#6a8b5a] hover:shadow-lg hover:shadow-green-100 transition-all active:scale-95 text-sm"
              >
                {editingId ? "Save Changes" : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )}

  {/* 4. DELETE CONFIRMATION MODAL */}
  {showDeleteConfirm && (
    <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-[1000] p-4 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-sm text-center border border-gray-100 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500"></div>
        
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiTrash2 size={36} />
        </div>

        <h2 className="text-2xl font-black text-gray-800 mb-2">Confirm Removal</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Are you sure you want to permanently delete the administrator account for <br />
          <span className="font-black text-red-500 uppercase tracking-tighter">
            {adminToDelete?.firstName} {adminToDelete?.lastName}
          </span>?
        </p>

        <div className="flex flex-col gap-3">
          <button
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3.5 rounded-2xl font-black shadow-lg shadow-red-100 transition-all active:scale-95"
            onClick={confirmDeleteAdmin}
          >
            Delete Account
          </button>
          <button
            className="w-full bg-gray-50 hover:bg-gray-100 text-gray-400 py-3.5 rounded-2xl font-bold transition-all"
            onClick={() => setShowDeleteConfirm(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )}
</>
  );
}
