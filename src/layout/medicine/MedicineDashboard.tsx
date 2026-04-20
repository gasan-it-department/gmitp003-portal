import { useQuery } from "@tanstack/react-query";
import { medicineOverview } from "@/db/statements/medicine";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  });

  // Loading State
  if (isFetching) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
        <div className="p-4">
          {/* Header Skeleton */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div>
                <Skeleton className="h-6 w-48 mb-1" />
                <Skeleton className="h-3 w-64" />
              </div>
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border shadow-sm overflow-hidden">
                <div className="h-1 bg-gray-200" />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-7 w-7 rounded-md" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-24" />
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
                      <Skeleton className="h-3 w-3 rounded-full" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                </CardContent>
              </Card>
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
        <div className="p-4">
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Failed to Load Dashboard
            </h3>
            <p className="text-sm text-gray-500 mb-4 max-w-md">
              Unable to load medicine overview data. Please check your
              connection and try again.
            </p>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success State
  return (
    <div className="w-full h-auto bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
      <Separator />
      <div className="p-4">
        {/* Header Section */}
        <div className="mb-6 flex justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Medicine Dashboard
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Overview of pharmaceutical inventory and storage
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Storage Card */}
          <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Storage Locations
                </CardTitle>
                <div className="p-1.5 rounded-md bg-gradient-to-br from-blue-500 to-blue-600">
                  <Package className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">
                  {data.storage || 0}
                </p>
                <CardDescription className="text-xs">
                  Active storage areas
                </CardDescription>
              </div>
            </CardContent>
          </Card>

          {/* Medicine Card */}
          <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-green-500 to-green-600" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Medicine Inventory
                </CardTitle>
                <div className="p-1.5 rounded-md bg-gradient-to-br from-green-500 to-green-600">
                  <Pill className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">
                  {data.medicines.total || 0}
                </p>
                <CardDescription className="text-xs">
                  Total medicine items
                </CardDescription>
                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
                  <TrendingUp className="h-3 w-3 text-amber-500" />
                  <p className="text-xs text-gray-500">
                    {data.medicines.lowStock || 0} low stock items
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expiring Card */}
          <Card
            className="border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
            onClick={() => {}}
          >
            <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-600" />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Expiring Soon
                </CardTitle>
                <div className="p-1.5 rounded-md bg-gradient-to-br from-amber-500 to-amber-600">
                  <CalendarClock className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">
                  {data.nearExpiration || 0}
                </p>
                <CardDescription className="text-xs">
                  Within 6 months
                </CardDescription>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MedicineDashboard;
