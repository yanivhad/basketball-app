import axios from "axios";

const api = axios.create({
  baseURL: "http://basketball-app-production-125f.up.railway.app:3001/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;