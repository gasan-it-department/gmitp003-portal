import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { useParams, useNavigate } from "react-router";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Loader2, Search, FolderOpen, Package, Calendar } from "lucide-react";
//
import { getList } from "@/db/statement";

//
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

//props
import { type SupplyBatchProps } from "@/interface/data";
import { formatDate } from "@/utils/date";
interface Props {
  lastCursor: string | null;
  limit: string;
  list: SupplyBatchProps[];
}

interface ListProps {
  query: string;
}

const InventoryList = ({ query }: ListProps) => {
  const auth = useAuth();

  const { containerId } = useParams();
  const {
    data,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    hasNextPage,
  } = useInfiniteQuery<Props>({
    queryFn: ({ pageParam }) =>
      getList(
        auth.token as string,
        query,
        pageParam as string | null,
        "20",
        containerId as string,
      ),
    queryKey: ["container-list", containerId, query],
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.lastCursor,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const nav = useNavigate();
  const { ref, inView } = useInView({
    threshold: 0,
  });

  useEffect(() => {
    refetch();
  }, [query, refetch]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allItems = data?.pages.flatMap((page) => page.list) || [];
  const totalItems = allItems.length;
  const hasItems = totalItems > 0;

  if (isFetching && !data) {
    return (
      <div className="divide-y divide-gray-100">
        <div className="px-3 py-2 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-xs font-semibold text-gray-600">Lists</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
              <span className="text-[10px] text-gray-400">Loading...</span>
            </div>
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!hasItems && !isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-12 h-12 mb-3 rounded-full bg-gray-100 flex items-center justify-center">
          <Search className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-700 mb-1">
          {query ? "No lists found" : "No lists available"}
        </h3>
        <p className="text-xs text-gray-500">
          {query
            ? "Try a different search term"
            : "Create your first list to get started"}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {/* Header */}
      <div className="px-3 py-2 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-xs font-semibold text-gray-600">
              Lists ({totalItems})
            </span>
          </div>
          {isFetching && !isFetchingNextPage && (
            <div className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
              <span className="text-[10px] text-gray-400">Updating...</span>
            </div>
          )}
        </div>
      </div>

      {/* List Items */}
      {allItems.map((item, index) => (
        <div
          onClick={() => nav(`list/${item.id}`)}
          key={`${item.id}-${index}`}
          className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors group"
        >
          {/* Serial Number */}
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-medium text-gray-600 flex-shrink-0">
            {index + 1}
          </div>

          {/* Icon */}
          <div className="p-1.5 bg-blue-100 rounded-md group-hover:bg-blue-200 transition-colors flex-shrink-0">
            <FolderOpen className="h-3.5 w-3.5 text-blue-600" />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
              {item.title}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {item._count.SupplyStockTrack || 0} items
                </span>
              </div>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {formatDate(item.timestamp)}
                </span>
              </div>
            </div>
          </div>

          {/* Data Set Badge */}
          <Badge
            variant="outline"
            className="text-[10px] px-2 py-0 flex-shrink-0"
          >
            Default
          </Badge>
        </div>
      ))}

      {/* Infinite scroll trigger */}
      <div ref={ref} className="py-3 text-center">
        {isFetchingNextPage ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="text-xs text-gray-500">Loading more lists...</span>
          </div>
        ) : !hasNextPage && totalItems > 0 ? (
          <div className="text-xs text-gray-400">
            All {totalItems} lists loaded
          </div>
        ) : hasNextPage ? (
          <div className="h-1" />
        ) : null}
      </div>
    </div>
  );
};

export default InventoryList;
