import axios from "axios";
import type { Analysis, Stats, User } from "../types";

export const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

/** Convert a relative API path like /files/processed/x.jpg into an absolute URL. */
export function mediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path; // already absolute
  return `${BASE_URL}${path}`;
}

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  register: (email: string, password: string) =>
    api.post<{ access_token: string }>("/auth/register", { email, password }),

  login: (email: string, password: string) => {
    const form = new FormData();
    form.append("username", email);
    form.append("password", password);
    return api.post<{ access_token: string }>("/auth/login", form);
  },

  me: () => api.get<User>("/auth/me"),
};

export const analysisApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<Analysis>("/analyses", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  list: () => api.get<Analysis[]>("/analyses"),

  get: (id: number) => api.get<Analysis>(`/analyses/${id}`),

  delete: (id: number) => api.delete(`/analyses/${id}`),

  stats: () => api.get<Stats>("/stats"),
};
