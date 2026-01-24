//layout and components
import {
  Table,
  TableBody,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ListItem from "../items/ListItem";

// import {
//   Select,
//   SelectItem,
//   SelectContent,
//   SelectTrigger,
// } from "@/components/ui/select";
import Modal from "@/components/custom/Modal";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
//icons
import {
  // TrendingUp,
  Tally5,
  ScanBarcode,
  ChartLine,
  PencilLine,
  Search,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from "lucide-react";

//hooks
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { useInView } from "react-intersection-observer";

//icons
//statements
import { supplyList } from "@/db/statement";
import type { ProtectedRouteProps, SupplyStockTrack } from "@/interface/data";

//interface and Props
interface Props {
  id: string | undefined;
  auth: ProtectedRouteProps;
  lineId: string;
  listId: string;
  containerId: string;
}

const List = ({ id, auth, containerId, lineId, listId }: Props) => {
  const [onOpen, setOnOpen] = useState(0);
  const [params, setParams] = useSearchParams({ query: "", trend: "Current" });
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  const trend = params.get("trend") || "Current";
  const currentQuery = params.get("query") || "";
  const [query] = useDebounce(currentQuery, 1000);

  const {
    data,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    hasNextPage,
    isFetching,
  } = useInfiniteQuery<{
    list: SupplyStockTrack[];
    lastCursor: string | null;
    hasMore: boolean;
  }>({
    queryKey: ["supply-list", id],
    queryFn: ({ pageParam }) =>
      supplyList(
        auth.token as string,
        id as string,
        pageParam as string | null,
        "20",
        currentQuery,
        trend
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    enabled: !!id || !!auth.token,
  });

  const handleChangeParams = (key: string, value: string) => {
    setParams(
      (prev) => {
        prev.set(key, value);
        return prev;
      },
      {
        replace: true,
      }
    );
  };

  useEffect(() => {
    refetch();
  }, [query, trend]);

  // Infinite scroll effect
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage().catch((error) => {
        console.error("Error fetching next page:", error);
      });
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Calculate total items
  const allItems = data?.pages.flatMap((page) => page.list) || [];
  const totalItems = allItems.length;
  const hasSearchQuery = query.length > 0;

  return (
    <div className="w-full h-full flex flex-col bg-gray-50/30">
      {/* Header Section */}
      <div className="p-4 border-b bg-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Supply Inventory
            </h2>
            <p className="text-sm text-gray-500">
              Manage and track your supply stock levels
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {totalItems} items
            </Badge>
            {hasSearchQuery && (
              <Badge variant="secondary" className="text-xs">
                Search: "{query}"
              </Badge>
            )}
          </div>
        </div>

        {/* Controls Section */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Search by item name, reference number, or brand..."
              onChange={(e) => {
                handleChangeParams("query", e.target.value);
              }}
              value={currentQuery}
            />
            {hasSearchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => handleChangeParams("query", "")}
              >
                ×
              </Button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>

            {/* <Select
              value={trend}
              onValueChange={(e) => handleChangeParams("trend", e)}
            >
              <SelectTrigger className="w-40 h-9">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="truncate">{trend} Trend</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Current">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Current
                  </div>
                </SelectItem>
                <SelectItem value="Quarter">
                  <div className="flex items-center gap-2">
                    <ChartLine className="h-4 w-4" />
                    Quarterly
                  </div>
                </SelectItem>
                <SelectItem value="1st-half">
                  <div className="flex items-center gap-2">
                    <ChartLine className="h-4 w-4" />
                    1st Half
                  </div>
                </SelectItem>
                <SelectItem value="2nd-half">
                  <div className="flex items-center gap-2">
                    <ChartLine className="h-4 w-4" />
                    2nd Half
                  </div>
                </SelectItem>
                <SelectItem value="Annual">
                  <div className="flex items-center gap-2">
                    <ChartLine className="h-4 w-4" />
                    Annually
                  </div>
                </SelectItem>
              </SelectContent>
            </Select> */}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="relative">
            <Table>
              <TableHeader className="sticky top-0 bg-gray-50 z-10">
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="w-16 text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">
                    <div className="flex items-center gap-1">
                      <Tally5 className="h-3 w-3" />
                      No.
                    </div>
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">
                    <div className="flex items-center gap-1">
                      <ScanBarcode className="h-3 w-3" />
                      Reference
                    </div>
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">
                    <div className="flex items-center gap-1">
                      <PencilLine className="h-3 w-3" />
                      Item Name
                    </div>
                  </TableHead>

                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">
                    <div className="flex items-center gap-1">
                      <Tally5 className="h-3 w-3" />
                      Stock Level
                    </div>
                  </TableHead>
                  {/* <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Trend Analysis
                    </div>
                  </TableHead> */}
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <ChartLine className="h-3 w-3" />
                      Status
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Loading state for initial load */}
                {isFetching &&
                  !data &&
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i} className="hover:bg-transparent">
                      <TableCell className="border-r">
                        <Skeleton className="h-4 w-6" />
                      </TableCell>
                      <TableCell className="border-r">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="border-r">
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell className="border-r">
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="border-r">
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell className="border-r">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20" />
                      </TableCell>
                    </TableRow>
                  ))}

                {/* Data rows */}
                {allItems.length > 0 ? (
                  allItems.map((item, i) => (
                    <ListItem
                      index={i + 1}
                      item={item}
                      query={currentQuery}
                      key={item.id}
                      containerId={containerId as string}
                      lineId={lineId as string}
                      listId={listId as string}
                      auth={auth}
                    />
                  ))
                ) : !isFetching ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center h-full py-12">
                        <div className="p-4 bg-gray-100 rounded-full mb-4">
                          {hasSearchQuery ? (
                            <Search className="h-8 w-8 text-gray-400" />
                          ) : (
                            <AlertTriangle className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <h3 className="text-lg font-medium text-gray-700 mb-2">
                          {hasSearchQuery
                            ? "No results found"
                            : "No items available"}
                        </h3>
                        <p className="text-sm text-gray-500 max-w-sm">
                          {hasSearchQuery
                            ? `No items match "${query}". Try a different search term.`
                            : "Start by adding items to your inventory."}
                        </p>
                        {hasSearchQuery && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() => handleChangeParams("query", "")}
                          >
                            Clear search
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null}

                {/* Infinite scroll trigger */}
                <TableRow ref={ref}>
                  <TableCell colSpan={7} className="border-t">
                    <div className="py-6 text-center">
                      {isFetchingNextPage ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-gray-600">
                            Loading more items...
                          </span>
                        </div>
                      ) : !hasNextPage && totalItems > 0 ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border">
                          <Tally5 className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            All {totalItems} items loaded
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t bg-white">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              Total Items: <span className="font-semibold">{totalItems}</span>
            </span>
            {hasSearchQuery && (
              <span className="text-gray-600">
                Searching: <span className="font-medium">"{query}"</span>
              </span>
            )}
            <span className="text-gray-600">
              View: <span className="font-medium">{trend} Trend</span>
            </span>
          </div>
          {isFetching && (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Updating...</span>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal
        title="Low Stock Alerts"
        onOpen={onOpen === 1}
        className="max-w-lg"
        setOnOpen={() => setOnOpen(0)}
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-800">Low Stock Items</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Items that are running low and need restocking
                </p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 text-center py-4">
            Alert functionality will be implemented soon
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default List;
