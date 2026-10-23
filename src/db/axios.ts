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

/*
  Endpoints where a 401 is an ANSWER, not an expired session.

  Signing in with the wrong password returns 401. If that were treated as a
  dead session the login page would clear itself and reload, and the user
  would never see "wrong username or password" — they would just watch the
  form blink at them.
*/
const AUTH_ENDPOINTS = [
  "/auth",
  "/admin-login",
  "/register",
  "/account/forgot-password",
  "/account/user/reset-password",
  "/otp/",
];

/**
 * A dead session should send you to the sign-in page, not paint every panel
 * with "failed to load".
 *
 * The token lives in a cookie with its own lifetime, so it can easily still
 * be sitting there after the server has stopped accepting it — expired,
 * revoked, or minted before sessions expired at all. ProtectedRoute only
 * looks for the cookie's PRESENCE, so without this the app believes it is
 * signed in while every request comes back 401.
 */
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? "";
    const onLoginPage = window.location.pathname.startsWith("/auth");
    const isAuthCall = AUTH_ENDPOINTS.some((p) => url.startsWith(p));

    if (status === 401 && !isAuthCall && !onLoginPage) {
      try {
        const user = localStorage.getItem("user");
        if (user) {
          // Same shape ProtectedRoute's force-logout uses.
          document.cookie =
            `auth_token-${user}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; ` +
            `path=/; domain=${window.location.hostname};`;
        }
        localStorage.removeItem("user");
      } catch {
        /* private mode, blocked storage — the redirect still has to happen */
      }
      // replace(), so Back does not return to a page that cannot load.
      window.location.replace("/auth");
    }
    return Promise.reject(error);
  },
);

export default axios;
