import { useAuth } from "@/provider/ProtectedRoute";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router";

import { storageData } from "@/db/statements/storage";
import { formatDate } from "@/utils/date";

import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import StorageMedList from "./StorageMedList";
import MedicineInfo from "./MedicineInfo";

import {
  ListCheck,
  Info,
  Package,
  Calendar,
  AlertCircle,
  RefreshCw,
  Loader2,
  ArrowLeft,
  Hash,
} from "lucide-react";

import type { MedicineStorage } from "@/interface/data";

const Storage = () => {
  const { storageId, lineId } = useParams();
  const auth = useAuth();
  const nav = useNavigate();

  const { data, isFetching, error, refetch } = useQuery<MedicineStorage>({
    queryKey: ["storage", storageId],
    queryFn: () => storageData(auth.token as string, storageId as string),
    enabled: !!auth.token && !!storageId,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  // ── Loading ────────────────────────────────────────────────────────
  if (isFetching && !data) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-1.5 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-xs">Loading storage...</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-3">
        <div className="border rounded-lg bg-white p-6 text-center max-w-sm w-full">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <h3 className="text-xs font-semibold text-gray-900 mb-1">
            Failed to Load Storage
          </h3>
          <p className="text-[10px] text-gray-500 mb-3">
            Check your connection and try again.
          </p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="h-7 text-[10px] gap-1.5"
          >
            <RefreshCw className="h-3 w-3" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────
  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-3">
        <div className="border rounded-lg bg-white p-6 text-center max-w-sm w-full">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
            <Package className="h-5 w-5 text-gray-400" />
          </div>
          <h3 className="text-xs font-semibold text-gray-900 mb-1">
            Storage Not Found
          </h3>
          <p className="text-[10px] text-gray-500 mb-3">
            The requested storage location doesn't exist.
          </p>
          <Button
            onClick={() => nav(-1)}
            variant="outline"
            size="sm"
            className="h-7 text-[10px] gap-1.5"
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

      {/* Header strip */}
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
              <Package className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-semibold text-gray-900 truncate">
                {data.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-500">
                <Hash className="h-2.5 w-2.5" />
                <span className="font-mono truncate">{data.refNumber}</span>
                <span className="text-gray-300">·</span>
                <Calendar className="h-2.5 w-2.5" />
                <span>{formatDate(data.timestamp)}</span>
              </div>
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200 flex-shrink-0"
          >
            Active
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 min-h-0 overflow-hidden p-3">
        <div className="h-full border rounded-lg bg-white overflow-hidden flex flex-col">
          <Tabs defaultValue="list" className="w-full h-full flex flex-col">
            <div className="border-b bg-gray-50 px-2 pt-1 flex-shrink-0">
              <TabsList className="h-7 bg-transparent gap-0.5 p-0">
                <TabsTrigger
                  value="list"
                  className="h-6 px-2 text-[10px] gap-1 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent rounded-none text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ListCheck className="h-3 w-3" />
                  Medicine List
                </TabsTrigger>
                <TabsTrigger
                  value="info"
                  className="h-6 px-2 text-[10px] gap-1 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent rounded-none text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Info className="h-3 w-3" />
                  Information
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="list"
              className="flex-1 min-h-0 m-0 p-0 focus-visible:outline-none overflow-auto"
            >
              <StorageMedList
                auth={auth}
                storageId={storageId}
                lineId={lineId as string}
              />
            </TabsContent>

            <TabsContent
              value="info"
              className="flex-1 min-h-0 m-0 p-0 focus-visible:outline-none overflow-auto"
            >
              <MedicineInfo
                item={data}
                lineId={lineId as string}
                userId={auth.userId as string}
                token={auth.token as string}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Storage;
