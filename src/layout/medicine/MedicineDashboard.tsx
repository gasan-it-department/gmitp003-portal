import { useQuery } from "@tanstack/react-query";
import { medicineOverview } from "@/db/statements/medicine";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card";
import {
  Package,
  Pill,
  CalendarClock,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
//
import type { MedicineOverviewProps } from "@/interface/data";

interface Props {
  token: string;
  lineId: string;
}

const MedicineDashboard = ({ token, lineId }: Props) => {
  const { data, isFetching, error, refetch } = useQuery<MedicineOverviewProps>({
    enabled: !!token && !!lineId,
    queryKey: ["medicine-overview", lineId],
    queryFn: () => medicineOverview(token, lineId),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  // Loading State
  if (isFetching) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
        <div className="p-3 sm:p-4">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div>
                <Skeleton className="h-5 w-36 mb-1" />
                <Skeleton className="h-2.5 w-48" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border rounded-lg p-2 sm:p-3">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-6 rounded-md" />
                </div>
                <Skeleton className="h-6 w-12 mb-1" />
                <Skeleton className="h-2.5 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !data) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
        <div className="p-3 sm:p-4">
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <div className="w-12 h-12 mb-3 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Failed to Load Dashboard
            </h3>
            <p className="text-xs text-gray-500 mb-3 max-w-md">
              Unable to load medicine overview data.
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
      </div>
    );
  }

  return (
    <div className="w-full h-auto bg-gradient-to-br from-gray-50 to-gray-100">
      <Separator />
      <div className="p-3 sm:p-4">
        {/* Header Section - Compact */}
        <div className="mb-3">
          <h1 className="text-base font-bold text-gray-900">
            Medicine Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Overview of pharmaceutical inventory
          </p>
        </div>

        {/* Stats Grid - 2 columns on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {/* Storage Card - Clickable */}
          <div
            className="border rounded-lg p-2 sm:p-3 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer hover:border-blue-300"
            onClick={() => (window.location.href = `/medicine/storage`)}
          >
            <div className="h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mb-2" />
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-gray-600">Storage</p>
              <div className="p-1 rounded-md bg-gradient-to-br from-blue-500 to-blue-600">
                <Package className="h-3 w-3 text-white" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {data.storage || 0}
            </p>
            <p className="text-[10px] text-gray-400">Active locations</p>
          </div>

          {/* Medicine Card - Clickable */}
          <div
            className="border rounded-lg p-2 sm:p-3 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer hover:border-green-300"
            onClick={() => (window.location.href = `/medicine/medicines`)}
          >
            <div className="h-0.5 bg-gradient-to-r from-green-500 to-green-600 rounded-full mb-2" />
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-gray-600">Inventory</p>
              <div className="p-1 rounded-md bg-gradient-to-br from-green-500 to-green-600">
                <Pill className="h-3 w-3 text-white" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {data.medicines?.total || 0}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-2.5 w-2.5 text-amber-500" />
              <p className="text-[10px] text-gray-400">
                {data.medicines?.lowStock || 0} low stock
              </p>
            </div>
          </div>

          {/* Expiring Soon Card - Clickable */}
          <div
            className="border rounded-lg p-2 sm:p-3 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer hover:border-amber-300"
            onClick={() => (window.location.href = `/medicine/expiring`)}
          >
            <div className="h-0.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full mb-2" />
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-gray-600">Expiring Soon</p>
              <div className="p-1 rounded-md bg-gradient-to-br from-amber-500 to-amber-600">
                <CalendarClock className="h-3 w-3 text-white" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {data.nearExpiration || 0}
            </p>
            <p className="text-[10px] text-gray-400">Within 6 months</p>
          </div>

          {/* Expired Card - Clickable */}
          <div
            className="border rounded-lg p-2 sm:p-3 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer hover:border-red-300"
            onClick={() => (window.location.href = `/medicine/expired`)}
          >
            <div className="h-0.5 bg-gradient-to-r from-red-500 to-red-600 rounded-full mb-2" />
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-gray-600">Expired</p>
              <div className="p-1 rounded-md bg-gradient-to-br from-red-500 to-red-600">
                <CalendarClock className="h-3 w-3 text-white" />
              </div>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {data.expired || 0}
            </p>
            <p className="text-[10px] text-gray-400">Past expiration</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicineDashboard;
