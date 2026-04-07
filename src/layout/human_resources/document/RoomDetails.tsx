import { useParams, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
//
import { room } from "@/db/statements/document";

//

import { Button } from "@/components/ui/button";
import ManageRoom from "./ManageRoom";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
//
import type { ReceivingRoom } from "@/interface/data";
import { Home, Settings, Info, Building2, Hash } from "lucide-react";

const RoomDetails = () => {
  const [searchParams, setSearchParams] = useSearchParams({ roomTab: "info" });
  const { roomId, lineId } = useParams();
  const { token, userId } = useAuth();
  const currentRoomTabs = searchParams.get("roomTab") || "info";

  const { data, isFetching } = useQuery<ReceivingRoom>({
    queryKey: ["room", roomId],
    queryFn: () => room(token as string, roomId as string),
    enabled: !!token || !!roomId,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const handleChangeParam = (key: string, value: string) => {
    setSearchParams(
      (prev) => {
        prev.set(key, value);
        return prev;
      },
      { replace: true },
    );
  };

  if (isFetching) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-gray-300" />
            </div>
          </div>
          <p className="text-gray-500 font-medium">Loading room details...</p>
          <p className="text-sm text-gray-400 mt-1">Please wait</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Home className="h-10 w-10 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Room Not Found
          </h3>
          <p className="text-gray-500 mb-4">
            The room you're looking for doesn't exist or you don't have
            permission to view it.
          </p>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="mx-auto"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 md:p-6 bg-gray-50">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Home className="h-4 w-4" />
          <span>Rooms</span>
          <span>/</span>
          <span className="text-gray-700 font-medium truncate">
            {data.code}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data.address}</h1>
            <p className="text-sm text-gray-500 mt-1">Room Code: {data.code}</p>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              data.status === 1
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {data.status === 1 ? "Active" : "Inactive"}
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs
        defaultValue={"info"}
        value={currentRoomTabs}
        onValueChange={(e) => handleChangeParam("roomTab", e)}
        className="w-full"
      >
        <TabsList className="mb-6 bg-white border shadow-sm">
          <TabsTrigger
            value="info"
            className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
          >
            <Info className="h-4 w-4" />
            Information
          </TabsTrigger>
          <TabsTrigger
            value="manage"
            className="flex items-center gap-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
          >
            <Settings className="h-4 w-4" />
            Manage Room
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-0">
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            {/* Room Info Header */}
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-500" />
                Room Information
              </h2>
            </div>

            {/* Room Details */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    Address
                  </label>
                  <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-md border">
                    {data.address}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Hash className="h-4 w-4" />
                    Room Code
                  </label>
                  <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-md border font-mono">
                    {data.code}
                  </p>
                </div>
              </div>

              {/* Additional Info Cards */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <p className="text-xs text-blue-600 font-medium mb-1">
                    Room ID
                  </p>
                  <p className="text-sm text-gray-700 font-mono truncate">
                    {data.id}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <p className="text-xs text-purple-600 font-medium mb-1">
                    Created
                  </p>
                  <p className="text-sm text-gray-700">
                    {new Date().toLocaleDateString()}{" "}
                    {/* Replace with actual creation date if available */}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <p className="text-xs text-green-600 font-medium mb-1">
                    Status
                  </p>
                  <p className="text-sm text-gray-700">
                    <span
                      className={`inline-flex items-center gap-1 ${
                        data.status === 1 ? "text-green-600" : "text-gray-500"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          data.status === 1 ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      {data.status === 1 ? "Active and receiving" : "Inactive"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="manage" className="mt-0">
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            {/* Manage Header */}
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-500" />
                Room Management
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Manage room settings, activation status, and removal
              </p>
            </div>

            {/* Manage Content */}
            <div className="p-6">
              <ManageRoom
                id={data.id}
                userId={userId as string}
                lineId={lineId as string}
                token={token as string}
                status={data.status}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoomDetails;
