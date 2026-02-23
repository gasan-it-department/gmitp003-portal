import {} from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { positionRecords } from "@/db/statements/position";
//tabs
import Application from "./Application";
import SlotHistory from "@/layout/human_resources/position/SlotHistory";

//
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
//interface
import type { UnitPosition } from "@/interface/data";
//icons
import {
  Briefcase,
  Building,
  Hash,
  Calendar,
  Users,
  FileText,
} from "lucide-react";

const PositionDetail = () => {
  const { positionId } = useParams();
  const auth = useAuth();

  const { data, isFetching } = useQuery<UnitPosition>({
    queryKey: ["position-data", positionId],
    queryFn: () => positionRecords(auth.token as string, positionId as string),
    enabled: !!positionId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  if (isFetching) {
    return (
      <div className="w-full h-full p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-50/30">
      {/* Header Section with Position Info */}
      <div className="flex-none border-b bg-white px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {data?.position?.name || "Position Details"}
              </h1>
              <Badge
                variant={data?.plantilla ? "default" : "outline"}
                className={
                  data?.plantilla
                    ? "bg-green-100 text-green-700 border-green-200"
                    : ""
                }
              >
                {data?.plantilla ? "Plantilla" : "Non-Plantilla"}
              </Badge>
              {data?.fixToUnit && (
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  Fixed to Unit
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <Building className="w-4 h-4" />
              {data?.unit?.name || "N/A"} • {data?.line?.name || "N/A"}
            </p>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1 bg-white">
              <Users className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
              {data?.slot?.length || 0} Slots
            </Badge>
            {data?.itemNumber && (
              <Badge variant="outline" className="px-3 py-1 bg-white">
                <Hash className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                {data.itemNumber}
              </Badge>
            )}
          </div>
        </div>

        {/* Position Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <Card className="bg-gray-50 border-0">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="w-4 h-4 text-blue-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Designation</p>
                <p className="text-sm font-medium">
                  {data?.designation || "Not Specified"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 border-0">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building className="w-4 h-4 text-purple-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Department</p>
                <p className="text-sm font-medium">
                  {data?.departmentId || "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 border-0">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Calendar className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-sm font-medium">
                  {data?.timestamp
                    ? new Date(data.timestamp).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-50 border-0">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <FileText className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Position ID</p>
                <p className="text-sm font-mono text-gray-600">
                  {data?.id?.substring(0, 8)}...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="flex-1 min-h-0 px-6 py-4">
        <Tabs defaultValue="history" className="w-full h-full flex flex-col">
          <div className="flex-none">
            <TabsList className="bg-white border shadow-sm p-1 w-full sm:w-auto justify-start">
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-primary data-[state=active]:text-white px-6"
              >
                <FileText className="w-4 h-4 mr-2" />
                Slot History
              </TabsTrigger>
              <TabsTrigger
                value="application"
                className="data-[state=active]:bg-primary data-[state=active]:text-white px-6"
              >
                <Users className="w-4 h-4 mr-2" />
                Applications
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 mt-4 min-h-0">
            <TabsContent
              value="history"
              className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col"
            >
              <SlotHistory
                unitPositionId={positionId as string}
                token={auth.token as string}
              />
            </TabsContent>

            <TabsContent
              value="application"
              className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col"
            >
              <Card className="h-full border shadow-sm overflow-hidden">
                <CardContent className="p-0 h-full">
                  <Application />
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default PositionDetail;
