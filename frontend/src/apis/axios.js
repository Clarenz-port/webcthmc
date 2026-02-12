import axios from 'axios';

const API = axios.create({
  // This will automatically use the environment variable
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000', 
});

export default API;