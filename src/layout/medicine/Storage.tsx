import { useAuth } from "@/provider/ProtectedRoute";
import { useQuery } from "@tanstack/react-query";
import { storageData } from "@/db/statements/storage";
import { useParams } from "react-router";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import StorageMedList from "./StorageMedList";
import {
  ArrowLeftRight,
  ListCheck,
  Info,
  Package,
  Calendar,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/utils/date";
import { Button } from "@/components/ui/button";
import MedicineInfo from "./MedicineInfo";
//
import type { MedicineStorage } from "@/interface/data";

const Storage = () => {
  const { storageId, lineId } = useParams();
  const auth = useAuth();

  const { data, isFetching, error, refetch } = useQuery<MedicineStorage>({
    queryKey: ["storage", storageId],
    queryFn: () => storageData(auth.token as string, storageId as string),
    enabled: !!auth.token && !!storageId,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  // Loading State
  if (isFetching) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
        <div className="px-3 sm:px-4 py-3">
          {/* Header Skeleton */}
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div>
                <Skeleton className="h-4 w-40 mb-1" />
                <Skeleton className="h-2.5 w-24" />
              </div>
            </div>
          </div>

          {/* Tabs Section Skeleton */}
          <div className="border rounded-lg overflow-hidden">
            <div className="border-b bg-gray-50/50 px-3 pt-1.5">
              <div className="flex gap-1">
                <Skeleton className="h-7 w-20 rounded-md" />
                <Skeleton className="h-7 w-20 rounded-md" />
              </div>
            </div>
            <div className="p-3">
              <div className="space-y-2">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-3">
          <div className="w-12 h-12 mb-3 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Failed to Load Storage
          </h3>
          <p className="text-xs text-gray-500 mb-3 max-w-md">
            Unable to load storage details. Please check your connection.
          </p>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // No Data State
  if (!data) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-3">
          <div className="w-12 h-12 mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <Package className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Storage Not Found
          </h3>
          <p className="text-xs text-gray-500">
            The requested storage location could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
      <div className="px-3 sm:px-4 py-3">
        {/* Header Section - Compact */}
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md shadow-sm">
              <Package className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 truncate max-w-[200px] sm:max-w-none">
                {data.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Calendar className="h-2.5 w-2.5 text-gray-400" />
                <p className="text-[10px] text-gray-500">
                  Created: {formatDate(data.timestamp)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section - No Card */}
        <div className="border rounded-lg overflow-hidden bg-white">
          <Tabs defaultValue="list" className="w-full">
            <div className="border-b bg-gray-50/50 px-3 pt-1.5">
              <TabsList className="h-8 bg-transparent gap-0.5">
                <TabsTrigger
                  value="list"
                  className="h-7 px-2.5 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent rounded-none text-xs text-gray-600 hover:text-gray-900 transition-colors gap-1"
                >
                  <ListCheck className="h-3 w-3" />
                  Medicine List
                </TabsTrigger>
                <TabsTrigger
                  value="info"
                  className="h-7 px-2.5 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent rounded-none text-xs text-gray-600 hover:text-gray-900 transition-colors gap-1"
                >
                  <Info className="h-3 w-3" />
                  Information
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-0">
              <TabsContent
                value="list"
                className="m-0 p-0 focus-visible:outline-none"
              >
                <StorageMedList
                  auth={auth}
                  storageId={storageId}
                  lineId={lineId as string}
                />
              </TabsContent>

              <TabsContent
                value="transactions"
                className="m-0 p-3 focus-visible:outline-none"
              >
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                    <ArrowLeftRight className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-0.5">
                    No Transactions Yet
                  </h3>
                  <p className="text-xs text-gray-500">
                    Transaction history will appear here
                  </p>
                </div>
              </TabsContent>

              <TabsContent
                value="info"
                className="m-0 p-0 focus-visible:outline-none"
              >
                <MedicineInfo
                  item={data}
                  lineId={lineId as string}
                  userId={auth.userId as string}
                  token={auth.token as string}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Storage;
