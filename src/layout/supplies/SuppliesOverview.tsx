import { useState } from "react";
import { useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import { useDebounce } from "use-debounce";
import { useQuery } from "@tanstack/react-query";

//
import { supplyStats } from "@/db/statement";
//
import {
  Package,
  Search,
  AlertCircle,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
//
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import SupplyOverviewList from "./SupplyOverviewList";
import { Skeleton } from "@/components/ui/skeleton";

//interfce
interface ListProps {
  total: number;
  lowStock: number;
  order: number;
}

const SuppliesOverview = () => {
  const { listId } = useParams();
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 500);
  const auth = useAuth();

  const { data, isFetching, isError } = useQuery<ListProps>({
    queryKey: [listId, "supply-stats"],
    queryFn: () => supplyStats(auth.token as string, listId as string),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const handleRefresh = () => {
    console.log("Refreshing data...");
  };

  if (isFetching && !data) {
    return (
      <div className="w-full h-full flex flex-col space-y-3 p-3 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-3 bg-white">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-2.5 w-16" />
                  <Skeleton className="h-6 w-12" />
                </div>
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
        <div className="border rounded-lg p-3 bg-white">
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="border rounded-lg bg-white p-3 space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-2 w-24" />
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="border rounded-lg p-6 text-center bg-white max-w-md mx-auto">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            Failed to load supplies data
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            There was an error loading the supplies overview.
          </p>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="border rounded-lg p-6 text-center bg-white max-w-md mx-auto">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700 mb-1">
            No supplies data
          </h3>
          <p className="text-sm text-gray-500">
            No supplies to display for this list.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col space-y-3 p-3 bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Stats Overview Cards - Compact */}
      <div className="grid grid-cols-3 gap-3">
        {/* Total Items Card */}
        <div className="border rounded-lg p-2 bg-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Total</p>
              <p className="text-lg font-bold text-gray-900">{data.total}</p>
            </div>
            <div className="p-1 rounded-md bg-blue-50">
              <Package className="w-3.5 h-3.5 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Low Stock Card */}
        <div className="border rounded-lg p-2 bg-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Low Stock</p>
              <p className="text-lg font-bold text-gray-900">{data.lowStock}</p>
            </div>
            <div className="p-1 rounded-md bg-red-50">
              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            </div>
          </div>
        </div>

        {/* Pending Orders Card */}
        <div className="border rounded-lg p-2 bg-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Orders</p>
              <p className="text-lg font-bold text-gray-900">{data.order}</p>
            </div>
            <div className="p-1 rounded-md bg-purple-50">
              <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search Section - Compact */}
      <div className="border rounded-lg bg-white p-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Search items by name, SKU, or description..."
          />
        </div>
      </div>

      {/* Title Section - Compact */}
      <div>
        <h2 className="text-sm font-semibold text-gray-800">Supplies List</h2>
        <div className="flex flex-wrap items-center gap-2 mt-0.5">
          <p className="text-xs text-gray-500">Showing all items</p>
          {listId && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              ID: {listId.slice(0, 8)}...
            </Badge>
          )}
        </div>
      </div>

      <Separator className="my-0" />

      {/* Supplies List - Takes remaining space */}
      <div className="flex-1 min-h-0">
        <div className="h-full border rounded-lg bg-white overflow-hidden">
          <SupplyOverviewList query={query} listId={listId} auth={auth} />
        </div>
      </div>

      {/* Footer Notes - Compact */}
      <div className="flex items-center gap-3 text-[10px] text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
          <span>In Stock</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
          <span>Low Stock</span>
        </div>
      </div>
    </div>
  );
};

export default SuppliesOverview;
