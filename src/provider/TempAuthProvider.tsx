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

const TempAuthProvider = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | undefined>(undefined);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tempId = localStorage.getItem("temp_auth");
    if (!tempId) {
      setToken(undefined);
    }
    const token = getCookie(`temp_auth-${tempId}`);

    if (token) {
      setToken(token);
      setUserId(tempId);
    } else {
      setToken(undefined);
      localStorage.removeItem("temp_auth");
    }
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ token: token, auth: false, userId }}>
      <Outlet /> {/* This renders the child routes */}
    </AuthContext.Provider>
  );
};

export default TempAuthProvider;

export const useTemAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "The 'useTempAuth' hook must be use only inside the provider."
    );
  }
  return context;
};
