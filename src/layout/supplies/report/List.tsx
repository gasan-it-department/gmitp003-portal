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

import Modal from "@/components/custom/Modal";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
//icons
import {
  Tally5,
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

//statements
import { supplyList } from "@/db/statement";
import type { ProtectedRouteProps, SuppliesProps } from "@/interface/data";

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
    list: SuppliesProps[];
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
        trend,
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    enabled: !!id || !!auth.token,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const handleChangeParams = (key: string, value: string) => {
    setParams(
      (prev) => {
        prev.set(key, value);
        return prev;
      },
      {
        replace: true,
      },
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
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section - Compact */}
      <div className="border-b bg-white p-3 space-y-2">
        {hasSearchQuery && (
          <div>
            <Badge variant="secondary" className="text-[10px]">
              Search: "{query}"
            </Badge>
          </div>
        )}

        {/* Controls Section */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              className="pl-8 h-8 text-xs bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
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
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                onClick={() => handleChangeParams("query", "")}
              >
                ×
              </Button>
            )}
          </div>

          {/* Refresh Button */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Table Section - Scrollable */}
      <div className="flex-1 overflow-auto p-3">
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="min-w-[600px]">
            <Table>
              <TableHeader className="bg-gray-50 sticky top-0 z-10">
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="w-12 p-2 text-xs font-semibold text-gray-600">
                    <div className="flex items-center gap-1">
                      <Tally5 className="h-3 w-3" />
                      No.
                    </div>
                  </TableHead>
                  <TableHead className="p-2 text-xs font-semibold text-gray-600 min-w-[180px]">
                    <div className="flex items-center gap-1">
                      <PencilLine className="h-3 w-3" />
                      Item Name
                    </div>
                  </TableHead>
                  <TableHead className="p-2 text-xs font-semibold text-gray-600 text-center w-24">
                    <div className="flex items-center justify-center gap-1">
                      <Tally5 className="h-3 w-3" />
                      Stock
                    </div>
                  </TableHead>
                  <TableHead className="p-2 text-xs font-semibold text-gray-600 w-24">
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
                    <TableRow key={i}>
                      <TableCell className="p-2">
                        <Skeleton className="h-3 w-6" />
                      </TableCell>
                      <TableCell className="p-2">
                        <Skeleton className="h-3 w-40" />
                      </TableCell>
                      <TableCell className="p-2">
                        <Skeleton className="h-3 w-16" />
                      </TableCell>
                      <TableCell className="p-2">
                        <Skeleton className="h-5 w-20" />
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
                    <TableCell colSpan={4} className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="p-3 bg-gray-100 rounded-full mb-3">
                          {hasSearchQuery ? (
                            <Search className="h-6 w-6 text-gray-400" />
                          ) : (
                            <AlertTriangle className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">
                          {hasSearchQuery
                            ? "No results found"
                            : "No items available"}
                        </h3>
                        <p className="text-xs text-gray-500 max-w-sm">
                          {hasSearchQuery
                            ? `No items match "${query}". Try a different search term.`
                            : "Start by adding items to your inventory."}
                        </p>
                        {hasSearchQuery && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 text-xs h-7"
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
                  <TableCell colSpan={4} className="p-2">
                    <div className="py-2 text-center">
                      {isFetchingNextPage ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span className="text-xs text-gray-500">
                            Loading more...
                          </span>
                        </div>
                      ) : !hasNextPage && totalItems > 0 ? (
                        <span className="text-xs text-gray-400">
                          All {totalItems} items loaded
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Footer Stats - Compact */}
      <div className="border-t bg-white p-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-gray-500">
              Total:{" "}
              <span className="font-semibold text-gray-700">{totalItems}</span>
            </span>
            {hasSearchQuery && (
              <span className="text-gray-500">
                Search: <span className="font-medium">"{query}"</span>
              </span>
            )}
          </div>
          {isFetching && (
            <div className="flex items-center gap-1 text-gray-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Updating...</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        title="Low Stock Alerts"
        onOpen={onOpen === 1}
        className="max-w-md"
        setOnOpen={() => setOnOpen(0)}
      >
        <div className="space-y-3 p-1">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div>
                <h3 className="text-xs font-medium text-amber-800">
                  Low Stock Items
                </h3>
                <p className="text-[10px] text-amber-700 mt-0.5">
                  Items that are running low and need restocking
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center py-3">
            Alert functionality will be implemented soon
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default List;
