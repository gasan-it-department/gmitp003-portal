// ProtectedRoute.tsx
import { createContext, useState, useEffect, useContext } from "react";
import { useNavigate, Outlet } from "react-router";

//utils
import { getCookie } from "@/utils/cookies";

//
//
import type { ProtectedRouteProps } from "@/interface/data";

const AuthContext = createContext<ProtectedRouteProps>({
  token: undefined,
  auth: false,
});

const ProtectedRoute = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getCookie("auth_token");
    if (token) {
      setToken(token);
      setIsAuthenticated(true);
    } else {
      navigate("/auth");
    }
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return <div>Loading...</div>; // Show loading state
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ token: token, auth: isAuthenticated }}>
      <Outlet /> {/* This renders the child routes */}
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
