import { useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
//
import { getUnitInfo } from "@/db/statement";
//
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
//
import {
  BriefcaseBusiness,
  Group,
  Users,
  Building2,
  Calendar,
  Hash,
} from "lucide-react";

//
import OfficePersonnel from "@/layout/human_resources/OfficePersonnel";
import OfficePostion from "@/layout/human_resources/OfficePostion";

//
import type { Department } from "@/interface/data";

const Office = () => {
  const [params, setParams] = useSearchParams({ tab: "personnel" });
  const { officeID } = useParams();
  const auth = useAuth();

  const currentTabs = params.get("tab") || "personnel";

  const { data, isFetching, isError } = useQuery<Department>({
    queryKey: ["unit", officeID],
    queryFn: () => getUnitInfo(auth.token as string, officeID as string),
    enabled: !!officeID && !!auth.token,
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isFetching) {
    return (
      <div className="w-full h-full flex flex-col bg-white">
        {/* Header Loading */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>

        {/* Content Loading */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                <Skeleton className="h-6 w-16 mt-2" />
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <div className="text-center py-16 px-4">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Building2 className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Unit Not Found
          </h3>
          <p className="text-gray-500 mb-6">
            The requested organizational unit could not be found or you don't
            have permission to access it.
          </p>
          <Badge variant="outline" className="font-normal">
            Error: Unit not available
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header Section - Compact */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                {data.name}
              </h1>
              {data.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                  {data.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  <span>
                    ID: <strong>{data.id.substring(0, 12)}...</strong>
                  </span>
                </div>
                {data.createdAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Created: <strong>{formatDate(data.createdAt)}</strong>
                    </span>
                  </div>
                )}
                <div className="ml-auto">
                  <Badge variant="outline" className="font-normal text-xs">
                    Organizational Unit
                  </Badge>
                </div>
              </div>
            </div>
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
          {/* Tabs Navigation - Using proper TabsList wrapper */}
          <div className="border-b">
            <TabsList className="h-12 px-6 bg-white rounded-none border-0">
              <TabsTrigger
                value="personnel"
                className="h-10 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="font-medium text-sm">Personnel</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="position"
                className="h-10 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none"
              >
                <div className="flex items-center gap-2">
                  <BriefcaseBusiness className="h-4 w-4" />
                  <span className="font-medium text-sm">Positions</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="group"
                className="h-10 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none"
              >
                <div className="flex items-center gap-2">
                  <Group className="h-4 w-4" />
                  <span className="font-medium text-sm">Teams</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tabs Content - Full height */}
          <TabsContent
            value="personnel"
            className="h-full flex-1 m-0 p-0 data-[state=active]:flex"
          >
            <OfficePersonnel />
          </TabsContent>
          <TabsContent
            value="position"
            className="h-full flex-1 m-0 p-0 data-[state=active]:flex"
          >
            <OfficePostion
              id={officeID as string}
              token={auth.token as string}
              userId={auth.userId as string}
            />
          </TabsContent>
          <TabsContent
            value="group"
            className="h-full flex-1 m-0 p-0 data-[state=active]:flex"
          >
            <div className="h-full flex flex-col items-center justify-center p-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                <Group className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Teams Feature
              </h3>
              <p className="text-gray-500 text-center text-sm max-w-md mb-4">
                Team management functionality is coming soon. This section will
                allow you to organize personnel into working groups and teams.
              </p>
              <Badge variant="outline" className="font-normal text-xs">
                Coming Soon
              </Badge>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Office;
