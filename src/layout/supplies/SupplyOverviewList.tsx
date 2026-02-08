import { useParams } from "react-router";
import { useState, useEffect, useCallback } from "react";
import { useInView } from "react-intersection-observer"; // Add this import
//layout const components
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import OverviewSupplyItem from "./items/OverviewSupplyItem";
import hotkeys, { type HotkeysEvent } from "hotkeys-js";
//lib/db/statement
import { suppliesOverview } from "@/db/statement";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { ProtectedRouteProps } from "@/interface/data";
import { Spinner } from "@/components/ui/spinner"; // Add this import

//
import { type SupplyStockTrack } from "@/interface/data";
interface Props {
  listId: string | undefined;
  auth: ProtectedRouteProps;
  query: string;
}

const SupplyOverviewList = ({ listId, auth, query }: Props) => {
  const { lineId, containerId } = useParams();
  const [indexed, setIndex] = useState(0);
  const { ref, inView } = useInView(); // Add this hook

  const {
    data,
    isFetching,
    fetchNextPage,
    refetch,
    isFetchingNextPage,
    hasNextPage, // Add this
  } = useInfiniteQuery<{
    list: SupplyStockTrack[];
    hasMore: boolean;
    lastCursor: string | null;
  }>({
    queryFn: ({ pageParam }) =>
      suppliesOverview(
        auth.token as string,
        pageParam,
        "20",
        query,
        "",
        listId as string,
      ),
    queryKey: ["listSupplyOverview", listId],
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined, // Fixed this
  });

  useEffect(() => {
    refetch();
  }, [query]);

  // Add infinite scroll trigger effect
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleHotkeys = useCallback(
    (event: KeyboardEvent, handler: HotkeysEvent) => {
      event.preventDefault();

      if (handler.key === "up") {
        setIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }

      if (handler.key === "down") {
        setIndex((prev) => prev + 1);
      }
    },
    [],
  );

  useEffect(() => {
    hotkeys("up, down", handleHotkeys);

    return () => {
      hotkeys.unbind("up, down", handleHotkeys);
    };
  }, [handleHotkeys]);

  const allItems = data?.pages.flatMap((item) => item.list) || [];
  const totalCount = allItems.length;
  const isLoading = isFetching && !isFetchingNextPage && totalCount === 0;

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="flex-1 overflow-hidden">
        <Table className="w-full">
          <TableHeader className="sticky top-0 bg-gray-800 z-10">
            <TableRow className="hover:bg-gray-800">
              <TableHead className="text-white py-3 px-4">No.</TableHead>
              <TableHead className="text-white py-3 px-4">Ref</TableHead>
              <TableHead className="text-white py-3 px-4">Item</TableHead>
              <TableHead className="text-white py-3 px-4">
                Product/Brand
              </TableHead>
              <TableHead className="text-white py-3 px-4">Stock</TableHead>
              <TableHead className="text-white py-3 px-4">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Spinner className="w-8 h-8" />
                    <p className="text-gray-600">Loading supplies...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : totalCount > 0 ? (
              <>
                {allItems.map((item, i) => (
                  <OverviewSupplyItem
                    key={item.id}
                    index={i}
                    item={item}
                    onSelect={indexed}
                    lineId={lineId as string}
                    token={auth.token as string}
                    userId={auth.userId as string}
                    listId={listId as string}
                    containerId={containerId as string}
                  />
                ))}

                {/* Infinite scroll trigger */}
                <TableRow ref={ref}>
                  <TableCell colSpan={6} className="h-4 p-0">
                    {/* Empty trigger cell */}
                  </TableCell>
                </TableRow>

                {/* Loading more indicator */}
                {isFetchingNextPage && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-4">
                      <div className="flex items-center justify-center gap-3">
                        <Spinner className="w-5 h-5" />
                        <span className="text-sm text-gray-600">
                          Loading more supplies...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* End of list indicator */}
                {!hasNextPage && totalCount > 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-4 text-center border-t"
                    >
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <span className="h-px w-8 bg-gray-300"></span>
                        <span>All supplies loaded</span>
                        <span className="h-px w-8 bg-gray-300"></span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Showing {totalCount} item{totalCount !== 1 ? "s" : ""}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg
                        className="h-8 w-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        No supplies found
                      </h3>
                      <p className="text-gray-500 text-sm">
                        {query
                          ? "Try a different search term"
                          : "No supply items available"}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Error state (when data is undefined) */}
            {!data && !isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="text-gray-500">Failed to load supplies</div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer with summary */}
      {!isLoading && totalCount > 0 && (
        <div className="border-t bg-gray-50 px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600">
              Showing <span className="font-semibold">{totalCount}</span> item
              {totalCount !== 1 ? "s" : ""}
            </div>
            <div className="text-gray-500 text-xs">
              Use ↑ ↓ keys to navigate
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplyOverviewList;
