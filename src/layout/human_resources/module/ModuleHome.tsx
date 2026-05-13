import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import { Loader2, AlertCircle, LayoutGrid } from "lucide-react";

import { getLineModuleData } from "@/db/statement";
import { panels } from "@/layout/ControlPanel";
import ModuleItem from "./item/ModuleItem";

interface ModuleWithUserCount {
  moduleIndex: string;
  moduleName: string;
  totalUsers: number;
}

const ModuleHome = () => {
  const { lineId } = useParams();
  const auth = useAuth();

  const { data, isFetching, error } = useQuery<ModuleWithUserCount[]>({
    queryKey: ["modules", lineId],
    queryFn: () =>
      getLineModuleData(
        auth.token as string,
        lineId as string,
        panels.map((_, i) => i),
      ),
    refetchOnWindowFocus: false,
  });

  // Match user-count by moduleName (= panel.path) so order/length differences
  // between the API response and the static panel list don't break anything.
  const modules = useMemo(() => {
    const byName = new Map<string, ModuleWithUserCount>();
    (data ?? []).forEach((m) => byName.set(m.moduleName, m));

    return panels
      .filter((p) => p.path !== "human-resources") // hide HR self
      .map((p, i) => ({
        module: p.title,
        users: byName.get(p.path)?.totalUsers ?? 0,
        index: i + 1,
        Icon: p.Icon,
        path: p.path,
      }));
  }, [data]);

  // ── Loading ────────────────────────────────────────────────────────────
  if (isFetching && !data) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-xs">Loading modules...</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="border rounded-lg bg-white p-6 text-center max-w-sm w-full">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Error loading modules
          </h3>
          <p className="text-xs text-gray-500">
            Unable to load module data. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
      <div className="p-3 max-w-7xl mx-auto">

        {/* Header */}
        <div className="border rounded-lg bg-white overflow-hidden mb-3">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
            <LayoutGrid className="h-3 w-3 text-blue-500" />
            <div>
              <h3 className="text-xs font-semibold text-gray-800">
                Line Modules
              </h3>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                Manage user access across all modules on this line
              </p>
            </div>
          </div>
        </div>

        {/* Grid */}
        {modules.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {modules.map((item) => (
              <ModuleItem item={item} key={item.path} />
            ))}
          </div>
        ) : (
          <div className="border rounded-lg bg-white p-10 text-center">
            <LayoutGrid className="h-7 w-7 text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-gray-500">
              No modules available
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              No modules are configured for this line yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleHome;
