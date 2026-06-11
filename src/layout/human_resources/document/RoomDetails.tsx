import { useParams, useSearchParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/provider/ProtectedRoute";
import { room } from "@/db/statements/document";
import { formatDate } from "@/utils/date";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import ManageRoom from "./ManageRoom";

import {
  Settings,
  Info,
  Building2,
  Hash,
  Loader2,
  ArrowLeft,
  Calendar,
  Users,
  MapPin,
  AlertCircle,
} from "lucide-react";

import type { ReceivingRoom } from "@/interface/data";

const RoomDetails = () => {
  const [searchParams, setSearchParams] = useSearchParams({ roomTab: "info" });
  const { roomId, lineId } = useParams();
  const { token, userId } = useAuth();
  const nav = useNavigate();
  const currentRoomTab = searchParams.get("roomTab") || "info";

  const { data, isFetching, isError, error } = useQuery<ReceivingRoom>({
    queryKey: ["room", roomId],
    queryFn: () => room(token as string, roomId as string),
    enabled: !!token && !!roomId,
    refetchOnWindowFocus: false,
  });

  const handleTab = (key: string, value: string) =>
    setSearchParams(
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
          <p className="text-xs">Loading room...</p>
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
            Room not found
          </h3>
          <p className="text-[10px] text-gray-500 mb-3">
            {(error as any)?.message ??
              "This room may have been removed or you don't have access."}
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

  const isActive = data.status === 1;
  const userCount = data._count?.authorizedUser ?? data.authorizedUser?.length ?? 0;

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
                {data.address ?? "Receiving Room"}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-500">
                <Hash className="h-2.5 w-2.5" />
                <span className="font-mono truncate">{data.code}</span>
                {data.timestamp && (
                  <>
                    <span className="text-gray-300">·</span>
                    <Calendar className="h-2.5 w-2.5" />
                    <span>{formatDate(data.timestamp)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${
              isActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-gray-50 text-gray-600 border-gray-200"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={currentRoomTab}
        onValueChange={(e) => handleTab("roomTab", e)}
        className="flex-1 min-h-0 flex flex-col"
      >
        <div className="bg-white border-b px-3 py-1.5 flex-shrink-0">
          <TabsList className="h-7 p-0.5 bg-gray-100">
            <TabsTrigger
              value="info"
              className="h-6 px-2 text-[10px] gap-1.5 data-[state=active]:text-blue-700"
            >
              <Info className="h-3 w-3" />
              Information
            </TabsTrigger>
            <TabsTrigger
              value="manage"
              className="h-6 px-2 text-[10px] gap-1.5 data-[state=active]:text-blue-700"
            >
              <Settings className="h-3 w-3" />
              Manage
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="info"
          className="flex-1 min-h-0 m-0 overflow-auto focus-visible:outline-none"
        >
          <div className="p-3 max-w-4xl mx-auto space-y-3">

            {/* Room Information */}
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
                <Info className="h-3 w-3 text-blue-500" />
                <h3 className="text-xs font-semibold text-gray-800">
                  Room Information
                </h3>
              </div>
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Field
                  icon={<MapPin className="h-2.5 w-2.5" />}
                  label="Address"
                  value={data.address ?? "—"}
                />
                <Field
                  icon={<Hash className="h-2.5 w-2.5" />}
                  label="Code"
                  value={
                    <code className="font-mono text-[11px]">{data.code}</code>
                  }
                />
                <Field
                  label="Room ID"
                  value={
                    <span className="font-mono text-[10px] break-all">
                      {data.id}
                    </span>
                  }
                />
                <Field
                  icon={<Calendar className="h-2.5 w-2.5" />}
                  label="Created"
                  value={data.timestamp ? formatDate(data.timestamp) : "—"}
                />
              </div>
            </div>

            {/* Authorized Users */}
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Users className="h-3 w-3 text-blue-500" />
                  <h3 className="text-xs font-semibold text-gray-800">
                    Authorized Users
                  </h3>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0"
                >
                  {userCount}
                </Badge>
              </div>
              <div className="p-3">
                {data.authorizedUser && data.authorizedUser.length > 0 ? (
                  <ul className="divide-y">
                    {data.authorizedUser.map((u) => {
                      const initials =
                        `${u.user?.firstName?.[0] ?? ""}${u.user?.lastName?.[0] ?? ""}`.toUpperCase() ||
                        "U";
                      return (
                        <li
                          key={u.id}
                          className="py-2 flex items-center gap-2"
                        >
                          <Avatar className="h-7 w-7 flex-shrink-0">
                            <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-medium text-gray-900 truncate">
                              {u.user?.firstName} {u.user?.lastName}
                            </p>
                            <p className="text-[10px] text-gray-500 truncate">
                              @{u.user?.username ?? "—"}
                            </p>
                          </div>
                          {typeof (u as any).type === "number" && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {(u as any).type === 1 ? "Primary" : "Secondary"}
                            </Badge>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-[10px] text-gray-400 text-center py-3">
                    No authorized users yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="manage"
          className="flex-1 min-h-0 m-0 overflow-auto focus-visible:outline-none"
        >
          <div className="p-3 max-w-2xl mx-auto">
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
                <Settings className="h-3 w-3 text-blue-500" />
                <div>
                  <h3 className="text-xs font-semibold text-gray-800">
                    Room Management
                  </h3>
                  <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                    Activation, removal, and audit-safe settings
                  </p>
                </div>
              </div>
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

const Field = ({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) => (
  <div>
    <p className="text-[10px] text-gray-500 uppercase tracking-wide flex items-center gap-1">
      {icon}
      {label}
    </p>
    <p className="text-xs text-gray-800 mt-0.5 break-words">{value ?? "—"}</p>
  </div>
);

export default RoomDetails;
