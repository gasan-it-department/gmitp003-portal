import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { useParams, useNavigate } from "react-router";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Loader2, Search, FolderOpen, Package, Calendar } from "lucide-react";
//
import { getList } from "@/db/statement";

//
import {
  Table,
  TableBody,
  TableHead,
  TableCell,
  TableRow,
  TableHeader,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

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
        containerId as string
      ),
    queryKey: ["container-list", containerId, query],
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.lastCursor,
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

  return (
    <div className="w-full h-full">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Lists ({totalItems})
          </CardTitle>
          {isFetching && !isFetchingNextPage && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Loading lists...</span>
            </div>
          )}
        </div>
      </CardHeader>

      <ScrollArea className="h-[calc(100vh-360px)]">
        <Table>
          <TableHeader className="sticky top-0 bg-gray-50 z-10">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16 text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">
                No.
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">
                List Title
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">
                Data Set
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">
                Items
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
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="border-r">
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                </TableRow>
              ))
            ) : hasItems ? (
              <>
                {allItems.map((item, index) => (
                  <TableRow
                    onClick={() => nav(`list/${item.id}`)}
                    key={`${item.id}-${index}`}
                    className="cursor-pointer hover:bg-blue-50/50 transition-colors group"
                  >
                    <TableCell className="font-medium border-r">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-sm">
                        {index + 1}
                      </div>
                    </TableCell>
                    <TableCell className="border-r">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                          <FolderOpen className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {item.title}
                          </p>
                          {/* {item. && (
                            <p className="text-xs text-gray-500 truncate max-w-xs">
                              {item.description}
                            </p>
                          )} */}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="border-r">
                      <Badge variant="outline" className="text-xs font-normal">
                        Default
                      </Badge>
                    </TableCell>
                    <TableCell className="border-r">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {item._count.SupplyStockTrack || 0}
                        </span>
                        <span className="text-sm text-gray-500">items</span>
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

                {/* Infinite scroll trigger */}
                {hasNextPage && (
                  <TableRow ref={ref} className="hover:bg-transparent">
                    <TableCell colSpan={5} className="h-20 p-0">
                      <div className="flex items-center justify-center h-full border-t">
                        <div className="text-center py-4">
                          {isFetchingNextPage ? (
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                              <span className="text-sm text-gray-600">
                                Loading more lists...
                              </span>
                            </div>
                          ) : (
                            <div className="h-2" /> // Invisible trigger
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* No more items indicator */}
                {!hasNextPage && totalItems > 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="border-t">
                      <div className="flex items-center justify-center py-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border">
                          <FolderOpen className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            All {totalItems} lists loaded
                          </span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ) : (
              // Empty state
              <TableRow>
                <TableCell colSpan={5} className="h-64">
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="p-4 bg-gray-100 rounded-full mb-4">
                      <Search className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      {query ? "No lists found" : "No lists available"}
                    </h3>
                    <p className="text-sm text-gray-500 max-w-sm mb-4">
                      {query
                        ? `No lists match "${query}". Try a different search term.`
                        : "Create your first list to get started with this container."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};

export default InventoryList;
