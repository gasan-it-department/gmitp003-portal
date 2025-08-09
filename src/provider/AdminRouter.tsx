// ProtectedRoute.tsx
import { createContext, useState, useEffect, useContext } from "react";
import { useNavigate, Outlet } from "react-router";

//utils
import { getCookie } from "@/utils/cookies";

//
//
import type { ProtectedRouteProps } from "@/interface/data";

const AdminContext = createContext<ProtectedRouteProps>({
  token: undefined,
  auth: false,
});

const AdminRouter = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getCookie("auth_admin_token");
    console.log({ token });

    if (token) {
      setToken(token);
      setIsAuthenticated(true);
    } else {
      navigate("/admin-login");
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
    <AdminContext.Provider value={{ token: token, auth: isAuthenticated }}>
      <Outlet /> {/* This renders the child routes */}
    </AdminContext.Provider>
  );
};

export default AdminRouter;

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("The 'useAuth' hook must be use only inside the provider.");
  }
  return context;
};
