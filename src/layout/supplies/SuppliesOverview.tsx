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
  Download,
  RefreshCw,
} from "lucide-react";
//
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  });

  const handleRefresh = () => {
    // Implement refresh logic here
    console.log("Refreshing data...");
  };

  const handleExport = () => {
    console.log("Exporting data...");
  };

  if (isFetching && !data) {
    return (
      <div className="w-full h-full flex flex-col space-y-6 p-4">
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search Bar Skeleton */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <Skeleton className="h-10 w-full max-w-lg" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* List Skeleton */}
        <div className="flex-1 min-h-0">
          <Card className="h-full shadow-sm border">
            <CardContent className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card className="h-full border-destructive/20 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold text-destructive mb-2">
            Failed to load supplies data
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            There was an error loading the supplies overview. Please try again.
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (!data) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold text-muted-foreground mb-2">
            No supplies data
          </h3>
          <p className="text-sm text-muted-foreground text-center">
            There are no supplies to display for this list.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full h-full flex flex-col space-y-6">
      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{data.total}</p>
              </div>
              <div className={`p-2 rounded-lg bg-blue-50`}>
                <Package className={`w-5 h-5 text-blue-600`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.lowStock}
                </p>
              </div>
              <div className={`p-2 rounded-lg bg-red-50`}>
                <AlertCircle className={`w-5 h-5 text-purple-600`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{data.order}</p>
              </div>
              <div className={`p-2 rounded-lg bg-purple-50`}>
                <TrendingUp className={`w-5 h-5 text-red-600`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions Section */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="relative max-w-lg">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="pl-10 h-10 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Search items by name, SKU, or description..."
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2"
                onClick={handleExport}
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Supplies List</h2>
          <p className="text-sm text-gray-500 mt-1">
            Showing all items in the current list
            {listId && (
              <Badge variant="outline" className="ml-2">
                List ID: {listId}
              </Badge>
            )}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {query && (
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Searching for: "{query}"
            </span>
          )}
        </div>
      </div>

      <Separator />

      {/* Supplies List - Takes remaining space */}
      <div className="flex-1 min-h-0">
        <Card className="h-full shadow-sm border">
          <CardContent className="p-0 h-full">
            <div className="h-full">
              <SupplyOverviewList query={query} listId={listId} auth={auth} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Notes */}
      <div className="text-sm text-gray-500">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>In Stock</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            <span>Low Stock</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Out of Stock</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>On Order</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuppliesOverview;
