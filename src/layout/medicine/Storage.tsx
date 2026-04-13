import { useAuth } from "@/provider/ProtectedRoute";
import { useQuery } from "@tanstack/react-query";
import { storageData } from "@/db/statements/storage";
import { useParams } from "react-router";
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs";
import StorageMedList from "./StorageMedList";
import { Card, CardContent } from "@/components/ui/card";
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
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Header Skeleton */}
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div>
                <Skeleton className="h-5 w-48 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </div>

          {/* Tabs Section Skeleton */}
          <Card className="border shadow-sm overflow-hidden">
            <div className="border-b bg-gray-50/50 px-4 pt-2">
              <div className="flex gap-1">
                <Skeleton className="h-8 w-24 rounded-md" />
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
            </div>
            <CardContent className="p-4">
              <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4">
          <div className="w-16 h-16 mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            Failed to Load Storage
          </h3>
          <p className="text-sm text-gray-500 mb-4 max-w-md">
            Unable to load storage details. Please check your connection and try
            again.
          </p>
          <Button onClick={() => refetch()} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
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
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4">
          <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            Storage Not Found
          </h3>
          <p className="text-sm text-gray-500">
            The requested storage location could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Header Section - Compact */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{data.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Calendar className="h-3 w-3 text-gray-400" />
                <p className="text-xs text-gray-500">
                  Created: {formatDate(data.timestamp)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Card className="border shadow-sm overflow-hidden">
          <Tabs defaultValue="list" className="w-full">
            <div className="border-b bg-gray-50/50 px-4 pt-2">
              <TabsList className="h-10 bg-transparent gap-1">
                <TabsTrigger
                  value="list"
                  className="h-8 px-3 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent rounded-none text-xs text-gray-600 hover:text-gray-900 transition-colors gap-1.5"
                >
                  <ListCheck className="h-3.5 w-3.5" />
                  Medicine List
                </TabsTrigger>
                <TabsTrigger
                  value="info"
                  className="h-8 px-3 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:bg-transparent rounded-none text-xs text-gray-600 hover:text-gray-900 transition-colors gap-1.5"
                >
                  <Info className="h-3.5 w-3.5" />
                  Information
                </TabsTrigger>
              </TabsList>
            </div>

            <CardContent className="p-0">
              <TabsContent
                value="list"
                className="m-0 p-2 focus-visible:outline-none"
              >
                <StorageMedList
                  auth={auth}
                  storageId={storageId}
                  lineId={lineId as string}
                />
              </TabsContent>

              <TabsContent
                value="transactions"
                className="m-0 p-2 focus-visible:outline-none"
              >
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <ArrowLeftRight className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    No Transactions Yet
                  </h3>
                  <p className="text-sm text-gray-500">
                    Transaction history will appear here
                  </p>
                </div>
              </TabsContent>

              <TabsContent
                value="info"
                className="m-0 p-4 focus-visible:outline-none"
              >
                <MedicineInfo
                  item={data}
                  lineId={lineId as string}
                  userId={auth.userId as string}
                  token={auth.token as string}
                />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Storage;
