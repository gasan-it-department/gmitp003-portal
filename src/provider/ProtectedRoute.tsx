import ModuleAuthProvider from "./ModuleAuthProvider";
// ProtectedRoute.tsx
import { createContext, useState, useEffect, useContext } from "react";
import { useNavigate, Outlet } from "react-router";

//utils
import { getCookie } from "@/utils/cookies";

//
import NotificationProvider from "./NotificationProvider";
//
import type { ProtectedRouteProps } from "@/interface/data";

const AuthContext = createContext<ProtectedRouteProps>({
  token: undefined,
  auth: false,
  userId: null,
});

const ProtectedRoute = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/auth");
    }
    const token = getCookie(`auth_token-${user}`);

    if (token) {
      setToken(token);
      setIsAuthenticated(true);
      setUserId(user);
    } else {
      localStorage.removeItem("user");
      navigate("/auth");
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
    <AuthContext.Provider
      value={{ token: token, auth: isAuthenticated, userId }}
    >
      <NotificationProvider>
        <ModuleAuthProvider>
          <Outlet />
        </ModuleAuthProvider>
      </NotificationProvider>
    </AuthContext.Provider>
  );
};

export default ProtectedRoute;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("The 'useAuth' hook must be use only inside the provider.");
  }
  return context;
};
