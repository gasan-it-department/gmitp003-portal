import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { Loader2 } from "lucide-react";

import axios from "@/db/axios";
import { useAuth } from "@/provider/ProtectedRoute";
import Test from "./Test";

/**
 * Landing for "/". A signed-in user must land on THEIR line's control
 * panel — never the internal Test page. The line id comes from
 * localStorage (persisted at login); older sessions that never stored it
 * resolve it from the token via GET /auth/session-line (and cache it).
 * The Test page itself stays reachable at /test.
 */
const RootRedirect = () => {
  const { token } = useAuth();
  const [line, setLine] = useState<string | null>(() =>
    localStorage.getItem("line"),
  );
  const [unresolved, setUnresolved] = useState(false);

  useEffect(() => {
    if (line || !token) return;
    let cancelled = false;
    axios
      .get("/auth/session-line", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => {
        if (cancelled) return;
        const l = r.data?.lineId as string | null;
        if (l) {
          localStorage.setItem("line", l);
          setLine(l);
        } else {
          setUnresolved(true); // account without a line — keep old behavior
        }
      })
      .catch(() => {
        if (!cancelled) setUnresolved(true);
      });
    return () => {
      cancelled = true;
    };
  }, [line, token]);

  if (line) return <Navigate to={`/${line}`} replace />;
  if (unresolved) return <Test />;
  return (
    <div className="w-full h-screen flex items-center justify-center gap-2 text-gray-400">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm">Opening your portal…</span>
    </div>
  );
};

export default RootRedirect;
