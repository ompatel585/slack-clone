import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// The API runs on a different origin than the app, so Clerk's session cookie never reaches it.
// Send the short-lived session JWT instead; clerkMiddleware on the backend verifies it.
axiosInstance.interceptors.request.use(async (config) => {
  const token = await window.Clerk?.session?.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
