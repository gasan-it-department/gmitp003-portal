// AdminRouter.tsx — auth guard + context for the admin panel.
import { createContext, useState, useEffect, useContext } from "react";
import { useNavigate, Outlet } from "react-router";
import { Loader2, ShieldCheck } from "lucide-react";

import { getCookie, removeCookie } from "@/utils/cookies";
import NotificationProvider from "./NotificationProvider";

interface AdminAuthValue {
  token: string | undefined;
  userId: string | null;
  logout: () => void;
}

const AuthContext = createContext<AdminAuthValue>({
  token: undefined,
  userId: null,
  logout: () => {},
});

const AdminRouter = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    const user = localStorage.getItem("auth_admin");
    if (user) removeCookie(`auth_admin_token-${user}`);
    localStorage.removeItem("auth_admin");
    navigate("/admin-login", { replace: true });
  };

  useEffect(() => {
    const user = localStorage.getItem("auth_admin");
    if (!user) {
      navigate("/admin-login", { replace: true });
      setLoading(false);
      return;
    }
    const stored = getCookie(`auth_admin_token-${user}`);
    if (stored) {
      setToken(stored);
      setIsAuthenticated(true);
      setUserId(user);
    } else {
      // Bugfix: this used to clear the wrong key ("user").
      localStorage.removeItem("auth_admin");
      navigate("/admin-login", { replace: true });
    }
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="p-3 rounded-2xl bg-white/10 border border-white/10">
          <ShieldCheck className="h-7 w-7 text-indigo-300" />
        </div>
        <div className="flex items-center gap-2 text-slate-300 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verifying admin session…
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ token, userId, logout }}>
      <NotificationProvider>
        <Outlet />
      </NotificationProvider>
    </AuthContext.Provider>
  );
};

export default AdminRouter;

export const useAdminAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "The 'useAdminAuth' hook must be used only inside the provider.",
    );
  }
  return context;
};
