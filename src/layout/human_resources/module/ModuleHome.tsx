import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import { Spinner } from "@/components/ui/spinner";
import { getLineModuleData } from "@/db/statement";
import { panels } from "@/layout/ControlPanel";
import { Button } from "@/components/ui/button";
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
        panels.map((_, i) => i + 1)
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
      module: module.moduleName,
      users: module.totalUsers || 0,
      index: i + 1,
      Icon: item.Icon,
      path: item.path,
    };
  });

  if (isFetching) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Spinner />
        <span className="ml-2">Loading modules...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Error Loading Modules</h3>
          <p className="text-sm text-gray-500">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-6">
      <div className="mb-6 flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">Line Modules</h1>
          <p className="text-gray-600">Manage and view module access</p>
        </div>
        <Button size="sm">Set</Button>
      </div>

      <div className="w-full grid grid-cols-4 gap-4">
        {modules
          .filter((module) => module.path !== "human-resources/home")
          .map((item) => (
            <ModuleItem item={item} key={item.index} />
          ))}
      </div>
    </div>
  );
};

export default ModuleHome;
