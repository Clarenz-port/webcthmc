import { useState, useEffect } from "react";
import { notify } from "../../utils/toast";
import axios from "axios";
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
      const res = await axios.get("http://localhost:8000/api/notices", {
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
      await axios.post(
        "http://localhost:8000/api/notices",
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
      await axios.put(
        `http://localhost:8000/api/notices/${id}`,
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
      await axios.delete(`http://localhost:8000/api/notices/${id}`, {
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
      <div className="space-y-4">
        {notices.map((notice) => (
          <div 
            key={notice.id} 
            className={`group relative bg-white p-6 rounded-2xl border transition-all duration-200 ${
              editingId === notice.id 
                ? "border-indigo-200 bg-indigo-50/30 ring-4 ring-indigo-50" 
                : "border-gray-100 hover:border-gray-200 hover:shadow-md"
            }`}
          >
            {/* Accent vertical bar */}
            <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full ${editingId === notice.id ? "bg-indigo-500" : "bg-gray-200 group-hover:bg-indigo-300"}`} />

            {editingId === notice.id ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-wider mb-2">
                  <FaEdit size={12} /> Editing Notice
                </div>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold"
                  placeholder="Notice Title"
                />
                <textarea
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  rows="4"
                  placeholder="Your message here..."
                />
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => saveEdit(notice.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors font-bold"
                  >
                    <FaSave /> Save Changes
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center justify-center gap-2 bg-white text-gray-600 border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors font-bold"
                  >
                    <FaTimes /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="pl-2">
                <div className="flex justify-between items-start gap-4">
                  <h4 className="font-bold text-lg text-gray-800 leading-tight">{notice.title}</h4>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(notice)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="Edit Notice"
                    >
                      <FaEdit size={16} />
                    </button>
                    <button
                      onClick={() => deleteNotice(notice.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete Notice"
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-600 mt-2 text-sm leading-relaxed">{notice.message}</p>
                
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                    <FaCalendarAlt className="text-indigo-300" />
                    {new Date(notice.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                    <FaHistory className="text-indigo-300" />
                    Active
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
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