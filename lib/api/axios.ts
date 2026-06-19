import axios, { AxiosError } from "axios";

export const baseURL = "https://api.dev.frametheworld.org";

const DEVICE_MODEL = "Admin_Session";
const DEVICE_UNIQUE_ID = "UUID_FTW-AdminPanel-A3F9B2C1D4E5F6A7B8C9D0E1F2A3B4C5";

export const API = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    devicemodel: DEVICE_MODEL,
    deviceuniqueid: DEVICE_UNIQUE_ID,
  },
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) config.headers.authorization = `Bearer ${token}`;
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isAuthRoute = window.location.pathname.startsWith("/auth/");
    if (error?.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);
