import axios from "axios";

const base = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const API = axios.create({
  baseURL: `${base}/api/auth`,
});

// If your backend uses cookies/sessions, enable this
if (import.meta.env.PROD) {
  API.defaults.withCredentials = true;
}

export default API;
