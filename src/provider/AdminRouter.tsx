// ProtectedRoute.tsx
import { createContext, useState, useEffect, useContext } from "react";
import { useNavigate, Outlet } from "react-router";

//utils
import { getCookie } from "@/utils/cookies";

//
import NotificationProvider from "./NotificationProvider";
//

const AuthContext = createContext<{
  token: string | undefined;
  userId: string | null;
}>({
  token: undefined,
  userId: null,
});

const AdminRouter = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem("auth_admin");
    if (!user) {
      navigate("/admin-login");
    }
    const token = getCookie(`auth_admin_token-${user}`);

    if (token) {
      setToken(token);
      setIsAuthenticated(true);
      setUserId(user);
    } else {
      localStorage.removeItem("user");
      navigate("/admin-login");
    }
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ token: token, userId }}>
      <NotificationProvider>
        <Outlet /> {/* This renders the child routes */}
      </NotificationProvider>
    </AuthContext.Provider>
  );
};

export default AdminRouter;

export const useAdminAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "The 'useAdminAuth' hook must be use only inside the provider."
    );
  }
  return context;
};
