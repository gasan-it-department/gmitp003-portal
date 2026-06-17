import axiosInstance from "axios";

// Last-resort fallback so the backend base URL is NEVER undefined even if the
// .env wasn't loaded (e.g. Vite started before the file existed, or run from a
// dir without a .env). Env values below take precedence when present.
const FALLBACK_BACKEND_URL = "http://127.0.0.1:3000";

export const frontendUrl = import.meta.env.VITE_FRONTEND_URL;
export const forwardedUrl = import.meta.env.VITE_FORWARDED_URL;

// Resolve the backend base URL from .env, switching by VITE_STATUS:
//   "1" → VITE_DOMAIN (production), "2" → VITE_FORWARDED_URL (dev tunnel),
//   otherwise → VITE_SERVER_URL (local). Always returns a defined URL.
export const getUrl = (): string => {
  const url = import.meta.env.VITE_SERVER_URL;
  const domain = import.meta.env.VITE_DOMAIN;
  const status = import.meta.env.VITE_STATUS;

  if (status === "1" && domain) return domain;
  if (status === "2" && forwardedUrl) return forwardedUrl;
  return url || FALLBACK_BACKEND_URL;
};

export const url = getUrl();

const axios = axiosInstance.create({
  baseURL: getUrl(),
  withCredentials: true,
});

export default axios;
