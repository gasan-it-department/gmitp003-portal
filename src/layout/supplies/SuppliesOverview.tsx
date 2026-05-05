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
// import {
//   InputGroup,
//   InputGroupInput,
//   InputGroupAddon,
// } from "@/components/ui/input-group";
// import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
//import { Card, CardContent } from "@/components/ui/card";
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
      <div className="w-full h-full flex flex-col space-y-4 sm:space-y-6 p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
                  <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
                </div>
                <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        <div className="border rounded-lg p-3 sm:p-4 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
            <Skeleton className="h-9 sm:h-10 w-full max-w-lg" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 sm:h-9 w-16 sm:w-20" />
              <Skeleton className="h-8 sm:h-9 w-16 sm:w-20" />
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <div className="h-full border rounded-lg p-3 sm:p-4">
            <div className="space-y-3 sm:space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Skeleton className="h-3 sm:h-4 w-32 sm:w-48" />
                    <Skeleton className="h-2.5 sm:h-3 w-24 sm:w-32" />
                  </div>
                  <Skeleton className="h-5 sm:h-6 w-12 sm:w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-full border border-destructive/20 bg-destructive/5 rounded-lg">
        <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
          <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-destructive mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-destructive mb-1.5 sm:mb-2">
            Failed to load supplies data
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground text-center mb-3 sm:mb-4 max-w-sm">
            There was an error loading the supplies overview. Please try again.
          </p>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-full border rounded-lg">
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
          <Package className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/50 mb-3 sm:mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-muted-foreground mb-1 sm:mb-2">
            No supplies data
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            There are no supplies to display for this list.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col space-y-4 sm:space-y-6  p-3 sm:p-4">
      {/* Stats Overview Cards - Mobile responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Items Card */}
        <div className="border rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1">
                Total Items
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {data.total}
              </p>
            </div>
            <div className="p-1.5 sm:p-2 rounded-lg bg-blue-50">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Low Stock Card */}
        <div className="border rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1">
                Low Stock
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {data.lowStock}
              </p>
            </div>
            <div className="p-1.5 sm:p-2 rounded-lg bg-red-50">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            </div>
          </div>
        </div>

        {/* Pending Orders Card */}
        <div className="border rounded-lg p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1">
                Pending Orders
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {data.order}
              </p>
            </div>
            <div className="p-1.5 sm:p-2 rounded-lg bg-purple-50">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Info Section */}
      <div className="space-y-3 sm:space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Search items by name, SKU, or description..."
          />
        </div>

        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Supplies List
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-xs sm:text-sm text-gray-500">
              Showing all items in the current list
            </p>
            {listId && (
              <Badge variant="outline" className="text-[10px] sm:text-xs">
                List ID: {listId.slice(0, 8)}...
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Supplies List - Takes remaining space */}
      <div className="flex-1">
        <div className="h-full border rounded-lg overflow-auto">
          <SupplyOverviewList query={query} listId={listId} auth={auth} />
        </div>
      </div>

      {/* Footer Notes - Mobile responsive */}
      <div className="text-xs sm:text-sm text-gray-500">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>In Stock</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Low Stock</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuppliesOverview;
