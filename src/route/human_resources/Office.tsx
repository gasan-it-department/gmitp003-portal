import { useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
//
import { getUnitInfo } from "@/db/statement";
//
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
//
import { BriefcaseBusiness, Group, Users, Building2, Info } from "lucide-react";

//
import OfficePersonnel from "@/layout/human_resources/OfficePersonnel";
import OfficePostion from "@/layout/human_resources/OfficePostion";

//
import type { Department } from "@/interface/data";
import OfficeInfo from "@/layout/human_resources/OfficeInfo";

const Office = () => {
  const [params, setParams] = useSearchParams({ tab: "personnel" });
  const { officeID, lineId } = useParams();
  const auth = useAuth();

  const currentTabs = params.get("tab") || "personnel";

  const { data, isFetching, isError } = useQuery<Department>({
    queryKey: ["unit", officeID],
    queryFn: () => getUnitInfo(auth.token as string, officeID as string),
    enabled: !!officeID && !!auth.token,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const handleChangeParams = (key: string, value: string) => {
    setParams(
      (prev) => {
        prev.set(key, value);
        return prev;
      },
      {
        replace: true,
      },
    );
  };

  if (isFetching) {
    return (
      <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header Loading - Compact */}
        <div className="px-4 py-3 border-b bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-md" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
        </div>

        {/* Content Loading - Compact */}
        <div className="flex-1 p-4">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center py-12 px-4 bg-white rounded-lg shadow-md max-w-md mx-4">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            Unit Not Found
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            The requested unit could not be found or you don't have permission.
          </p>
          <Badge variant="outline" className="text-xs bg-gray-50">
            Not Available
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section - Compact with gradient theme */}
      <div className="px-4 py-3 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md shadow-sm">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-gray-900 truncate">
              {data.name}
            </h1>
            {data.description && (
              <p className="text-xs text-gray-500 truncate">
                {data.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Section - Full height */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          value={currentTabs}
          onValueChange={(e) => handleChangeParams("tab", e)}
          className="h-full flex flex-col"
          defaultValue="personnel"
        >
          {/* Tabs Navigation - Compact with gradient theme */}
          <div className="border-b bg-white/50 backdrop-blur-sm">
            <TabsList className="h-10 px-4 bg-transparent rounded-none border-0 gap-1">
              <TabsTrigger
                value="personnel"
                className="h-8 px-3 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent rounded-none text-xs text-gray-600 hover:text-gray-900 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  <span>Personnel</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="position"
                className="h-8 px-3 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent rounded-none text-xs text-gray-600 hover:text-gray-900 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <BriefcaseBusiness className="h-3.5 w-3.5" />
                  <span>Positions</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="group"
                className="h-8 px-3 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent rounded-none text-xs text-gray-600 hover:text-gray-900 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Group className="h-3.5 w-3.5" />
                  <span>Teams</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="info"
                className="h-8 px-3 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent rounded-none text-xs text-gray-600 hover:text-gray-900 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" />
                  <span>Info</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tabs Content - Full height */}
          <TabsContent
            value="personnel"
            className="h-full flex-1 m-0 p-0 data-[state=active]:flex overflow-hidden"
          >
            <OfficePersonnel />
          </TabsContent>

          <TabsContent
            value="position"
            className="h-full flex-1 m-0 p-0 data-[state=active]:flex overflow-hidden"
          >
            <OfficePostion
              id={officeID as string}
              token={auth.token as string}
              userId={auth.userId as string}
            />
          </TabsContent>

          <TabsContent
            value="group"
            className="h-full flex-1 m-0 p-0 data-[state=active]:flex overflow-hidden"
          >
            <div className="h-full flex flex-col items-center justify-center p-4">
              <div className="w-12 h-12 mb-3 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <Group className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Teams Feature
              </h3>
              <p className="text-xs text-gray-500 text-center max-w-sm mb-3">
                Team management functionality is coming soon
              </p>
              <Badge variant="outline" className="text-xs bg-white">
                Coming Soon
              </Badge>
            </div>
          </TabsContent>

          <TabsContent
            value="info"
            className="h-full flex-1 m-0 p-0 data-[state=active]:flex overflow-hidden"
          >
            <OfficeInfo
              unit={data}
              lineId={lineId as string}
              userId={auth.userId as string}
              token={auth.token as string}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Office;
