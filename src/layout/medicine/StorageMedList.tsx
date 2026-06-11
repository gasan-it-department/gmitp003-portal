import { useState } from "react";
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
import { Search, PenLine, Loader2, Package } from "lucide-react";

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
  const [query] = useDebounce(text, 600);
  const nav = useNavigate();

  const {
    data,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["medStorage-list", storageId, query],
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
    // Refetch when this list remounts (e.g. after navigating back from
    // StorageMedUpdate). The Update route invalidates this key, but with
    // refetchOnMount disabled the stale cache would be shown until manual
    // refresh.
    refetchOnMount: "always",
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetching && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });

  const allMedicines = data?.pages.flatMap((page) => page.list) || [];
  const totalCount = allMedicines.length;

  return (
    <div className="w-full h-full flex flex-col">

      {/* Toolbar */}
      <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Package className="h-3 w-3 text-blue-500" />
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-gray-800">
              Medicine Stock
            </h4>
            <p className="text-[10px] text-gray-500 leading-none mt-0.5">
              {totalCount} item{totalCount !== 1 ? "s" : ""} shown
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <InputGroup className="bg-white w-48">
            <InputGroupAddon>
              <Search className="h-3 w-3 text-gray-400" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search medicines..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="h-7 text-[11px]"
            />
          </InputGroup>
          <PrintMedicineReport storageId={storageId as string} />
          <Button
            onClick={() => nav(`update`)}
            size="sm"
            className="h-7 text-[10px] gap-1.5 bg-blue-600 hover:bg-blue-700"
          >
            <PenLine className="h-3 w-3" />
            <span className="hidden sm:inline">Update</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="bg-gray-50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="text-[10px] font-semibold text-gray-700 w-10">
                No
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[100px]">
                Serial Number
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[150px]">
                Label
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 text-center w-16">
                Stock
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[100px]">
                Stock to Expire
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 text-center w-20">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isFetching && !data ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center gap-1.5 text-gray-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span className="text-[10px]">Loading medicines...</span>
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
                <TableCell colSpan={6} className="text-center py-10">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Search className="h-5 w-5 text-gray-300" />
                    </div>
                    <p className="text-xs font-medium text-gray-600">
                      No items found
                    </p>
                    <p className="text-[10px] text-gray-400 max-w-[240px]">
                      {query
                        ? "Try a different search term."
                        : "No medicines in this storage yet."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {hasNextPage && (
              <TableRow ref={ref}>
                <TableCell colSpan={6} className="text-center py-2">
                  {isFetchingNextPage ? (
                    <div className="flex items-center justify-center gap-1.5 text-gray-400">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-[10px]">Loading more...</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-400">
                      Scroll to load more
                    </span>
                  )}
                </TableCell>
              </TableRow>
            )}

            {!hasNextPage && allMedicines.length > 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-2 border-t">
                  <span className="text-[10px] text-gray-400">
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
  );
};

export default StorageMedList;
