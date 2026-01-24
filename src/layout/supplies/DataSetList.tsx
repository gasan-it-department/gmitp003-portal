import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
          containerId as string
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

  return (
    <div className="w-full">
      <Table>
        <TableHeader className="sticky top-0 bg-gray-50 z-10">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-16 text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">
              No.
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">
              Data Set Name
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">
              Items Count
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Created Date
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isFetching && !data ? (
            // Loading skeletons
            [...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell className="border-r">
                  <Skeleton className="h-4 w-6" />
                </TableCell>
                <TableCell className="border-r">
                  <Skeleton className="h-4 w-48" />
                </TableCell>
                <TableCell className="border-r">
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
              </TableRow>
            ))
          ) : allItems.length > 0 ? (
            <>
              {allItems.map((item, i) => (
                <TableRow
                  onClick={() => nav(`${item.id}`)}
                  key={item.id}
                  className="cursor-pointer hover:bg-blue-50/50 transition-colors group"
                >
                  <TableCell className="font-medium border-r">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-sm">
                      {i + 1}
                    </div>
                  </TableCell>
                  <TableCell className="border-r">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <Database className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </p>
                        {/* {item.description && (
                          <p className="text-xs text-gray-500 truncate max-w-xs">
                            {item.description}
                          </p>
                        )} */}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="border-r">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <Badge variant="outline" className="text-xs font-normal">
                        {item._count.supplies} items
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </>
          ) : (
            // Empty state
            <TableRow>
              <TableCell colSpan={4} className="h-64">
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <FileText className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    No data sets found
                  </h3>
                  <p className="text-sm text-gray-500 max-w-sm mb-4">
                    Create your first data set to define custom fields and
                    structure for your items.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Infinite scroll trigger */}
      <div ref={ref} className="py-6">
        <div className="text-center">
          {isFetchingNextPage ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-gray-600">
                Loading more data sets...
              </span>
            </div>
          ) : !hasNextPage && totalItems > 0 ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border">
              <Database className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                All {totalItems} data sets loaded
              </span>
            </div>
          ) : hasNextPage ? (
            <div className="h-2" /> // Invisible trigger
          ) : null}
        </div>
      </div>

      {/* Initial loading state */}
      {isFetching && !isFetchingNextPage && totalItems === 0 && (
        <div className="py-4">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-600">Loading data sets...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSetList;
