import React, { useState, useEffect } from "react";
import { notify } from "../../utils/toast";
import { FaPlus, FaEdit, FaTrash, FaArrowLeft } from "react-icons/fa";
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
    <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 max-h-[60vh] overflow-y-auto relative">
      {/* Back button top-left */}
      <button
        onClick={onClose}
        className="absolute left-3 top-3 text-2xl text-[#5a7350] hover:text-[#7e9e6c] rounded p-1"
        title="Back"
        aria-label="Back"
      >
        <FaArrowLeft />
      </button>

      {/* Centered title */}
      <div className="mb-4 flex justify-center">
        <h3 className="text-4xl mt-4 text-[#5a7350] font-bold">Super Admin</h3>
      </div>

      <div className="mb-3 border-t border-gray-300 pt-4">
        {!showAddForm && (
          <button
            className="bg-[#7e9e6c] text-white px-3 py-1 rounded flex items-center gap-2 hover:bg-green-600 font-semibold"
            onClick={() => {
              setEditingId(null);
              setNewAdmin({
                firstName: "",
                lastName: "",
                username: "",
                phoneNumber: "",
                password: "",
                confirmPassword: "",
              });
              setShowPassword(false);
              setShowConfirmPassword(false);
              setShowAddForm(true);
            }}
          >
            <FaPlus /> New Admin
          </button>
        )}
      </div>

      {showAddForm && (
        <form className="mb-4" onSubmit={handleSubmit}>
          <h4 className="font-semibold mb-2">{editingId ? "Edit Admin" : "Add Admin"}</h4>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="text"
              placeholder="First Name"
              className="border p-2 rounded"
              value={newAdmin.firstName}
              onChange={(e) => setNewAdmin({ ...newAdmin, firstName: e.target.value })}
              required
            />

            <input
              type="text"
              placeholder="Middle Name"
              className="border p-2 rounded"
              value={newAdmin.middleName}
              onChange={(e) => setNewAdmin({ ...newAdmin, middleName: e.target.value })}
            />

            <input
              type="text"
              placeholder="Last Name"
              className="border p-2 rounded"
              value={newAdmin.lastName}
              onChange={(e) => setNewAdmin({ ...newAdmin, lastName: e.target.value })}
              required
            />

            <input
              type="text"
              placeholder="Phone Number"
              className="border p-2 rounded"
              value={newAdmin.phoneNumber}
              onChange={(e) => setNewAdmin({ ...newAdmin, phoneNumber: e.target.value })}
              required
            />

            <input
              type="text"
              placeholder="Username"
              className="border p-2 rounded"
              value={newAdmin.username}
              onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
              required
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={editingId ? "Leave blank to keep current password" : "Password"}
                className="border p-2 rounded w-full pr-20"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-2 text-sm text-[#3d5a3a] bg-transparent"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder={editingId ? "Confirm new password" : "Confirm Password"}
                className="border p-2 rounded w-full pr-20"
                value={newAdmin.confirmPassword}
                onChange={(e) => setNewAdmin({ ...newAdmin, confirmPassword: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((s) => !s)}
                className="absolute right-2 top-2 text-sm text-[#3d5a3a] bg-transparent"
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="flex gap-2 ">
            <button
              type="submit"
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
            >
              {editingId ? "Update Admin" : "Add Admin"}
            </button>

            <button
              type="button"
              className="py-2 px-4 rounded border"
              onClick={() => {
                setShowAddForm(false);
                setEditingId(null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div>
        <table className="w-full shadow-lg rounded-lg border border-gray-300 rounded-lg overflow-hidden">
        <thead className="bg-[#7e9e6c] text-white">
          <tr >
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Username</th>
            <th className="px-4 py-3 text-left">Phone</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>

        <tbody>
          {admins.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-2 py-4 text-center text-gray-500">
                No admins found.
              </td>
            </tr>
          ) : (
            admins.map((a) => {
              const id = a.id ?? a._id ?? a.username;

              return (
                <tr key={id} className="border-t border-gray-200">
                  <td className="px-4 py-3">
                    {a.firstName} {a.middleName} {a.lastName}
                  </td>
                  <td className="px-4 py-3 border-t border-gray-200">{a.username}</td>
                  <td className="px-4 py-3 border-t border-gray-200">{a.phoneNumber}</td>
                  <td className="px-4 py-3 border-t border-gray-200">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEditClick(a)}
                        title="Edit"
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        <FaEdit />
                      </button>

                      <button
                        onClick={() => openDeleteConfirm(a)}
                        title="Delete"
                        className="p-1 rounded hover:bg-gray-100 text-red-600"
                      >
                        <FaTrash />
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

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999]">
          <div className="bg-white p-6 rounded-lg shadow-xl w-[350px] text-center border-2 border-red-400">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Confirm Delete</h2>

            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <br />
              <span className="font-semibold text-red-500">
                {adminToDelete?.firstName} {adminToDelete?.lastName}
              </span>
              ?
            </p>

            <div className="flex justify-center gap-3">
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                onClick={confirmDeleteAdmin}
              >
                Yes, Delete
              </button>

              <button
                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
