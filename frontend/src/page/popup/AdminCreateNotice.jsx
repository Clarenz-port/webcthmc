import { useState } from "react";
import { notify } from "../../utils/toast";
import axios from "axios";

export default function AdminCreateNotice() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("token");

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
    } catch (err) {
      notify.success("Failed to create notice");
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Create Notice</h2>

      <input
        className="w-full border p-2 mb-3"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="w-full border p-2 mb-3"
        placeholder="Message"
        rows="4"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button
        onClick={submitNotice}
        className="bg-emerald-700 text-white px-4 py-2 rounded"
      >
        Publish Notice
      </button>
    </div>
  );
}
