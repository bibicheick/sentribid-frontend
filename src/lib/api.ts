// src/lib/api.ts
import axios from "axios";
import { getToken, clearToken } from "./auth";

export const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (import.meta as any).env?.VITE_API_BASE ||
  "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear stale token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearToken();
      // Only redirect if we're not already on /login or /register
      const path = window.location.pathname;
      if (path !== "/login" && path !== "/register" && path !== "/forgot-password") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
