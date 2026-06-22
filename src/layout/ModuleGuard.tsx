import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import axios from "@/db/axios";
import { useAuth } from "@/provider/ProtectedRoute";
import { ShieldCheck, Loader2 } from "lucide-react";
import AccessDenied from "@/route/AccessDenied";

interface Props {
  /**
   * Module slug as stored in `Module.moduleName` — matches the `path`
   * field in the ControlPanel `panels` array (e.g. "supplies",
   * "medicine", "human-resources"). The route this guard wraps will
   * only render when the logged-in user has a Module row with this
   * moduleName.
   */
  moduleName: string;
  /**
   * Module slugs that are open to every authenticated line user (no
   * per-user enrolment required). Defaults to `["services", "documents"]`
   * — kept in sync with `ControlPanel`'s `ALWAYS_OPEN` so the launcher and
   * the route guard agree. "documents" is reachable by every line user
   * (the e-sign room is still gated by its own room registration/approval
   * in `DocumentRoomProvider`). If the `moduleName` prop matches one of
   * these, the guard renders the child tree without hitting the API.
   */
  openModules?: string[];
  /**
   * When true, deny silently by rendering the AccessDenied page in
   * place. When false, redirect to /:lineId (the dashboard). Default
   * true — the inline render preserves browser history so the user can
   * hit Back.
   */
  inlineDeny?: boolean;
  children: ReactNode;
}

/**
 * Route-level access guard.
 *
 * Why this exists: the legacy `ModuleAuthProvider` was never mounted in
 * `main.tsx`, so typing a URL like `/<lineId>/medicine` rendered the
 * Medicine module even for users without the access. This component
 * checks the user's Module rows on the server before letting the
 * children render. Result is cached per-(userId, moduleName) for 5 min
 * so deep navigation inside a module doesn't re-check on every hop.
 */
export const ModuleGuard = ({
  moduleName,
  openModules = ["services", "documents"],
  inlineDeny = true,
  children,
}: Props) => {
  const auth = useAuth();
  const location = useLocation();

  // Always-open modules skip the network round-trip.
  const isOpen = openModules.includes(moduleName);

  const { data, isFetching, isError } = useQuery<{ ok: boolean }>({
    queryKey: ["module-access", auth.userId, moduleName],
    queryFn: async () => {
      const res = await axios.get<{ message: string }>(
        "/user/module-access",
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "X-Requested-With": "XMLHttpRequest",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
          params: {
            // The backend currently splits on "/" and takes index [2];
            // wrapping with leading slashes keeps that contract while
            // we let it shake out properly later.
            moduleName: `/lineId/${moduleName}`,
            userId: auth.userId,
            // lineId is captured server-side for the audit log when
            // an unauthorised access is attempted.
            lineId: location.pathname.split("/")[1] ?? "",
          },
          // The endpoint returns 401 for "not authorised"; without this
          // axios would throw and the catch path would still treat it
          // as a denial.
          validateStatus: (s) => s === 200 || s === 401,
        },
      );
      return { ok: res.status === 200 && res.data?.message === "OK" };
    },
    enabled: !isOpen && !!auth.userId && !!auth.token && !!moduleName,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
  });

  // ── 1. Open module → always render
  if (isOpen) return <>{children}</>;

  // ── 2. Session missing → let ProtectedRoute handle it (don't flash a
  //         denial screen at users whose auth context hasn't hydrated yet)
  if (!auth.userId || !auth.token) return null;

  // ── 3. Network in-flight → centred spinner
  if (isFetching && !data) {
    return (
      <div className="w-full h-full min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <p className="text-xs flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Checking module access…
          </p>
        </div>
      </div>
    );
  }

  // ── 4. Decision
  const allowed = !isError && !!data?.ok;
  if (!allowed) {
    if (inlineDeny) return <AccessDenied />;
    return <Navigate to={`/${location.pathname.split("/")[1] ?? ""}`} replace />;
  }

  return <>{children}</>;
};

export default ModuleGuard;
