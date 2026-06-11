import { useNavigate, useParams, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/provider/ProtectedRoute";
import { getUnitInfo } from "@/db/statement";

import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import OfficePersonnel from "@/layout/human_resources/OfficePersonnel";
import OfficePostion from "@/layout/human_resources/OfficePostion";
import OfficeInfo from "@/layout/human_resources/OfficeInfo";

import {
  BriefcaseBusiness,
  Users,
  Building2,
  Info,
  Loader2,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";

import type { Department } from "@/interface/data";

const Office = () => {
  const [params, setParams] = useSearchParams({ tab: "personnel" });
  const { officeID, lineId } = useParams();
  const auth = useAuth();
  const nav = useNavigate();
  const currentTab = params.get("tab") || "personnel";

  const { data, isFetching, isError, error } = useQuery<Department>({
    queryKey: ["unit", officeID],
    queryFn: () => getUnitInfo(auth.token as string, officeID as string),
    enabled: !!officeID && !!auth.token,
    refetchOnWindowFocus: false,
  });

  const handleTab = (key: string, value: string) =>
    setParams(
      (prev) => {
        prev.set(key, value);
        return prev;
      },
      { replace: true },
    );

  if (isFetching && !data) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-1.5 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-xs">Loading unit...</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-3">
        <div className="border rounded-lg bg-white p-6 text-center max-w-sm w-full">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <h3 className="text-xs font-semibold text-gray-900 mb-1">
            Unit not found
          </h3>
          <p className="text-[10px] text-gray-500 mb-3">
            {(error as any)?.message ??
              "It may have been removed or you don't have access."}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[10px] gap-1.5"
            onClick={() => nav(-1)}
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => nav(-1)}
            >
              <ArrowLeft className="h-3 w-3" />
            </Button>
            <div className="p-1.5 bg-blue-600 rounded-md flex-shrink-0">
              <Building2 className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-semibold text-gray-900 truncate">
                {data.name ?? "Untitled Unit"}
              </h1>
              {data.description && (
                <p className="text-[10px] text-gray-500 truncate">
                  {data.description}
                </p>
              )}
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200 flex-shrink-0"
          >
            {data._count?.users ?? 0} member
            {(data._count?.users ?? 0) === 1 ? "" : "s"}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={currentTab}
        onValueChange={(e) => handleTab("tab", e)}
        className="flex-1 min-h-0 flex flex-col"
      >
        <div className="bg-white border-b px-3 py-1.5 flex-shrink-0">
          <TabsList className="h-7 p-0.5 bg-gray-100">
            <TabsTrigger
              value="personnel"
              className="h-6 px-2 text-[10px] gap-1.5 data-[state=active]:text-blue-700"
            >
              <Users className="h-3 w-3" />
              Personnel
            </TabsTrigger>
            <TabsTrigger
              value="position"
              className="h-6 px-2 text-[10px] gap-1.5 data-[state=active]:text-blue-700"
            >
              <BriefcaseBusiness className="h-3 w-3" />
              Positions
            </TabsTrigger>
            <TabsTrigger
              value="info"
              className="h-6 px-2 text-[10px] gap-1.5 data-[state=active]:text-blue-700"
            >
              <Info className="h-3 w-3" />
              Info
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="personnel"
          className="flex-1 min-h-0 m-0 focus-visible:outline-none overflow-hidden"
        >
          <OfficePersonnel />
        </TabsContent>

        <TabsContent
          value="position"
          className="flex-1 min-h-0 m-0 focus-visible:outline-none overflow-hidden"
        >
          <OfficePostion
            id={officeID as string}
            token={auth.token as string}
            userId={auth.userId as string}
          />
        </TabsContent>

        <TabsContent
          value="info"
          className="flex-1 min-h-0 m-0 focus-visible:outline-none overflow-hidden"
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
  );
};

export default Office;
