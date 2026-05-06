import { useAuth } from "@/provider/ProtectedRoute";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Database, Package, Calendar, Loader2, FileText } from "lucide-react";
//libs
import { useInfiniteQuery } from "@tanstack/react-query";

//
import { getDataSets } from "@/db/statement";

//
import { type SuppliesDataSetProps } from "@/interface/data";
import { formatDate } from "@/utils/date";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const DataSetList = () => {
  const { token } = useAuth();
  const { containerId } = useParams();
  const { ref, inView } = useInView();
  const nav = useNavigate();

  const { data, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery<{
      hasMore: boolean;
      lastCursor: string | null;
      list: SuppliesDataSetProps[];
    }>({
      queryKey: ["data-set-list", containerId],
      queryFn: ({ pageParam }) =>
        getDataSets(
          token as string,
          pageParam as string | null,
          "20",
          containerId as string,
        ),
      initialPageParam: null,
      getNextPageParam: (lastPage) => {
        return lastPage.hasMore ? lastPage.lastCursor : undefined;
      },
      enabled: !!containerId && !!token,
    });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allItems = data?.pages.flatMap((page) => page.list) || [];
  const totalItems = allItems.length;

  if (isFetching && !data) {
    return (
      <div className="divide-y divide-gray-100">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-lg" />
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

  if (allItems.length === 0 && !isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-12 h-12 mb-3 rounded-full bg-gray-100 flex items-center justify-center">
          <FileText className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-700 mb-1">
          No data sets found
        </h3>
        <p className="text-xs text-gray-500">
          Create your first data set to get started
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {allItems.map((item, i) => (
        <div
          onClick={() => nav(`${item.id}`)}
          key={item.id}
          className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors group"
        >
          {/* Serial Number */}
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-medium text-gray-600 flex-shrink-0">
            {i + 1}
          </div>

          {/* Icon */}
          <div className="p-1.5 bg-blue-100 rounded-md group-hover:bg-blue-200 transition-colors flex-shrink-0">
            <Database className="h-3.5 w-3.5 text-blue-600" />
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
                  {item._count.supplies} items
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

          {/* Badge (optional) */}
          <Badge
            variant="outline"
            className="text-[10px] px-2 py-0 flex-shrink-0"
          >
            View
          </Badge>
        </div>
      ))}

      {/* Infinite scroll trigger */}
      <div ref={ref} className="py-3 text-center">
        {isFetchingNextPage ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="text-xs text-gray-500">Loading more...</span>
          </div>
        ) : !hasNextPage && totalItems > 0 ? (
          <div className="text-xs text-gray-400">
            All {totalItems} data sets loaded
          </div>
        ) : hasNextPage ? (
          <div className="h-1" />
        ) : null}
      </div>

      {/* Initial loading state */}
      {isFetching && !isFetchingNextPage && totalItems === 0 && (
        <div className="py-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="text-xs text-gray-500">Loading data sets...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSetList;
