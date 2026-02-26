import { useState, useEffect } from "react";
import { notify } from "../../utils/toast";
import API from '../../apis/axios.js';
import { 
  FaBullhorn, 
  FaHeading, 
  FaEnvelopeOpenText, 
  FaPaperPlane, 
  FaInfoCircle,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaCalendarAlt, 
   FaHistory
} from "react-icons/fa";

export default function AdminCreateNotice() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const token = localStorage.getItem("token");

  // Fetch notices on mount
  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await API.get("/api/notices", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotices(res.data || []);
    } catch (err) {
      console.error("Failed to fetch notices:", err);
      notify.error("Failed to load notices");
    } finally {
      setLoading(false);
    }
  };

  const submitNotice = async () => {
    try {
      await API.post(
        "/api/notices",
        { title, message },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      notify.success("Notice created!");
      setTitle("");
      setMessage("");
      fetchNotices(); // Refresh list
    } catch (err) {
      notify.error("Failed to create notice");
    }
  };

  const startEdit = (notice) => {
    setEditingId(notice.id);
    setEditTitle(notice.title);
    setEditMessage(notice.message);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditMessage("");
  };

  const saveEdit = async (id) => {
    try {
      await API.put(
        `/api/notices/${id}`,
        { title: editTitle, message: editMessage },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      notify.success("Notice updated!");
      setEditingId(null);
      fetchNotices(); // Refresh list
    } catch (err) {
      notify.error("Failed to update notice");
    }
  };

  const deleteNotice = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notice?")) return;
    try {
      await API.delete(`/api/notices/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      notify.success("Notice deleted!");
      fetchNotices(); // Refresh list
    } catch (err) {
      notify.error("Failed to delete notice");
    }
  };

  return (
    <div className="max-w-full mx-auto">
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        
        {/* HEADER SECTION */}
        <div className="p-8 border-b border-gray-50 bg-[#f5f9ef]/50">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white text-[#7e9e6c] rounded-2xl shadow-sm">
              <FaBullhorn size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Manage Notices</h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">
                Create, edit, and delete notices
              </p>
            </div>
          </div>
        </div>

        {/* FORM BODY */}
        <div className="p-8 space-y-6">
          
          {/* TITLE INPUT */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              <FaHeading size={10} /> Notice Title
            </label>
            <div className="relative group">
              <input
                type="text"
                className="w-full bg-gray-50 border border-transparent focus:border-[#7e9e6c]/30 focus:bg-white focus:ring-4 focus:ring-[#7e9e6c]/5 p-4 rounded-2xl outline-none transition-all text-gray-700 font-semibold placeholder:text-gray-300 shadow-inner"
                placeholder="e.g. Annual General Meeting 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          {/* MESSAGE TEXTAREA */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              <FaEnvelopeOpenText size={10} /> Detailed Message
            </label>
            <div className="relative group">
              <textarea
                className="w-full bg-gray-50 border border-transparent focus:border-[#7e9e6c]/30 focus:bg-white focus:ring-4 focus:ring-[#7e9e6c]/5 p-4 rounded-2xl outline-none transition-all text-gray-700 font-medium placeholder:text-gray-300 shadow-inner resize-none"
                placeholder="Type your announcement details here..."
                rows="6"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>

          {/* INFO TIP */}
          <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
            <FaInfoCircle className="text-blue-400 mt-0.5" />
            <p className="text-[11px] text-blue-600/70 font-medium leading-relaxed">
              Once published, this notice will be visible on the dashboard of all registered members immediately. Please verify the details before sending.
            </p>
          </div>

          {/* ACTION BUTTON */}
          <div className="pt-2">
            <button
              onClick={submitNotice}
              className="w-full group flex items-center justify-center gap-3 bg-[#7e9e6c] hover:bg-[#6a8b5a] text-white py-4 rounded-[1.3rem] font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-green-100 active:scale-[0.98]"
            >
              <FaPaperPlane className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              Publish Notice
            </button>
          </div>

        </div>
</div>
        {/* NOTICES LIST */}
        <div className="bg-white mt-6 rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
  <div className="p-8">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
        <FaBullhorn size={20} />
      </div>
      <h3 className="text-xl font-bold text-gray-800">Existing Notices</h3>
    </div>

    {loading ? (
      <div className="flex flex-col items-center py-12 text-gray-400">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Fetching latest notices...</p>
      </div>
    ) : notices.length === 0 ? (
      <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
        <p className="text-gray-400 font-medium">No active notices found.</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-100 rounded-xl overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-gray-500">Title</th>
              <th className="px-4 py-3 text-left font-bold text-gray-500">Message</th>
              <th className="px-4 py-3 text-left font-bold text-gray-500">Date</th>
              <th className="px-4 py-3 text-center font-bold text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {notices.map((notice) => (
              <tr key={notice.id} className="border-b border-gray-50 hover:bg-indigo-50/20 transition-colors">
                {editingId === notice.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full p-2 bg-white border border-gray-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
                        placeholder="Notice Title"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <textarea
                        value={editMessage}
                        onChange={(e) => setEditMessage(e.target.value)}
                        className="w-full p-2 bg-white border border-gray-200 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                        rows="2"
                        placeholder="Your message here..."
                      />
                    </td>
                    <td className="px-4 py-2 text-gray-500 text-xs">
                      {new Date(notice.createdAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-2 text-center flex gap-2 justify-center">
                      <button
                        onClick={() => saveEdit(notice.id)}
                        className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 text-xs font-bold"
                      >
                        <FaSave /> Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1 bg-white text-gray-600 border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50 text-xs font-bold"
                      >
                        <FaTimes /> Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2 font-bold text-gray-800">{notice.title}</td>
                    <td className="px-4 py-2 text-gray-600">{notice.message}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs">
                      {new Date(notice.createdAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-2 text-center flex gap-2 justify-center">
                      <button
                        onClick={() => startEdit(notice)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                        title="Edit Notice"
                      >
                        <FaEdit size={16} />
                      </button>
                      <button
                        onClick={() => deleteNotice(notice.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                        title="Delete Notice"
                      >
                        <FaTrash size={16} />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>

  {/* FOOTER METADATA */}
  <div className="bg-gray-50/80 px-8 py-5 border-t border-gray-100 flex items-center justify-center gap-2">
    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
      LMS Notice Distribution System <span className="text-indigo-300">v2.0</span>
    </span>
  </div>
</div>
</div>
  );
}