import { useState, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";
import { useNavigate } from "react-router";
import { getStorageMeds } from "@/db/statement";

import {
  Table,
  TableCell,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import StorageMedItem from "./item/StorageMedItem";
import PrintMedicineReport from "./PrintMedicineReport";
import { Search, PenLine } from "lucide-react";

import type { Medicine, ProtectedRouteProps } from "@/interface/data";

interface Props {
  storageId: string | undefined;
  auth: ProtectedRouteProps;
  lineId: string;
}

interface ListProps {
  list: Medicine[];
  lastCursor: string | null;
  hasMore: boolean;
}

const StorageMedList = ({ storageId, auth, lineId }: Props) => {
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 1000);
  const nav = useNavigate();
  const { inView, ref } = useInView();

  const {
    data,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["medStorage-list", storageId],
    queryFn: ({ pageParam }) =>
      getStorageMeds(
        auth.token as string,
        storageId as string,
        pageParam as string | null,
        "20",
        query,
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    enabled: !!storageId,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetching, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    refetch();
  }, [query, refetch]);

  const allMedicines = data?.pages.flatMap((page) => page.list) || [];
  const totalCount = allMedicines.length;

  return (
    <div className="w-full h-full flex flex-col p-2 sm:p-3 md:p-4 gap-2 sm:gap-3 md:gap-4 bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section - Mobile Responsive */}
      <div className="border rounded-lg p-3 sm:p-4 bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
              Medicine Stock
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Total: {totalCount} item{totalCount !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full sm:w-64">
              <InputGroup className="bg-white">
                <InputGroupAddon>
                  <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Search medicines..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="text-xs sm:text-sm h-8 sm:h-9"
                />
              </InputGroup>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <PrintMedicineReport storageId={storageId as string} />
              <Button
                onClick={() => nav(`update`)}
                size="sm"
                className="gap-1.5 h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-initial"
              >
                <PenLine className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Update</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section - Mobile Responsive with Horizontal Scroll */}
      <div className="flex-1 overflow-hidden border rounded-lg bg-white shadow-sm">
        <div className="overflow-auto h-full">
          <div className="min-w-[600px] md:min-w-0">
            <Table>
              <TableHeader className="bg-gray-50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="font-semibold text-gray-700 w-12 text-xs sm:text-sm">
                    No
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm min-w-[100px]">
                    Serial Number
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm min-w-[150px]">
                    Label
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 text-center text-xs sm:text-sm w-16">
                    Stock
                  </TableHead>
                  {/* <TableHead className="font-semibold text-gray-700 text-center text-xs sm:text-sm w-16">
                    UoM
                  </TableHead> */}
                  <TableHead className="font-semibold text-gray-700 text-xs sm:text-sm min-w-[100px]">
                    Stock to Expire
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 text-center text-xs sm:text-sm w-20">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isFetching && !data ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 sm:py-12"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-600"></div>
                        <span className="text-xs sm:text-sm text-gray-600">
                          Loading...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : allMedicines.length > 0 ? (
                  allMedicines.map((item, i) => (
                    <StorageMedItem
                      storageId={storageId as string}
                      key={item.id}
                      item={item}
                      no={i + 1}
                      onMultiSelect={false}
                      lineId={lineId}
                      auth={auth}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 sm:py-12"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Search className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300" />
                        <p className="text-sm sm:text-base text-gray-700 font-medium">
                          No items found
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {query
                            ? "Try a different search term"
                            : "No medicines in this storage"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* Infinite scroll trigger */}
                {hasNextPage && (
                  <TableRow ref={ref}>
                    <TableCell colSpan={7} className="text-center py-3 sm:py-4">
                      {isFetchingNextPage ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-b-2 border-blue-600"></div>
                          <span className="text-xs sm:text-sm text-gray-600">
                            Loading more...
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs sm:text-sm text-gray-500">
                          Scroll to load more
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )}

                {!hasNextPage && allMedicines.length > 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-3 sm:py-4 border-t"
                    >
                      <span className="text-xs sm:text-sm text-gray-500">
                        Showing all {allMedicines.length} item
                        {allMedicines.length !== 1 ? "s" : ""}
                      </span>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorageMedList;
