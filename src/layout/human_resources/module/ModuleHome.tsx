import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import { Spinner } from "@/components/ui/spinner";
import { getLineModuleData } from "@/db/statement";
import { panels } from "@/layout/ControlPanel";
import ModuleItem from "./item/ModuleItem";
import { AlertCircle, LayoutGrid } from "lucide-react";

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
  });

  const modules = panels.map((item, i) => {
    if (!data) {
      return {
        module: item.title,
        users: 0,
        index: i + 1,
        Icon: item.Icon,
        path: item.path,
      };
    }
    const module = data.find((_, j) => j === i);

    if (!module) {
      return {
        module: item.title,
        users: 0,
        index: i + 1,
        Icon: item.Icon,
        path: item.path,
      };
    }
    return {
      module: item.title,
      users: module.totalUsers || 0,
      index: i + 1,
      Icon: item.Icon,
      path: item.path,
    };
  });

  if (isFetching) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="relative">
            <Spinner className="h-12 w-12" />
          </div>
          <p className="mt-3 text-sm font-medium text-gray-600">
            Loading modules...
          </p>
          <p className="text-xs text-gray-400 mt-1">Please wait</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Modules
          </h3>
          <p className="text-sm text-gray-500">
            Unable to load module data. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  const filteredModules = modules.filter(
    (module) => module.path !== "human-resources",
  );

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
              <LayoutGrid className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Line Modules</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage and view module access for this line
              </p>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        {filteredModules.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredModules.map((item) => (
              <ModuleItem item={item} key={item.index} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <LayoutGrid className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                No Modules Available
              </h3>
              <p className="text-sm text-gray-500">
                No modules are currently configured for this line.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleHome;
