import axios from "axios";
import type { AuthResponse, Note } from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  // Updated passwordless signup
  signup: (data: { email: string; name: string }) =>
    api.post<{ message: string; pendingUserId: string }>("/auth/signup", data),

  verifyOTP: (data: { pendingUserId: string; otp: string }) =>
    api.post<AuthResponse>("/auth/verify-otp", data),

  // OLD password-based login (keeping for reference)
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>("/auth/login", data),

  // NEW OTP-based login
  sendLoginOTP: (data: { email: string }) =>
    api.post<{ message: string; loginSession: string }>(
      "/auth/send-login-otp",
      data
    ),

  verifyLoginOTP: (data: { loginSession: string; otp: string }) =>
    api.post<AuthResponse>("/auth/verify-login-otp", data),

  googleAuth: (token: string) =>
    api.post<AuthResponse>("/auth/google", { token }),
};

export const notesAPI = {
  getNotes: () => api.get<{ notes: Note[] }>("/notes"),
  createNote: (data: { title: string; content: string }) =>
    api.post<{ message: string; note: Note }>("/notes", data),
  updateNote: (id: string, data: { title: string; content: string }) =>
    api.put<{ message: string; note: Note }>(`/notes/${id}`, data),
  deleteNote: (id: string) => api.delete<{ message: string }>(`/notes/${id}`),
};

export default api;
